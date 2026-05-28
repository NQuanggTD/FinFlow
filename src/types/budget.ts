export interface BudgetAlert {
  categoryName: string;
  categoryIcon: string;
  spent: number;
  limit: number;
  percentage: number;
  alertPercent: number;
  isExceeded: boolean;
}
