#!/bin/bash

set -e

echo "Generating CodeSentinal test repo files..."

git checkout -B main

mkdir -p src/js src/python src/java src/cpp docs

cat > README.md <<'EOF'
# CodeSentinal Test Repo

This repository is created to test GitHub AI PR review automation.

It contains realistic files in:
- JavaScript
- Python
- Java
- C++

Multiple branches will be pushed so that pull requests can be created manually.
EOF

cat > src/js/orderService.js <<'EOF'
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

    let total = 0;

    for (let item of items) {
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
EOF

cat > src/python/analytics.py <<'EOF'
import csv
from datetime import datetime
from collections import defaultdict

class SalesAnalytics:
    def __init__(self, file_path):
        self.file_path = file_path
        self.rows = []

    def load_data(self):
        with open(self.file_path, "r") as file:
            reader = csv.DictReader(file)
            for row in reader:
                row["amount"] = float(row["amount"])
                row["quantity"] = int(row["quantity"])
                row["date"] = datetime.strptime(row["date"], "%Y-%m-%d")
                self.rows.append(row)

    def total_revenue(self):
        revenue = 0
        for row in self.rows:
            revenue += row["amount"] * row["quantity"]
        return revenue

    def revenue_by_category(self):
        result = defaultdict(float)
        for row in self.rows:
            result[row["category"]] += row["amount"] * row["quantity"]
        return dict(result)

    def best_selling_product(self):
        product_sales = defaultdict(int)

        for row in self.rows:
            product_sales[row["product"]] += row["quantity"]

        best_product = None
        best_count = 0

        for product, count in product_sales.items():
            if count > best_count:
                best_product = product
                best_count = count

        return {
            "product": best_product,
            "quantity": best_count
        }
EOF

cat > src/java/UserManager.java <<'EOF'
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

class User {
    private int id;
    private String name;
    private String email;
    private String role;

    public User(int id, String name, String email, String role) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
    }

    public int getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getRole() {
        return role;
    }

    public String getName() {
        return name;
    }
}

public class UserManager {
    private List<User> users = new ArrayList<>();

    public void addUser(User user) {
        for (User existingUser : users) {
            if (existingUser.getEmail().equals(user.getEmail())) {
                throw new IllegalArgumentException("Email already exists");
            }
        }

        users.add(user);
    }

    public Optional<User> findUserByEmail(String email) {
        for (User user : users) {
            if (user.getEmail().equals(email)) {
                return Optional.of(user);
            }
        }

        return Optional.empty();
    }

    public List<User> getAdmins() {
        List<User> admins = new ArrayList<>();

        for (User user : users) {
            if (user.getRole().equals("ADMIN")) {
                admins.add(user);
            }
        }

        return admins;
    }

    public boolean deleteUser(int id) {
        for (User user : users) {
            if (user.getId() == id) {
                users.remove(user);
                return true;
            }
        }

        return false;
    }
}
EOF

cat > src/cpp/cache.cpp <<'EOF'
#include <iostream>
#include <unordered_map>
#include <list>
using namespace std;

class LRUCache {
private:
    int capacity;
    list<int> usage;
    unordered_map<int, pair<int, list<int>::iterator>> cache;

public:
    LRUCache(int cap) {
        capacity = cap;
    }

    int get(int key) {
        if (cache.find(key) == cache.end()) {
            return -1;
        }

        usage.erase(cache[key].second);
        usage.push_front(key);
        cache[key].second = usage.begin();

        return cache[key].first;
    }

    void put(int key, int value) {
        if (cache.find(key) != cache.end()) {
            usage.erase(cache[key].second);
        } else if (cache.size() >= capacity) {
            int leastUsed = usage.back();
            usage.pop_back();
            cache.erase(leastUsed);
        }

        usage.push_front(key);
        cache[key] = {value, usage.begin()};
    }

    void printCache() {
        for (int key : usage) {
            cout << key << " ";
        }

        cout << endl;
    }
};
EOF

git add .
git commit -m "Initial realistic multi-language codebase"
git push -u origin main

echo "Creating branch 1..."

git checkout -b pr-js-order-validation

python - <<'PY'
path = "src/js/orderService.js"
text = open(path).read()
text = text.replace(
'''    let total = 0;

    for (let item of items) {
      total += item.price * item.quantity;
    }''',
'''    if (!items || items.length === 0) {
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
    }'''
)
open(path, "w").write(text)
PY

