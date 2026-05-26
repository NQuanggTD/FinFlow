export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type TransactionType = "income" | "expense";
export type AccountType     = "bank" | "cash" | "wallet";
export type GoalStatus      = "active" | "completed" | "paused";

// ── Row shapes ─────────────────────────────────────────────────────
export interface ProfileRow {
  id: string; full_name: string | null; avatar_url: string | null;
  currency: string; timezone: string; created_at: string; updated_at: string;
}
export interface AccountRow {
  id: string; user_id: string; name: string; type: AccountType;
  balance: number; color: string; icon: string; is_active: boolean; created_at: string;
}
export interface CategoryRow {
  id: string; user_id: string | null; name: string; icon: string; color: string;
  parent_id: string | null; is_default: boolean; type: TransactionType;
}
export interface TransactionRow {
  id: string; user_id: string; account_id: string; category_id: string;
  amount: number; type: TransactionType; note: string | null; receipt_url: string | null;
  date: string; is_recurring: boolean; is_deleted: boolean; created_at: string; updated_at: string;
}
export interface BudgetRow {
  id: string; user_id: string; category_id: string;
  amount_limit: number; month: number; year: number;
  alert_at_percent: number; created_at: string;
}
export interface GoalRow {
  id: string; user_id: string; name: string; target_amount: number;
  current_amount: number; deadline: string; priority: number;
  cover_url: string | null; status: GoalStatus; created_at: string;
}
export interface FlowScoreRow {
  id: string; user_id: string; score: number;
  saving_rate: number; budget_adherence: number; goal_progress: number; calculated_at: string;
}

// ── Supabase Database generic ──────────────────────────────────────
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row:    ProfileRow;
        Insert: { id: string; full_name?: string | null; avatar_url?: string | null; currency?: string; timezone?: string };
        Update: { full_name?: string | null; avatar_url?: string | null; currency?: string; timezone?: string };
      };
      accounts: {
        Row:    AccountRow;
        Insert: { user_id: string; name: string; type: AccountType; balance?: number; color?: string; icon?: string; is_active?: boolean };
        Update: { name?: string; type?: AccountType; balance?: number; color?: string; icon?: string; is_active?: boolean };
      };
      categories: {
        Row:    CategoryRow;
        Insert: { user_id?: string | null; name: string; icon?: string; color?: string; parent_id?: string | null; is_default?: boolean; type: TransactionType };
        Update: { name?: string; icon?: string; color?: string; parent_id?: string | null; is_default?: boolean; type?: TransactionType };
      };
      transactions: {
        Row:    TransactionRow;
        Insert: { user_id: string; account_id: string; category_id: string; amount: number; type: TransactionType; note?: string | null; receipt_url?: string | null; date: string; is_recurring?: boolean; is_deleted?: boolean };
        Update: { account_id?: string; category_id?: string; amount?: number; type?: TransactionType; note?: string | null; receipt_url?: string | null; date?: string; is_recurring?: boolean; is_deleted?: boolean; updated_at?: string };
      };
      budgets: {
        Row:    BudgetRow;
        Insert: { user_id: string; category_id: string; amount_limit: number; month: number; year: number; alert_at_percent?: number };
        Update: { category_id?: string; amount_limit?: number; month?: number; year?: number; alert_at_percent?: number };
      };
      goals: {
        Row:    GoalRow;
        Insert: { user_id: string; name: string; target_amount: number; current_amount?: number; deadline: string; priority?: number; cover_url?: string | null; status?: GoalStatus };
        Update: { name?: string; target_amount?: number; current_amount?: number; deadline?: string; priority?: number; cover_url?: string | null; status?: GoalStatus };
      };
      flow_scores: {
        Row:    FlowScoreRow;
        Insert: { user_id: string; score: number; saving_rate?: number; budget_adherence?: number; goal_progress?: number; calculated_at?: string };
        Update: { score?: number; saving_rate?: number; budget_adherence?: number; goal_progress?: number };
      };
    };
    Views:     object;
    Functions: object;
    Enums:     object;
  };
}
