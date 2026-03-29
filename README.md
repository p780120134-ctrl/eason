# 統包先生 MR.TURNKEY

裝修品牌管理平台 · 全職級遊戲化 · AI 驅動

## 專案結構

```
tongbao/
├── frontend/                # 前端（Vue.js + Vite）
│   ├── src/
│   │   ├── pages/           # 頁面元件（漸進式遷移）
│   │   ├── components/      # 共用元件
│   │   ├── stores/          # Pinia 狀態管理
│   │   ├── utils/           # API 工具
│   │   └── main.js          # 入口
│   ├── public/              # 靜態資源（PWA manifest、icon）
│   └── vite.config.js
├── backend/                 # 後端（Node.js + Express）
│   ├── src/
│   │   ├── app.js           # Express 主程式
│   │   ├── routes/          # 20 個 API 路由模組
│   │   ├── controllers/     # 控制器
│   │   ├── models/          # 資料模型
│   │   ├── middleware/      # 認證/權限中間件
│   │   ├── services/        # 業務邏輯（AI/LINE/ERP/S3）
│   │   └── utils/           # 工具函式
│   ├── migrations/          # 資料庫遷移
│   ├── seeds/               # 種子資料
│   └── knexfile.js          # Knex 設定
├── database/
│   └── schema.sql           # 完整資料庫 Schema（23 張表）
├── docker/
│   ├── Dockerfile.backend
│   └── Dockerfile.frontend
├── docker-compose.yml       # 一鍵啟動（DB + Redis + 前後端）
├── .env.example             # 環境變數範本
├── .gitignore
└── package.json             # 根目錄腳本
```

## 快速開始

### 方式一：Docker（推薦）

```bash
cp .env.example .env
# 編輯 .env 填入實際值
docker-compose up -d
```

- 前端：http://localhost:5173
- 後端：http://localhost:3000
- 資料庫：localhost:5432

### 方式二：本地開發

```bash
# 1. 安裝依賴
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..

# 2. 啟動 PostgreSQL + Redis（需先安裝）
# 或用 Docker 只跑資料庫：
docker-compose up -d db redis

# 3. 初始化資料庫
npm run db:migrate
npm run db:seed

# 4. 啟動開發
npm run dev
```

## API 路由

| 路由 | 方法 | 說明 |
|------|------|------|
| `/api/auth/login` | POST | 登入取得 JWT |
| `/api/auth/me` | GET | 取得當前用戶 |
| `/api/cases` | CRUD | 案件管理 |
| `/api/leads` | CRUD | 填單管理 |
| `/api/finance` | CRUD | 財務（收款/請款/損益）|
| `/api/gp` | CRUD | GP 遊戲化點數 |
| `/api/checkin` | CRUD | 打卡紀錄 |
| `/api/logs` | CRUD | 工程日誌 |
| `/api/inspections` | CRUD | 設計師巡查 |
| `/api/chat` | CRUD | 即時通訊 |
| `/api/meetings` | CRUD | 會議記錄 |
| `/api/esign` | CRUD | 電子簽章 |
| `/api/upload` | POST | 檔案上傳（S3）|
| `/api/reports` | GET | 報表匯出 |
| `/api/line` | CRUD | LINE 整合 |
| `/api/erp` | CRUD | ERP 串接 |
| `/api/invoices` | CRUD | 電子發票 |
| `/api/onboarding` | CRUD | 新人訓練 |
| `/api/ai` | POST | AI 服務（派案/報價/風格/工期）|

## 資料庫

23 張表，對應前端 31 個資料模組：

- `users` — 14 角色帳號
- `cases` + `payments` — 案件 + 付款節點
- `leads` — 客戶填單
- `gp_monthly` — GP 月結
- `sites` + `checkins` — 工地 + 打卡
- `construction_logs` — 工程日誌
- `inspections` — 設計師巡查
- `client_ratings` — 客戶評分
- `chat_groups` + `chat_messages` — 通訊
- `meetings` — 會議記錄
- `esign_documents` + `esign_parties` — 電子簽章
- `files` — 檔案管理
- `invoices` — 電子發票
- `onboarding_progress` — 新人訓練
- `line_conversations` + `line_messages` — LINE 對話
- `contractor_claims` — 工班請款
- `notifications` — 通知紀錄

## 遷移策略

採**漸進式遷移**，不一次重寫：

1. **Phase 1**（現在）：新建專案結構，舊 HTML 透過 iframe 繼續運作
2. **Phase 2**：後端 API 上線，前端逐頁改接 API
3. **Phase 3**：Vue 元件逐頁替換舊 HTML
4. **Phase 4**：移除 iframe bridge，完全 Vue 化

## 技術棧

| 層級 | 技術 |
|------|------|
| 前端 | Vue 3 + Vite + Pinia |
| 後端 | Node.js + Express |
| 資料庫 | PostgreSQL 16 + Knex.js |
| 快取 | Redis 7 |
| 檔案 | AWS S3 |
| AI | Claude API (Anthropic) |
| 通知 | LINE Messaging API + Notify |
| 容器 | Docker + docker-compose |
| 部署 | AWS / GCP（待定）|
