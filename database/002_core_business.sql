-- ══════════════════════════════════════════════════════
-- 核心業務資料模型
-- 依賴 001_rbac.sql（users, roles, stores）
-- ══════════════════════════════════════════════════════

-- ════════════════════════════
-- 1. 客戶
-- ════════════════════════════
CREATE TABLE customers (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(100) NOT NULL,
  gender          VARCHAR(10),
  phone           VARCHAR(20),
  phone2          VARCHAR(20),
  email           VARCHAR(100),
  line_id         VARCHAR(50),
  line_user_id    VARCHAR(100),          -- LINE OA 綁定 ID
  address         TEXT,
  district        VARCHAR(50),
  city            VARCHAR(50),
  source          VARCHAR(100),           -- 填單來源（官網/LINE/廣告/轉介紹）
  referrer_id     INTEGER REFERENCES customers(id),  -- 推薦人
  membership      VARCHAR(20) DEFAULT 'standard',    -- standard/gold/diamond
  total_spending  INTEGER DEFAULT 0,
  points_balance  INTEGER DEFAULT 0,
  points_earned   INTEGER DEFAULT 0,
  note            TEXT,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ════════════════════════════
-- 2. 廠商 / 工班
-- ════════════════════════════
CREATE TABLE vendors (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(100) NOT NULL,
  type            VARCHAR(30) NOT NULL,   -- 木作/泥作/水電/油漆/系統櫃/清潔/拆除/鋁窗/冷氣/其他
  contact_name    VARCHAR(50),
  phone           VARCHAR(20),
  line_id         VARCHAR(50),
  tax_id          VARCHAR(10),
  bank_name       VARCHAR(50),
  bank_account    VARCHAR(30),
  address         TEXT,
  rating          DECIMAL(2,1) DEFAULT 0,  -- 累計平均評分
  rating_count    INTEGER DEFAULT 0,
  total_jobs      INTEGER DEFAULT 0,
  total_amount    INTEGER DEFAULT 0,
  status          VARCHAR(20) DEFAULT 'active', -- active/suspended/blacklisted
  note            TEXT,
  user_id         INTEGER REFERENCES users(id), -- 如果有平台帳號
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ════════════════════════════
-- 3. 填單 / 進件
-- ════════════════════════════
CREATE TABLE leads (
  id              SERIAL PRIMARY KEY,
  lead_no         VARCHAR(20) UNIQUE NOT NULL,  -- L-2026-108
  customer_id     INTEGER REFERENCES customers(id),
  -- 填單資料（客戶可能還沒建檔）
  name            VARCHAR(100),
  phone           VARCHAR(20),
  line_id         VARCHAR(50),
  city            VARCHAR(50),
  district        VARCHAR(50),
  address         TEXT,
  house_type      VARCHAR(50),           -- 全新屋/中古屋/預售客變
  house_age       VARCHAR(30),
  area            VARCHAR(30),           -- 坪數範圍
  budget          VARCHAR(50),
  contact_time    VARCHAR(50),
  source          VARCHAR(100),
  progress        TEXT,                  -- 客戶自述目前進度
  -- 處理狀態
  status          VARCHAR(30) DEFAULT '未處理',  -- 未處理/已聯繫/跟進中/已成交/流失
  urgency         VARCHAR(10) DEFAULT 'warm',     -- hot/warm/cool
  assigned_to     INTEGER REFERENCES users(id),   -- 指派設計師
  assigned_at     TIMESTAMP,
  store_id        INTEGER REFERENCES stores(id),
  note            TEXT,
  filled_at       TIMESTAMP DEFAULT NOW(),
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ════════════════════════════
-- 4. 案件（核心）
-- ════════════════════════════
CREATE TABLE cases (
  id              SERIAL PRIMARY KEY,
  case_no         VARCHAR(20) UNIQUE NOT NULL,   -- TM-2026-047
  customer_id     INTEGER REFERENCES customers(id),
  lead_id         INTEGER REFERENCES leads(id),  -- 來源填單
  store_id        INTEGER REFERENCES stores(id),
  -- 人員
  designer_id     INTEGER REFERENCES users(id),
  worker_id       INTEGER REFERENCES users(id),  -- 工務
  manager_id      INTEGER REFERENCES users(id),  -- 店長
  -- 基本資訊
  name            VARCHAR(200) NOT NULL,         -- 大安區 張宅全室翻修
  address         TEXT,
  area            DECIMAL(6,1),                  -- 坪數
  house_type      VARCHAR(50),
  style           VARCHAR(50),                   -- 設計風格
  -- 金額
  quote_amount    INTEGER DEFAULT 0,             -- 報價金額
  contract_amount INTEGER DEFAULT 0,             -- 合約金額
  addon_amount    INTEGER DEFAULT 0,             -- 追加減累計
  final_amount    INTEGER DEFAULT 0,             -- 最終金額
  collected       INTEGER DEFAULT 0,             -- 已收款
  pending         INTEGER DEFAULT 0,             -- 待收款
  cost            INTEGER DEFAULT 0,             -- 總成本
  gross_margin    DECIMAL(5,2),                  -- 毛利率
  -- 日期
  quote_date      DATE,
  sign_date       DATE,
  start_date      DATE,                          -- 開工日
  est_end_date    DATE,                          -- 預計完工
  actual_end_date DATE,                          -- 實際完工
  acceptance_date DATE,                          -- 驗收日
  close_date      DATE,                          -- 結案日
  warranty_end    DATE,                          -- 保固到期
  -- 狀態
  stage           VARCHAR(30) DEFAULT '名單建立', -- 8大階段
  status          VARCHAR(30) DEFAULT 'active',   -- active/completed/cancelled/on_hold
  health          VARCHAR(10) DEFAULT 'green',    -- green/yellow/red
  health_reason   TEXT,
  progress        INTEGER DEFAULT 0,              -- 整體進度 0-100
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ════════════════════════════
-- 5. 報價單
-- ════════════════════════════
CREATE TABLE quotes (
  id              SERIAL PRIMARY KEY,
  case_id         INTEGER REFERENCES cases(id),
  quote_no        VARCHAR(20) UNIQUE NOT NULL,   -- Q-2026-047-v3
  version         INTEGER DEFAULT 1,
  total_amount    INTEGER DEFAULT 0,
  cost_amount     INTEGER DEFAULT 0,
  margin          DECIMAL(5,2),
  status          VARCHAR(20) DEFAULT 'draft',   -- draft/sent/approved/rejected
  approved_by     INTEGER REFERENCES users(id),
  approved_at     TIMESTAMP,
  note            TEXT,
  created_by      INTEGER REFERENCES users(id),
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE quote_items (
  id              SERIAL PRIMARY KEY,
  quote_id        INTEGER REFERENCES quotes(id) ON DELETE CASCADE,
  category        VARCHAR(50),                    -- 拆除/泥作/水電/木作/油漆/系統櫃/其他
  name            VARCHAR(200) NOT NULL,
  unit            VARCHAR(20),                    -- 坪/尺/式/組/點/台
  quantity        DECIMAL(10,2) DEFAULT 1,
  unit_price      INTEGER DEFAULT 0,
  cost_price      INTEGER DEFAULT 0,              -- 成本單價
  subtotal        INTEGER DEFAULT 0,
  cost_subtotal   INTEGER DEFAULT 0,
  note            TEXT,
  sort_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ════════════════════════════
-- 6. 合約
-- ════════════════════════════
CREATE TABLE contracts (
  id              SERIAL PRIMARY KEY,
  case_id         INTEGER REFERENCES cases(id),
  contract_no     VARCHAR(20) UNIQUE NOT NULL,    -- CTR-2026-047
  quote_id        INTEGER REFERENCES quotes(id),
  amount          INTEGER NOT NULL,
  sign_date       DATE,
  warranty_period VARCHAR(20) DEFAULT '2年',
  warranty_scopes JSONB DEFAULT '[]',             -- [{area:'泥作',period:'1年'},{area:'水電',period:'2年'}]
  terms           JSONB DEFAULT '[]',             -- 條款摘要
  status          VARCHAR(20) DEFAULT 'signed',   -- draft/signed/terminated
  esign_doc_id    INTEGER,                        -- 電子簽章文件 ID
  pdf_url         VARCHAR(500),
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ════════════════════════════
-- 7. 付款節點
-- ════════════════════════════
CREATE TABLE payment_nodes (
  id              SERIAL PRIMARY KEY,
  case_id         INTEGER REFERENCES cases(id),
  contract_id     INTEGER REFERENCES contracts(id),
  period          INTEGER NOT NULL,               -- 第幾期
  name            VARCHAR(100),                   -- 簽約款30%
  percentage      DECIMAL(5,2),                   -- 30.00
  amount          INTEGER NOT NULL,
  due_date        DATE,
  -- 收款狀態
  received        BOOLEAN DEFAULT false,
  received_date   DATE,
  received_amount INTEGER,
  receipt_no      VARCHAR(50),
  invoice_id      INTEGER,                        -- 關聯發票
  -- 催款
  remind_count    INTEGER DEFAULT 0,
  last_remind     TIMESTAMP,
  overdue_days    INTEGER DEFAULT 0,
  note            TEXT,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ════════════════════════════
-- 8. 追加減
-- ════════════════════════════
CREATE TABLE addons (
  id              SERIAL PRIMARY KEY,
  case_id         INTEGER REFERENCES cases(id),
  addon_no        VARCHAR(20) UNIQUE NOT NULL,    -- ADD-047-03
  type            VARCHAR(10) NOT NULL,           -- 追加/減項
  item            VARCHAR(200) NOT NULL,
  reason          TEXT,
  amount          INTEGER NOT NULL,               -- 正數=追加, 負數=減項
  -- 確認
  status          VARCHAR(20) DEFAULT '待確認',    -- 待確認/已確認/已拒絕
  confirmed_by    VARCHAR(100),                   -- 業主名
  confirmed_at    TIMESTAMP,
  esign_doc_id    INTEGER,                        -- 電子簽章
  designer_id     INTEGER REFERENCES users(id),
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ════════════════════════════
-- 9. 工地
-- ════════════════════════════
CREATE TABLE sites (
  id              SERIAL PRIMARY KEY,
  site_no         VARCHAR(20) UNIQUE NOT NULL,    -- SITE-047
  case_id         INTEGER REFERENCES cases(id),
  name            VARCHAR(200),
  address         TEXT,
  floor           VARCHAR(20),
  latitude        DECIMAL(10,7),
  longitude       DECIMAL(10,7),
  radius          INTEGER DEFAULT 100,            -- GPS 圍欄半徑（公尺）
  nfc_id          VARCHAR(50),
  -- 施工資訊
  current_stage   VARCHAR(50),
  progress        INTEGER DEFAULT 0,
  start_date      DATE,
  est_end_date    DATE,
  -- 管理規定
  noise_hours     VARCHAR(50) DEFAULT '08:00-17:00',
  building_rules  TEXT,
  emergency_contact VARCHAR(50),
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ════════════════════════════
-- 10. 發包 / 派工
-- ════════════════════════════
CREATE TABLE work_orders (
  id              SERIAL PRIMARY KEY,
  case_id         INTEGER REFERENCES cases(id),
  site_id         INTEGER REFERENCES sites(id),
  vendor_id       INTEGER REFERENCES vendors(id),
  order_no        VARCHAR(20) UNIQUE NOT NULL,    -- WO-047-001
  trade           VARCHAR(30) NOT NULL,           -- 木作/泥作/水電/油漆...
  description     TEXT,
  amount          INTEGER DEFAULT 0,
  -- 排程
  scheduled_start DATE,
  scheduled_end   DATE,
  actual_start    DATE,
  actual_end      DATE,
  -- 狀態
  status          VARCHAR(20) DEFAULT '待確認',    -- 待確認/已確認/施工中/已完工/驗收通過
  -- 評分
  rated           BOOLEAN DEFAULT false,
  quality_score   DECIMAL(2,1),
  punctual_score  DECIMAL(2,1),
  cooperate_score DECIMAL(2,1),
  clean_score     DECIMAL(2,1),
  overall_score   DECIMAL(2,1),
  rating_comment  TEXT,
  created_by      INTEGER REFERENCES users(id),
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ════════════════════════════
-- 11. 工班請款
-- ════════════════════════════
CREATE TABLE vendor_claims (
  id              SERIAL PRIMARY KEY,
  case_id         INTEGER REFERENCES cases(id),
  vendor_id       INTEGER REFERENCES vendors(id),
  work_order_id   INTEGER REFERENCES work_orders(id),
  claim_no        VARCHAR(20) UNIQUE NOT NULL,    -- CL-2026-012
  stage           VARCHAR(50),                    -- 完工款/中期款
  items           JSONB DEFAULT '[]',             -- [{name:'',qty:1,unit:'',price:0,sub:0}]
  amount          INTEGER NOT NULL,
  -- 審核
  status          VARCHAR(20) DEFAULT '待提交',    -- 待提交/待審核/已核准/已撥款/已拒絕
  submitted_at    TIMESTAMP,
  reviewed_by     INTEGER REFERENCES users(id),
  reviewed_at     TIMESTAMP,
  approved_by     INTEGER REFERENCES users(id),
  approved_at     TIMESTAMP,
  paid_date       DATE,
  payment_ref     VARCHAR(50),                    -- 匯款憑證號
  photos          JSONB DEFAULT '[]',
  note            TEXT,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ════════════════════════════
-- 12. 打卡紀錄
-- ════════════════════════════
CREATE TABLE checkins (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER REFERENCES users(id),
  site_id         INTEGER REFERENCES sites(id),
  date            DATE NOT NULL,
  time            TIME NOT NULL,
  type            VARCHAR(10) DEFAULT 'nfc',      -- nfc/qr/manual/gps
  gps_verified    BOOLEAN DEFAULT false,
  latitude        DECIMAL(10,7),
  longitude       DECIMAL(10,7),
  distance        INTEGER,                        -- 與工地距離（公尺）
  photo_url       VARCHAR(500),
  note            TEXT,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ════════════════════════════
-- 13. 工程日誌
-- ════════════════════════════
CREATE TABLE construction_logs (
  id              SERIAL PRIMARY KEY,
  case_id         INTEGER REFERENCES cases(id),
  site_id         INTEGER REFERENCES sites(id),
  user_id         INTEGER REFERENCES users(id),   -- 填寫人
  date            DATE NOT NULL,
  weather         VARCHAR(20),
  workers         JSONB DEFAULT '[]',             -- [{vendor:'李明木作',count:2}]
  items           JSONB DEFAULT '[]',             -- ['天花板完成','衣櫃安裝']
  progress        INTEGER DEFAULT 0,
  issues          JSONB DEFAULT '[]',
  photos          JSONB DEFAULT '[]',             -- [{url:'',desc:''}]
  next_day_plan   TEXT,
  submitted_at    TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE(site_id, user_id, date)
);

-- ════════════════════════════
-- 14. 設計師巡查
-- ════════════════════════════
CREATE TABLE inspections (
  id              SERIAL PRIMARY KEY,
  case_id         INTEGER REFERENCES cases(id),
  site_id         INTEGER REFERENCES sites(id),
  designer_id     INTEGER REFERENCES users(id),
  date            DATE NOT NULL,
  week            VARCHAR(10),
  checkin_time    TIME,
  checkin_type    VARCHAR(10),
  photos          JSONB DEFAULT '[]',
  quality_checks  JSONB DEFAULT '{}',             -- {ceiling:'OK',wall:'進行中',...}
  client_note     TEXT,
  issues          JSONB DEFAULT '[]',
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ════════════════════════════
-- 15. 文件
-- ════════════════════════════
CREATE TABLE documents (
  id              SERIAL PRIMARY KEY,
  case_id         INTEGER REFERENCES cases(id),
  type            VARCHAR(30),                    -- 合約/報價單/施工圖/追加減同意書/驗收單/照片/其他
  name            VARCHAR(255) NOT NULL,
  file_type       VARCHAR(20),                    -- pdf/jpg/png/doc
  size            INTEGER DEFAULT 0,
  s3_key          VARCHAR(500),
  url             VARCHAR(500),
  category        VARCHAR(50),                    -- 施工照片/巡查照片/簽名/文件
  uploader_id     INTEGER REFERENCES users(id),
  version         INTEGER DEFAULT 1,
  is_current      BOOLEAN DEFAULT true,
  metadata        JSONB DEFAULT '{}',             -- EXIF/GPS 等
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ════════════════════════════
-- 16. 對話紀錄
-- ════════════════════════════
CREATE TABLE chat_groups (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(200),
  case_id         INTEGER REFERENCES cases(id),
  type            VARCHAR(20) DEFAULT 'case',     -- case/repair/internal/line
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chat_members (
  id              SERIAL PRIMARY KEY,
  group_id        INTEGER REFERENCES chat_groups(id) ON DELETE CASCADE,
  user_id         INTEGER REFERENCES users(id),
  role            VARCHAR(30),                    -- 業主/設計師/工務/客服
  joined_at       TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE TABLE chat_messages (
  id              SERIAL PRIMARY KEY,
  group_id        INTEGER REFERENCES chat_groups(id),
  user_id         INTEGER REFERENCES users(id),
  text            TEXT,
  media           JSONB DEFAULT '[]',             -- [{type:'image',url:'',thumb:''}]
  is_system       BOOLEAN DEFAULT false,
  source          VARCHAR(20) DEFAULT 'platform', -- platform/line
  read_by         JSONB DEFAULT '[]',
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ════════════════════════════
-- 17. 客戶評分
-- ════════════════════════════
CREATE TABLE client_ratings (
  id              SERIAL PRIMARY KEY,
  case_id         INTEGER REFERENCES cases(id),
  customer_id     INTEGER REFERENCES customers(id),
  designer_id     INTEGER REFERENCES users(id),
  stage           VARCHAR(30) NOT NULL,           -- signing/proposal/construction/inspection/completion
  stage_label     VARCHAR(30),
  rating          INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment         TEXT,
  rated_at        TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ════════════════════════════
-- 18. 客訴 / 報修
-- ════════════════════════════
CREATE TABLE complaints (
  id              SERIAL PRIMARY KEY,
  case_id         INTEGER REFERENCES cases(id),
  customer_id     INTEGER REFERENCES customers(id),
  complaint_no    VARCHAR(20) UNIQUE NOT NULL,    -- WO-2026-031
  type            VARCHAR(30),                    -- 保固內/點數兌換/付費
  issue           TEXT NOT NULL,
  urgency         VARCHAR(10) DEFAULT '一般',      -- 一般/較緊急/非常緊急
  status          VARCHAR(20) DEFAULT '待處理',    -- 待處理/處理中/已完成
  assigned_to     INTEGER REFERENCES users(id),
  scheduled_date  DATE,
  completed_date  DATE,
  rating          INTEGER,
  rating_comment  TEXT,
  photos          JSONB DEFAULT '[]',
  chat_group_id   INTEGER REFERENCES chat_groups(id),
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ════════════════════════════
-- 19. GP 月結
-- ════════════════════════════
CREATE TABLE gp_monthly (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER REFERENCES users(id),
  month           VARCHAR(7) NOT NULL,            -- 2026-03
  earned          INTEGER DEFAULT 0,
  penalties       INTEGER DEFAULT 0,
  total           INTEGER DEFAULT 0,
  level           INTEGER DEFAULT 1,
  streak          INTEGER DEFAULT 0,
  red_card        BOOLEAN DEFAULT false,
  red_card_reason TEXT,
  tasks_done      JSONB DEFAULT '[]',
  reward_tier     INTEGER DEFAULT 0,
  reward_amount   INTEGER DEFAULT 0,
  manager_bonus   INTEGER DEFAULT 0,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- ════════════════════════════
-- 20. 電子簽章
-- ════════════════════════════
CREATE TABLE esign_documents (
  id              SERIAL PRIMARY KEY,
  case_id         INTEGER REFERENCES cases(id),
  type            VARCHAR(30),                    -- 合約/追加減同意書/驗收單
  title           VARCHAR(200),
  amount          INTEGER DEFAULT 0,
  status          VARCHAR(20) DEFAULT '待簽署',
  related_id      INTEGER,                        -- 關聯的 contract_id 或 addon_id
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE esign_signatures (
  id              SERIAL PRIMARY KEY,
  document_id     INTEGER REFERENCES esign_documents(id) ON DELETE CASCADE,
  role            VARCHAR(50),
  signer_name     VARCHAR(100),
  signer_user_id  INTEGER REFERENCES users(id),
  signed          BOOLEAN DEFAULT false,
  signed_at       TIMESTAMP,
  signature_url   VARCHAR(500),                   -- S3 URL
  ip_address      VARCHAR(45),
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ════════════════════════════
-- 21. 電子發票
-- ════════════════════════════
CREATE TABLE invoices (
  id              SERIAL PRIMARY KEY,
  invoice_no      VARCHAR(20),
  type            VARCHAR(10) NOT NULL,           -- sales/purchase (銷項/進項)
  case_id         INTEGER REFERENCES cases(id),
  payment_node_id INTEGER REFERENCES payment_nodes(id),
  vendor_id       INTEGER REFERENCES vendors(id),
  buyer_seller    VARCHAR(100),
  tax_id          VARCHAR(10),
  items           JSONB DEFAULT '[]',
  amount          INTEGER DEFAULT 0,
  tax             INTEGER DEFAULT 0,
  total           INTEGER DEFAULT 0,
  carrier         VARCHAR(50),                    -- 載具
  status          VARCHAR(20) DEFAULT '已開立',
  period          VARCHAR(20),                    -- 115年03-04月
  voided          BOOLEAN DEFAULT false,
  voided_at       TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ════════════════════════════
-- 22. 會議記錄
-- ════════════════════════════
CREATE TABLE meetings (
  id              SERIAL PRIMARY KEY,
  case_id         INTEGER REFERENCES cases(id),
  customer_id     INTEGER REFERENCES customers(id),
  designer_id     INTEGER REFERENCES users(id),
  meeting_type    VARCHAR(50),
  date            DATE,
  duration_min    INTEGER,
  transcript      TEXT,
  analysis        JSONB,                          -- AI 分析結果
  audio_url       VARCHAR(500),
  status          VARCHAR(20) DEFAULT 'completed',
  -- 客戶確認
  shared_to_client   BOOLEAN DEFAULT false,
  shared_at          TIMESTAMP,
  client_confirmed   BOOLEAN DEFAULT false,
  client_confirmed_at TIMESTAMP,
  client_comment     TEXT,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ════════════════════════════
-- 23. 新人訓練進度
-- ════════════════════════════
CREATE TABLE onboarding_progress (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER REFERENCES users(id) UNIQUE,
  module_set      VARCHAR(30),                    -- 對應哪組模組（designer/worker/manager...）
  current_module  INTEGER DEFAULT 0,
  current_section INTEGER DEFAULT 0,
  quiz_answers    JSONB DEFAULT '{}',
  modules_done    JSONB DEFAULT '[]',
  exam_tasks      JSONB DEFAULT '{}',
  completed       BOOLEAN DEFAULT false,
  completed_at    TIMESTAMP,
  supervisor_approved BOOLEAN DEFAULT false,
  supervisor_id   INTEGER REFERENCES users(id),
  started_at      TIMESTAMP DEFAULT NOW(),
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ════════════════════════════
-- 24. 通知紀錄
-- ════════════════════════════
CREATE TABLE notifications (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER REFERENCES users(id),   -- 接收人（NULL=全體）
  type            VARCHAR(50) NOT NULL,
  title           VARCHAR(200),
  body            TEXT,
  data            JSONB DEFAULT '{}',             -- 附加資料（案件ID、連結等）
  channel         VARCHAR(20) DEFAULT 'system',   -- system/line/push/email
  read            BOOLEAN DEFAULT false,
  read_at         TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ════════════════════════════
-- 25. LINE 對話
-- ════════════════════════════
CREATE TABLE line_conversations (
  id              SERIAL PRIMARY KEY,
  line_user_id    VARCHAR(100) UNIQUE,
  customer_id     INTEGER REFERENCES customers(id),
  case_id         INTEGER REFERENCES cases(id),
  designer_id     INTEGER REFERENCES users(id),
  display_name    VARCHAR(100),
  avatar_url      VARCHAR(500),
  bound           BOOLEAN DEFAULT false,
  last_message    TEXT,
  last_message_at TIMESTAMP,
  unread_count    INTEGER DEFAULT 0,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE line_messages (
  id              SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES line_conversations(id),
  direction       VARCHAR(5) NOT NULL,            -- in/out
  sender_name     VARCHAR(100),
  message_type    VARCHAR(20) DEFAULT 'text',     -- text/image/video/sticker/location
  text            TEXT,
  media_url       VARCHAR(500),
  source          VARCHAR(20) DEFAULT 'line',     -- line/platform
  line_message_id VARCHAR(100),
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ════════════════════════════
-- 索引
-- ════════════════════════════
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_line ON customers(line_user_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_store ON leads(store_id);
CREATE INDEX idx_leads_assigned ON leads(assigned_to);
CREATE INDEX idx_cases_no ON cases(case_no);
CREATE INDEX idx_cases_store ON cases(store_id);
CREATE INDEX idx_cases_designer ON cases(designer_id);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_stage ON cases(stage);
CREATE INDEX idx_cases_health ON cases(health);
CREATE INDEX idx_sites_case ON sites(case_id);
CREATE INDEX idx_sites_nfc ON sites(nfc_id);
CREATE INDEX idx_work_orders_case ON work_orders(case_id);
CREATE INDEX idx_work_orders_vendor ON work_orders(vendor_id);
CREATE INDEX idx_vendor_claims_vendor ON vendor_claims(vendor_id);
CREATE INDEX idx_vendor_claims_status ON vendor_claims(status);
CREATE INDEX idx_checkins_user_date ON checkins(user_id, date);
CREATE INDEX idx_checkins_site ON checkins(site_id);
CREATE INDEX idx_logs_case_date ON construction_logs(case_id, date);
CREATE INDEX idx_inspections_designer ON inspections(designer_id);
CREATE INDEX idx_documents_case ON documents(case_id);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_chat_messages_group ON chat_messages(group_id);
CREATE INDEX idx_chat_messages_time ON chat_messages(created_at);
CREATE INDEX idx_payment_nodes_case ON payment_nodes(case_id);
CREATE INDEX idx_addons_case ON addons(case_id);
CREATE INDEX idx_invoices_case ON invoices(case_id);
CREATE INDEX idx_invoices_period ON invoices(period);
CREATE INDEX idx_gp_user_month ON gp_monthly(user_id, month);
CREATE INDEX idx_complaints_case ON complaints(case_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_notifications_user ON notifications(user_id, read);
CREATE INDEX idx_line_conv_customer ON line_conversations(customer_id);
CREATE INDEX idx_line_msg_conv ON line_messages(conversation_id);
