-- ══════════════════════════════════════════════════════
-- FinFlow – Safe Migration (IF NOT EXISTS everywhere)
-- Có thể chạy nhiều lần mà không bị lỗi
-- ══════════════════════════════════════════════════════

-- ── Extensions ──────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Tables ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  avatar_url  TEXT,
  currency    TEXT NOT NULL DEFAULT 'VND',
  timezone    TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('bank','cash','wallet')),
  balance     NUMERIC(15,0) NOT NULL DEFAULT 0,
  color       TEXT NOT NULL DEFAULT '#4F46E5',
  icon        TEXT NOT NULL DEFAULT '🏦',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  icon        TEXT NOT NULL DEFAULT '💳',
  color       TEXT NOT NULL DEFAULT '#6B7280',
  parent_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  type        TEXT NOT NULL CHECK (type IN ('income','expense'))
);

CREATE TABLE IF NOT EXISTS transactions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id   UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  category_id  UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  amount       NUMERIC(15,0) NOT NULL CHECK (amount > 0),
  type         TEXT NOT NULL CHECK (type IN ('income','expense')),
  note         TEXT,
  receipt_url  TEXT,
  date         DATE NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budgets (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id      UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  amount_limit     NUMERIC(15,0) NOT NULL CHECK (amount_limit > 0),
  month            SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year             SMALLINT NOT NULL CHECK (year >= 2020),
  alert_at_percent SMALLINT NOT NULL DEFAULT 80 CHECK (alert_at_percent BETWEEN 1 AND 100),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, category_id, month, year)
);