git add .
git commit -m "Add JavaScript order validation"
git push -u origin pr-js-order-validation

echo "Creating branch 2..."

git checkout main
git checkout -b pr-python-monthly-report

cat >> src/python/analytics.py <<'EOF'

    def monthly_revenue_report(self):
        monthly = defaultdict(float)

        for row in self.rows:
            month_key = row["date"].strftime("%Y-%m")
            monthly[month_key] += row["amount"] * row["quantity"]

        report = []

        for month, revenue in monthly.items():
            report.append({
                "month": month,
                "revenue": revenue
            })

        return sorted(report, key=lambda item: item["month"])
EOF

git add .
git commit -m "Add Python monthly revenue report"
git push -u origin pr-python-monthly-report

echo "Creating branch 3..."

git checkout main
git checkout -b pr-java-delete-user-bug

python - <<'PY'
path = "src/java/UserManager.java"
text = open(path).read()
text = text.replace(
'''    public boolean deleteUser(int id) {
        for (User user : users) {
            if (user.getId() == id) {
                users.remove(user);
                return true;
            }
        }

        return false;
    }''',
'''    public boolean deleteUser(int id) {
        for (User user : users) {
            if (user.getId() == id) {
                users.remove(user);
            }
        }

        return true;
    }'''
)
open(path, "w").write(text)
PY

git add .
git commit -m "Modify Java user deletion logic"
git push -u origin pr-java-delete-user-bug

echo "Creating branch 4..."

git checkout main
git checkout -b pr-cpp-cache-stats

python - <<'PY'
path = "src/cpp/cache.cpp"
text = open(path).read()

text = text.replace(
'''private:
    int capacity;
    list<int> usage;
    unordered_map<int, pair<int, list<int>::iterator>> cache;''',
'''private:
    int capacity;
    int hits = 0;
    int misses = 0;
    list<int> usage;
    unordered_map<int, pair<int, list<int>::iterator>> cache;'''
)

text = text.replace(
'''        if (cache.find(key) == cache.end()) {
            return -1;
        }''',
'''        if (cache.find(key) == cache.end()) {
            misses++;
            return -1;
        }

        hits++;'''
)

text = text.replace(
'''    void printCache() {
        for (int key : usage) {
            cout << key << " ";
        }

        cout << endl;
    }''',
'''    void printCache() {
        for (int key : usage) {
            cout << key << " ";
        }

        cout << endl;
    }

    void printStats() {
        cout << "Hits: " << hits << endl;
        cout << "Misses: " << misses << endl;
    }'''
)

open(path, "w").write(text)
PY

git add .
git commit -m "Add C++ cache statistics"
git push -u origin pr-cpp-cache-stats

echo "Creating branch 5..."

git checkout main
git checkout -b pr-multifile-review-test

cat > docs/review-testing-guide.md <<'EOF'
# CodeSentinal Review Testing Guide

This file explains what the generated pull requests are meant to test.

The reviewer should check:
1. Pull request metadata
2. Changed files
3. Patch contents
4. Full source file contents
5. Inline review comments
6. Multi-file PR handling
7. Summary generation
EOF

python - <<'PY'
js_path = "src/js/orderService.js"
js = open(js_path).read()
js = js.replace(
'''    const savedOrder = await this.database.orders.insert(order);''',
'''    this.logger.info("Creating order for user: " + userId);

    const savedOrder = await this.database.orders.insert(order);'''
)
open(js_path, "w").write(js)

py_path = "src/python/analytics.py"
py = open(py_path).read()
py = py.replace(
'''        return revenue''',
'''        if revenue < 0:
            raise ValueError("Revenue cannot be negative")

        return revenue'''
)
open(py_path, "w").write(py)
PY

git add .
git commit -m "Add multi-file review testing changes"
git push -u origin pr-multifile-review-test

git checkout main

echo "DONE"
echo "Now manually create PRs on GitHub from these branches:"
echo "1. pr-js-order-validation"
echo "2. pr-python-monthly-report"
echo "3. pr-java-delete-user-bug"
echo "4. pr-cpp-cache-stats"
echo "5. pr-multifile-review-test"
