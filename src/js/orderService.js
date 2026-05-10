class OrderService {
  constructor(database, paymentGateway, logger) {
    this.database = database;
    this.paymentGateway = paymentGateway;
    this.logger = logger;
  }

  async createOrder(userId, items, address) {
    if (!userId) {
      throw new Error("User id is required");
    }

    if (!items || items.length === 0) {
      throw new Error("Order must contain at least one item");
    }

    let total = 0;

    for (let item of items) {
      if (item.quantity <= 0) {
        throw new Error("Invalid quantity");
      }

      if (item.price < 0) {
        throw new Error("Invalid price");
      }

      total += item.price * item.quantity;
    }

    const order = {
      userId,
      items,
      address,
      total,
      status: "PENDING",
      createdAt: new Date().toISOString()
    };

    const savedOrder = await this.database.orders.insert(order);

    const payment = await this.paymentGateway.createPayment({
      amount: total,
      orderId: savedOrder.id
    });

    savedOrder.paymentId = payment.id;
    await this.database.orders.update(savedOrder.id, savedOrder);

    return savedOrder;
  }

  async cancelOrder(orderId, userId) {
    const order = await this.database.orders.findById(orderId);

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.userId !== userId) {
      throw new Error("Unauthorized cancellation");
    }

    if (order.status === "DELIVERED") {
      throw new Error("Delivered orders cannot be cancelled");
    }

    order.status = "CANCELLED";
    order.cancelledAt = new Date().toISOString();

    await this.database.orders.update(orderId, order);

    return order;
  }
}

module.exports = OrderService;
