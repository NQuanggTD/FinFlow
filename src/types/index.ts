export * from "./database";

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  badge?: string;
}

export interface DashboardSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlySaving: number;
  savingRate: number;
}

export interface ChartDataPoint {
  label: string;
  income: number;
  expense: number;
}

export interface CategorySpending {
  category: string;
  amount: number;
  color: string;
  percentage: number;
}

export interface BudgetWithUsage {
  id: string;
  category_id: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  amount_limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  alert_at_percent: number;
}

export interface AIInsight {
  type: "tip" | "warning" | "achievement";
  title: string;
  description: string;
  action?: string;
}
