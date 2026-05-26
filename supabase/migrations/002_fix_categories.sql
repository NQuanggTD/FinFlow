-- ══════════════════════════════════════════════════════
-- FinFlow – Fix category icons (Lucide names → emojis)
-- Run this if categories show text names instead of emojis
-- ══════════════════════════════════════════════════════

-- Delete all default categories and re-seed with correct emojis
DELETE FROM categories WHERE is_default = TRUE AND user_id IS NULL;

INSERT INTO categories (id, user_id, name, icon, color, type, is_default) VALUES
  -- EXPENSE
  (uuid_generate_v4(), NULL, 'Ăn uống',           '🍜', '#F59E0B', 'expense', TRUE),
  (uuid_generate_v4(), NULL, 'Di chuyển',          '🚗', '#3B82F6', 'expense', TRUE),
  (uuid_generate_v4(), NULL, 'Nhà ở',              '🏠', '#8B5CF6', 'expense', TRUE),
  (uuid_generate_v4(), NULL, 'Mua sắm',            '🛍️', '#EC4899', 'expense', TRUE),
  (uuid_generate_v4(), NULL, 'Giải trí',           '🎮', '#06B6D4', 'expense', TRUE),
  (uuid_generate_v4(), NULL, 'Y tế',               '💊', '#EF4444', 'expense', TRUE),
  (uuid_generate_v4(), NULL, 'Giáo dục',           '📚', '#10B981', 'expense', TRUE),
  (uuid_generate_v4(), NULL, 'Điện thoại & Net',   '📱', '#6366F1', 'expense', TRUE),
  (uuid_generate_v4(), NULL, 'Tiện ích',           '💡', '#F97316', 'expense', TRUE),
  (uuid_generate_v4(), NULL, 'Du lịch',            '✈️', '#14B8A6', 'expense', TRUE),
  (uuid_generate_v4(), NULL, 'Thể thao',           '⚽', '#84CC16', 'expense', TRUE),
  (uuid_generate_v4(), NULL, 'Cà phê & Đồ uống',  '☕', '#92400E', 'expense', TRUE),
  (uuid_generate_v4(), NULL, 'Sức khoẻ & Gym',    '🏋️', '#DC2626', 'expense', TRUE),
  (uuid_generate_v4(), NULL, 'Quà tặng',           '🎁', '#DB2777', 'expense', TRUE),
  (uuid_generate_v4(), NULL, 'Khác (Chi)',         '💸', '#9CA3AF', 'expense', TRUE),
  -- INCOME
  (uuid_generate_v4(), NULL, 'Lương',              '💰', '#10B981', 'income',  TRUE),
  (uuid_generate_v4(), NULL, 'Thưởng',             '🎁', '#F59E0B', 'income',  TRUE),
  (uuid_generate_v4(), NULL, 'Đầu tư',             '📈', '#3B82F6', 'income',  TRUE),
  (uuid_generate_v4(), NULL, 'Freelance',          '💻', '#8B5CF6', 'income',  TRUE),
  (uuid_generate_v4(), NULL, 'Kinh doanh phụ',    '🏪', '#F97316', 'income',  TRUE),
  (uuid_generate_v4(), NULL, 'Thu nhập khác',      '💵', '#9CA3AF', 'income',  TRUE)
ON CONFLICT DO NOTHING;
