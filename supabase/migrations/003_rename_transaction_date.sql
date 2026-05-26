-- Fix: drop views that depend on transaction_date, drop the redundant column,
-- then recreate views using the correct "date" column.

-- Step 1: drop dependent views
DROP VIEW IF EXISTS budget_usage;
DROP VIEW IF EXISTS monthly_summary;

-- Step 2: drop the redundant column (date already exists from 001_initial_schema.sql)
ALTER TABLE transactions DROP COLUMN IF EXISTS transaction_date;

-- Step 3: recreate monthly_summary using "date"
CREATE OR REPLACE VIEW monthly_summary AS
SELECT
  user_id,
  EXTRACT(month FROM date)::integer AS month,
  EXTRACT(year  FROM date)::integer AS year,
  COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS total_income,
  COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense,
  COALESCE(
    SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) -
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END),
    0
  ) AS net_savings
FROM transactions
WHERE is_deleted = false
GROUP BY user_id,
         EXTRACT(month FROM date)::integer,
         EXTRACT(year  FROM date)::integer;

-- Step 4: recreate budget_usage using "date"
CREATE OR REPLACE VIEW budget_usage AS
SELECT
  b.id,
  b.user_id,
  b.category_id,
  b.amount_limit,
  b.month,
  b.year,
  b.alert_at_percent,
  c.name  AS category_name,
  c.icon  AS category_icon,
  c.color AS category_color,
  COALESCE(spent.total, 0)                                                        AS amount_spent,
  ROUND((COALESCE(spent.total, 0) / b.amount_limit) * 100, 1)                    AS usage_percent,
  b.amount_limit - COALESCE(spent.total, 0)                                       AS amount_remaining
FROM budgets b
JOIN categories c ON c.id = b.category_id
LEFT JOIN LATERAL (
  SELECT COALESCE(SUM(t.amount), 0) AS total
  FROM transactions t
  WHERE t.user_id      = b.user_id
    AND t.category_id  = b.category_id
    AND t.type         = 'expense'
    AND t.is_deleted   = false
    AND EXTRACT(month FROM t.date) = b.month
    AND EXTRACT(year  FROM t.date) = b.year
) spent ON true;
