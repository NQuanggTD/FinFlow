import { z } from "zod";

export const transactionSchema = z.object({
  account_id:   z.string().uuid("Vui lòng chọn tài khoản"),
  category_id:  z.string().uuid("Vui lòng chọn danh mục"),
  amount:       z.coerce.number().positive("Số tiền phải lớn hơn 0"),
  type:         z.enum(["income", "expense"]),
  note:         z.string().max(500, "Ghi chú tối đa 500 ký tự").optional(),
  date:         z.string().min(1, "Vui lòng chọn ngày"),
  is_recurring: z.coerce.boolean().default(false),
});

export type TransactionFormData = z.infer<typeof transactionSchema>;
