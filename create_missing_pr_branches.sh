#!/bin/bash

set -e

echo "Creating only missing PR branches..."

git checkout main
git pull origin main

# delete local versions only if they exist
git branch -D pr-js-order-validation 2>/dev/null || true
git branch -D pr-python-monthly-report 2>/dev/null || true

# ---------------- Missing PR 1 ----------------
git checkout -b pr-js-order-validation

python - <<'PY'
path = "src/js/orderService.js"

text = open(path).read()

old = '''    let total = 0;

    for (let item of items) {
      total += item.price * item.quantity;
    }'''

new = '''    if (!items || items.length === 0) {
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

if old not in text:
    raise Exception("Expected code block not found in src/js/orderService.js")

text = text.replace(old, new)

open(path, "w").write(text)
PY

git add .
git commit -m "Add JavaScript order validation"
git push -u origin pr-js-order-validation

# ---------------- Missing PR 2 ----------------
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

git checkout main

echo "Done. Now refresh GitHub Pull Requests page."
