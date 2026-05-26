-- Fix: convert goals.priority from enum (priority_level) to SMALLINT.
-- The app code uses integers 1/2/3 but the DB has an enum type.

-- Step 1: drop views that depend on goals.priority
DROP VIEW IF EXISTS goal_progress;

-- Step 2: drop the enum default (can't auto-cast)
ALTER TABLE goals ALTER COLUMN priority DROP DEFAULT;

-- Step 3: convert enum → SMALLINT
ALTER TABLE goals
  ALTER COLUMN priority TYPE SMALLINT USING
    CASE priority::text
      WHEN 'low'    THEN 1
      WHEN 'medium' THEN 2
      WHEN 'high'   THEN 3
      WHEN '1'      THEN 1
      WHEN '2'      THEN 2
      WHEN '3'      THEN 3
      ELSE 1
    END;

-- Step 4: restore default and add constraint
ALTER TABLE goals ALTER COLUMN priority SET DEFAULT 1;
ALTER TABLE goals ADD CONSTRAINT goals_priority_range CHECK (priority BETWEEN 1 AND 3);

-- Step 5: drop the enum type
DROP TYPE IF EXISTS priority_level;

-- Step 6: recreate goal_progress view (priority is now SMALLINT, no cast needed)
CREATE OR REPLACE VIEW goal_progress AS
SELECT
  id,
  user_id,
  name,
  target_amount,
  current_amount,
  ROUND((current_amount / NULLIF(target_amount, 0)) * 100, 1) AS progress_percent,
  (target_amount - current_amount)                             AS remaining_amount,
  deadline,
  priority,
  status,
  (deadline - CURRENT_DATE)                                   AS days_remaining,
  CASE
    WHEN (deadline - CURRENT_DATE) > 0 AND status::text = 'active'
    THEN ROUND(
      (target_amount - current_amount) /
      GREATEST(CEIL(((deadline - CURRENT_DATE)::numeric / 30)), 1),
      0
    )
    ELSE 0
  END AS monthly_deposit_needed,
  created_at
FROM goals
WHERE is_deleted = false;
