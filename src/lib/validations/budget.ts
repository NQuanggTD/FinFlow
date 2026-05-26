import { z } from "zod";

const currentYear = new Date().getFullYear();

export const budgetSchema = z.object({
  category_id:      z.string().uuid("Vui lòng chọn danh mục"),
  amount_limit:     z.coerce.number().positive("Hạn mức phải lớn hơn 0"),
  month:            z.coerce.number().int().min(1).max(12),
  year:             z.coerce.number().int().min(currentYear),
  alert_at_percent: z.coerce.number().int().min(50).max(100).default(80),
});

export type BudgetFormData = z.infer<typeof budgetSchema>;
