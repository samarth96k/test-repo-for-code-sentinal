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
        if revenue < 0:
            raise ValueError("Revenue cannot be negative")

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