CREATE TABLE IF NOT EXISTS goals (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  target_amount  NUMERIC(15,0) NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC(15,0) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  deadline       DATE NOT NULL,
  priority       SMALLINT NOT NULL DEFAULT 1 CHECK (priority BETWEEN 1 AND 3),
  cover_url      TEXT,
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','paused')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS flow_scores (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score             NUMERIC(5,2) NOT NULL CHECK (score BETWEEN 0 AND 100),
  saving_rate       NUMERIC(5,2) NOT NULL DEFAULT 0,
  budget_adherence  NUMERIC(5,2) NOT NULL DEFAULT 0,
  goal_progress     NUMERIC(5,2) NOT NULL DEFAULT 0,
  calculated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Triggers ────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at     ON profiles;
DROP TRIGGER IF EXISTS trg_transactions_updated_at  ON transactions;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_new_user ON auth.users;
CREATE TRIGGER trg_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Indexes ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions (user_id, date DESC) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_transactions_category  ON transactions (category_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_transactions_account   ON transactions (account_id)  WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_budgets_user_month     ON budgets (user_id, year, month);
CREATE INDEX IF NOT EXISTS idx_goals_user_status      ON goals (user_id, status);
CREATE INDEX IF NOT EXISTS idx_flow_scores_user       ON flow_scores (user_id, calculated_at DESC);

-- ── Row Level Security ───────────────────────────────
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals        ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_scores  ENABLE ROW LEVEL SECURITY;

-- profiles
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- accounts
DROP POLICY IF EXISTS "accounts_all_own" ON accounts;
CREATE POLICY "accounts_all_own" ON accounts
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- categories (user sees own + system defaults)
DROP POLICY IF EXISTS "categories_select" ON categories;
DROP POLICY IF EXISTS "categories_insert" ON categories;
DROP POLICY IF EXISTS "categories_update" ON categories;
DROP POLICY IF EXISTS "categories_delete" ON categories;
CREATE POLICY "categories_select" ON categories FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "categories_insert" ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "categories_update" ON categories FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "categories_delete" ON categories FOR DELETE
  USING (auth.uid() = user_id);

-- transactions
DROP POLICY IF EXISTS "transactions_select_own" ON transactions;
DROP POLICY IF EXISTS "transactions_insert_own" ON transactions;
DROP POLICY IF EXISTS "transactions_update_own" ON transactions;
DROP POLICY IF EXISTS "transactions_delete_own" ON transactions;
CREATE POLICY "transactions_select_own" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transactions_insert_own" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions_update_own" ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "transactions_delete_own" ON transactions FOR DELETE USING (auth.uid() = user_id);

-- budgets
DROP POLICY IF EXISTS "budgets_all_own" ON budgets;
CREATE POLICY "budgets_all_own" ON budgets
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- goals
DROP POLICY IF EXISTS "goals_all_own" ON goals;
CREATE POLICY "goals_all_own" ON goals
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- flow_scores
DROP POLICY IF EXISTS "flow_scores_all_own" ON flow_scores;
CREATE POLICY "flow_scores_all_own" ON flow_scores
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Seed default categories (skip if already exists) ─
INSERT INTO categories (id, user_id, name, icon, color, type, is_default) VALUES
  (uuid_generate_v4(), NULL, 'Ăn uống',        '🍜', '#F59E0B', 'expense', TRUE),
  (uuid_generate_v4(), NULL, 'Di chuyển',       '🚗', '#3B82F6', 'expense', TRUE),
  (uuid_generate_v4(), NULL, 'Nhà ở',           '🏠', '#8B5CF6', 'expense', TRUE),
  (uuid_generate_v4(), NULL, 'Mua sắm',         '🛍️', '#EC4899', 'expense', TRUE),
  (uuid_generate_v4(), NULL, 'Giải trí',        '🎮', '#06B6D4', 'expense', TRUE),
  (uuid_generate_v4(), NULL, 'Y tế',            '💊', '#EF4444', 'expense', TRUE),
  (uuid_generate_v4(), NULL, 'Giáo dục',        '📚', '#10B981', 'expense', TRUE),
  (uuid_generate_v4(), NULL, 'Điện thoại & Net','📱', '#6366F1', 'expense', TRUE),
  (uuid_generate_v4(), NULL, 'Tiện ích',        '💡', '#F97316', 'expense', TRUE),
  (uuid_generate_v4(), NULL, 'Du lịch',         '✈️', '#14B8A6', 'expense', TRUE),
  (uuid_generate_v4(), NULL, 'Thể thao',        '⚽', '#84CC16', 'expense', TRUE),
  (uuid_generate_v4(), NULL, 'Khác (Chi)',      '💸', '#9CA3AF', 'expense', TRUE),
  (uuid_generate_v4(), NULL, 'Lương',           '💰', '#10B981', 'income',  TRUE),
  (uuid_generate_v4(), NULL, 'Thưởng',          '🎁', '#F59E0B', 'income',  TRUE),
  (uuid_generate_v4(), NULL, 'Đầu tư',          '📈', '#3B82F6', 'income',  TRUE),
  (uuid_generate_v4(), NULL, 'Freelance',       '💻', '#8B5CF6', 'income',  TRUE),
  (uuid_generate_v4(), NULL, 'Quà tặng',        '🎀', '#EC4899', 'income',  TRUE),
  (uuid_generate_v4(), NULL, 'Khác (Thu)',      '💵', '#9CA3AF', 'income',  TRUE)
ON CONFLICT DO NOTHING;

-- ── Storage Buckets ──────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('receipts', 'receipts', FALSE, 5242880,  ARRAY['image/jpeg','image/png','image/webp','image/heic']),
  ('avatars',  'avatars',  TRUE,  2097152,  ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS for receipts
DROP POLICY IF EXISTS "receipts_select_own" ON storage.objects;
DROP POLICY IF EXISTS "receipts_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "receipts_delete_own" ON storage.objects;
CREATE POLICY "receipts_select_own" ON storage.objects FOR SELECT
  USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "receipts_insert_own" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "receipts_delete_own" ON storage.objects FOR DELETE
  USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage RLS for avatars
DROP POLICY IF EXISTS "avatars_select_public" ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert_own"    ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_own"    ON storage.objects;
CREATE POLICY "avatars_select_public" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
CREATE POLICY "avatars_insert_own" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars_delete_own" ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ══════════════════════════════════════════════════════
-- Done! Safe to run multiple times.
-- ══════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════
-- IMPORTANT: If accounts FK fails, run this manually
-- to ensure your profile exists:
-- ══════════════════════════════════════════════════════
-- INSERT INTO profiles (id, currency, timezone)
-- SELECT id, 'VND', 'Asia/Ho_Chi_Minh'
-- FROM auth.users
-- ON CONFLICT (id) DO NOTHING;
