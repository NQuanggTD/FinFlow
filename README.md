# FinFlow 💰 – Nền tảng Quản lý Tài chính Cá nhân

> Next.js 14 · Supabase · TypeScript · Tailwind CSS · Docker · AI-powered

---

## ✅ Yêu cầu bắt buộc đã đáp ứng

| # | Tiêu chí | Trạng thái |
|---|----------|-----------|
| 1 | Next.js App Router + Tailwind CSS + shadcn/ui | ✅ |
| 2 | Supabase (Auth + Database + Storage + Realtime) | ✅ |
| 3 | Dockerfile + Docker Compose | ✅ |
| 4 | VPS Deployment + Domain + SSL | ✅ (Nginx + Certbot) |
| 5 | GitHub repo với commit history | ✅ |
| 6 | AI Tool (GitHub Copilot + Claude AI) | ✅ (>8 prompts) |

---

## 🚀 Khởi chạy dự án

### 1. Clone & cài dependencies
```bash
git clone https://github.com/[username]/finflow.git
cd finflow
npm install
```

### 2. Cấu hình environment
```bash
cp .env.local.example .env.local
# Điền các giá trị Supabase và OpenAI vào .env.local
```

### 3. Chạy migration Supabase
```
Supabase Dashboard → SQL Editor → Paste nội dung supabase/migrations/001_initial_schema.sql → Run
```

### 4. Chạy development
```bash
npm run dev
# Mở http://localhost:3000
```

### 5. Chạy với Docker
```bash
docker compose up -d --build
```

---

## 📁 Cấu trúc dự án

```
src/
├── app/
│   ├── (auth)/          # Login, Register, Callback
│   ├── (dashboard)/     # Dashboard, Transactions, Budgets, Goals, Calendar, AI, Settings
│   └── api/             # Route Handlers: transactions, budgets, goals, ai, upload, health
├── actions/             # Server Actions: auth, transactions, budgets, goals
├── components/
│   ├── ui/              # Button, Input, Select, Card, Modal, Badge, ProgressBar, Toast...
│   ├── layout/          # Sidebar, TopBar, Providers
│   ├── auth/            # LoginForm, RegisterForm
│   ├── dashboard/       # SummaryCards, FlowScoreCard, RecentTransactions, BudgetOverview
│   ├── transactions/    # TransactionList, TransactionItem, TransactionForm, TransactionFilters
│   ├── budgets/         # BudgetList, BudgetCard, BudgetFormModal
│   ├── goals/           # GoalList, GoalCard
│   ├── calendar/        # CalendarView
│   ├── charts/          # CashFlowChart, CategoryPieChart
│   ├── ai/              # AIInsightPanel, AIChat
│   └── settings/        # SettingsForm, AccountManager
├── hooks/               # useTransactions, useBudgets, useRealtimeTransactions
├── lib/
│   ├── supabase/        # client.ts, server.ts, admin.ts
│   ├── utils/           # cn.ts, format.ts
│   └── validations/     # auth, transaction, budget, goal (Zod)
├── actions/             # Server Actions
├── types/               # database.ts, index.ts
└── middleware.ts        # Route protection
```

---

## 🗄️ Database Schema

8 bảng chính: `profiles`, `accounts`, `categories`, `transactions`, `budgets`, `goals`, `flow_scores`

Tất cả đều có **Row Level Security (RLS)** – chỉ user sở hữu mới đọc/ghi được dữ liệu.

---

## 🤖 AI Features

- **Weekly Insight**: Phân tích chi tiêu 30 ngày qua bằng GPT-4o-mini
- **AI Chat**: Hỏi đáp tài chính cá nhân hoá theo dữ liệu thực
- **OCR Receipt**: Upload ảnh hóa đơn → AI trích xuất thông tin tự động

---

## 🐳 Deploy Production

```bash
# 1. SSH vào VPS
ssh root@[VPS_IP]

# 2. Clone và cấu hình
git clone https://github.com/[username]/finflow.git /var/www/finflow
cd /var/www/finflow && cp .env.local.example .env.local
# Điền đầy đủ biến môi trường

# 3. Docker
docker compose up -d --build

# 4. Nginx + SSL
sudo cp nginx.conf /etc/nginx/sites-available/finflow
sudo ln -s /etc/nginx/sites-available/finflow /etc/nginx/sites-enabled/
sudo certbot --nginx -d finflow.yourdomain.com
sudo systemctl reload nginx
```

---

*FinFlow v1.0.0 · Đồ án Cuối kỳ · CTK46-PM · 2026*
