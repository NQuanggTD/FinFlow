import { z } from "zod";

export const goalSchema = z.object({
  name:          z.string().min(1, "Tên mục tiêu không được để trống").max(100),
  target_amount: z.coerce.number().positive("Số tiền mục tiêu phải lớn hơn 0"),
  deadline:      z.string().min(1, "Vui lòng chọn ngày hoàn thành"),
  priority:      z.coerce.number().int().min(1).max(3).default(1),
});

export type GoalFormData = z.infer<typeof goalSchema>;
