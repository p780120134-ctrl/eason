-- ══════════════════════════════════════════════════════
-- 統包先生 MR.TURNKEY — PostgreSQL Schema
-- 對應前端 31 個 window.* 資料模組
-- ══════════════════════════════════════════════════════

-- ── 使用者 ──
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(30) NOT NULL,
  name          VARCHAR(100) NOT NULL,
  title         VARCHAR(100),
  org           VARCHAR(100),
  store         VARCHAR(100),
  zone          VARCHAR(100),
  avatar        VARCHAR(10),
  phone         VARCHAR(20),
  email         VARCHAR(100),
  line_id       VARCHAR(50),
  hire_date     DATE,
  base_salary   INTEGER DEFAULT 0,
  annual_leave  INTEGER DEFAULT 0,
  is_active     BOOLEAN DEFAULT true,
  permissions   JSONB DEFAULT '[]',
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- ── 案件（FINANCE_DB）──
CREATE TABLE cases (
  id            SERIAL PRIMARY KEY,
  case_id       VARCHAR(20) UNIQUE NOT NULL,  -- TM-2026-047
  name          VARCHAR(200) NOT NULL,
  client_name   VARCHAR(100),
  designer_id   INTEGER REFERENCES users(id),
  worker_id     INTEGER REFERENCES users(id),
  store         VARCHAR(100),
  sign_date     DATE,
  total_amount  INTEGER DEFAULT 0,
  collected     INTEGER DEFAULT 0,
  pending       INTEGER DEFAULT 0,
  status        VARCHAR(30) DEFAULT '收款中',  -- 收款中/逾期未收/已結案
  gross_margin  DECIMAL(5,2),
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- ── 付款節點 ──
CREATE TABLE payments (
  id            SERIAL PRIMARY KEY,
  case_id       INTEGER REFERENCES cases(id),
  period        INTEGER NOT NULL,           -- 第幾期
  amount        INTEGER NOT NULL,
  due_date      DATE,
  received      BOOLEAN DEFAULT false,
  received_date DATE,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ── 客戶填單（LEADS_DB）──
CREATE TABLE leads (
  id            SERIAL PRIMARY KEY,
  lead_id       VARCHAR(20) UNIQUE NOT NULL,
  time          TIMESTAMP DEFAULT NOW(),
  region        VARCHAR(50),
  district      VARCHAR(50),
  name          VARCHAR(100),
  gender        VARCHAR(10),
  phone         VARCHAR(20),
  line_id       VARCHAR(50),
  house_type    VARCHAR(50),
  house_age     VARCHAR(30),
  contact_time  VARCHAR(50),
  area          VARCHAR(30),
  budget        VARCHAR(50),
  address       TEXT,
  source        VARCHAR(100),
  status        VARCHAR(30) DEFAULT '未處理',
  urgency       VARCHAR(10) DEFAULT 'warm',
  assigned_to   INTEGER REFERENCES users(id),
  note          TEXT,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ── GP 月結（GP_MONTHLY）──
CREATE TABLE gp_monthly (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER REFERENCES users(id),
  month         VARCHAR(7) NOT NULL,         -- 2026-03
  earned        INTEGER DEFAULT 0,
  penalties     INTEGER DEFAULT 0,
  total         INTEGER DEFAULT 0,
  level         INTEGER DEFAULT 1,
  streak        INTEGER DEFAULT 0,
  red_card      BOOLEAN DEFAULT false,
  tasks_done    JSONB DEFAULT '[]',
  created_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- ── 打卡（SITE_CHECKIN_DB）──
CREATE TABLE sites (
  id            SERIAL PRIMARY KEY,
  site_id       VARCHAR(20) UNIQUE NOT NULL,
  case_id       INTEGER REFERENCES cases(id),
  name          VARCHAR(200),
  address       TEXT,
  latitude      DECIMAL(10,7),
  longitude     DECIMAL(10,7),
  radius        INTEGER DEFAULT 100,
  nfc_id        VARCHAR(50),
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE checkins (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER REFERENCES users(id),
  site_id       INTEGER REFERENCES sites(id),
  date          DATE NOT NULL,
  time          TIME NOT NULL,
  type          VARCHAR(10) DEFAULT 'nfc',   -- nfc/qr/manual
  gps_verified  BOOLEAN DEFAULT false,
  latitude      DECIMAL(10,7),
  longitude     DECIMAL(10,7),
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ── 工程日誌（CONSTRUCTION_LOG_DB）──
CREATE TABLE construction_logs (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER REFERENCES users(id),
  site_id       INTEGER REFERENCES sites(id),
  case_id       INTEGER REFERENCES cases(id),
  date          DATE NOT NULL,
  weather       VARCHAR(20),
  workers       JSONB DEFAULT '[]',
  items         JSONB DEFAULT '[]',
  progress      INTEGER DEFAULT 0,
  issues        JSONB DEFAULT '[]',
  photos        JSONB DEFAULT '[]',
  next_day_plan TEXT,
  submitted_at  TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ── 設計師巡查（DESIGNER_INSPECTION_DB）──
CREATE TABLE inspections (
  id            SERIAL PRIMARY KEY,
  designer_id   INTEGER REFERENCES users(id),
  site_id       INTEGER REFERENCES sites(id),
  case_id       INTEGER REFERENCES cases(id),
  date          DATE NOT NULL,
  week          VARCHAR(10),
  checkin_time  TIME,
  checkin_type  VARCHAR(10),
  photos        JSONB DEFAULT '[]',
  quality       JSONB DEFAULT '{}',
  client_note   TEXT,
  issues        JSONB DEFAULT '[]',
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ── 客戶評分（CLIENT_STAGE_RATINGS）──
CREATE TABLE client_ratings (
  id            SERIAL PRIMARY KEY,
  case_id       INTEGER REFERENCES cases(id),
  client_name   VARCHAR(100),
  designer_id   INTEGER REFERENCES users(id),
  stage         VARCHAR(30) NOT NULL,        -- signing/proposal/construction/inspection/completion
  rating        INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT,
  rated_at      TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ── 通訊（CHAT_DB）──
CREATE TABLE chat_groups (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(200),
  case_id       INTEGER REFERENCES cases(id),
  type          VARCHAR(30) DEFAULT 'case',  -- case/repair/general
  members       JSONB DEFAULT '[]',
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chat_messages (
  id            SERIAL PRIMARY KEY,
  group_id      INTEGER REFERENCES chat_groups(id),
  user_id       INTEGER REFERENCES users(id),
  text          TEXT,
  media         JSONB DEFAULT '[]',
  is_system     BOOLEAN DEFAULT false,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ── 會議記錄 ──
CREATE TABLE meetings (
  id            SERIAL PRIMARY KEY,
  case_id       INTEGER REFERENCES cases(id),
  designer_id   INTEGER REFERENCES users(id),
  client_name   VARCHAR(100),
  meeting_type  VARCHAR(50),
  date          DATE,
  duration      VARCHAR(20),
  transcript    TEXT,
  analysis      JSONB,
  shared_to_client BOOLEAN DEFAULT false,
  client_confirmed BOOLEAN DEFAULT false,
  client_comment   TEXT,
  status        VARCHAR(30) DEFAULT 'completed',
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ── 電子簽章 ──
CREATE TABLE esign_documents (
  id            SERIAL PRIMARY KEY,
  doc_type      VARCHAR(30),                 -- 合約/追加減同意書/驗收單
  case_id       INTEGER REFERENCES cases(id),
  title         VARCHAR(200),
  amount        INTEGER DEFAULT 0,
  status        VARCHAR(30) DEFAULT '待簽署',
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE esign_parties (
  id            SERIAL PRIMARY KEY,
  document_id   INTEGER REFERENCES esign_documents(id),
  role          VARCHAR(50),
  name          VARCHAR(100),
  signed        BOOLEAN DEFAULT false,
  sign_date     TIMESTAMP,
  sign_image    TEXT,                          -- S3 URL
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ── 檔案管理 ──
CREATE TABLE files (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(255),
  type          VARCHAR(30),                  -- photo/video/document/signature
  category      VARCHAR(50),
  size          INTEGER,
  case_id       INTEGER REFERENCES cases(id),
  uploader_id   INTEGER REFERENCES users(id),
  s3_key        VARCHAR(500),
  url           VARCHAR(500),
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ── 電子發票 ──
CREATE TABLE invoices (
  id            SERIAL PRIMARY KEY,
  invoice_no    VARCHAR(20) UNIQUE,
  type          VARCHAR(10),                  -- 銷項/進項
  date          DATE,
  buyer_seller  VARCHAR(100),
  tax_id        VARCHAR(10),
  case_id       INTEGER REFERENCES cases(id),
  items         JSONB DEFAULT '[]',
  amount        INTEGER DEFAULT 0,
  tax           INTEGER DEFAULT 0,
  total         INTEGER DEFAULT 0,
  status        VARCHAR(20) DEFAULT '已開立',
  period        VARCHAR(20),
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ── 新人訓練進度 ──
CREATE TABLE onboarding_progress (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER REFERENCES users(id),
  current_module INTEGER DEFAULT 0,
  current_section INTEGER DEFAULT 0,
  quiz_answers  JSONB DEFAULT '{}',
  modules_done  JSONB DEFAULT '[]',
  completed     BOOLEAN DEFAULT false,
  completed_at  TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ── LINE 對話 ──
CREATE TABLE line_conversations (
  id            SERIAL PRIMARY KEY,
  line_user_id  VARCHAR(50) UNIQUE,
  name          VARCHAR(100),
  case_id       INTEGER REFERENCES cases(id),
  designer_id   INTEGER REFERENCES users(id),
  bound         BOOLEAN DEFAULT false,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE line_messages (
  id            SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES line_conversations(id),
  direction     VARCHAR(10),                 -- in/out
  sender_name   VARCHAR(100),
  text          TEXT,
  source        VARCHAR(20),                 -- line/platform
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ── 工班請款 ──
CREATE TABLE contractor_claims (
  id            SERIAL PRIMARY KEY,
  crew_id       INTEGER REFERENCES users(id),
  case_id       INTEGER REFERENCES cases(id),
  items         TEXT,
  amount        INTEGER,
  photos        JSONB DEFAULT '[]',
  status        VARCHAR(20) DEFAULT '待審核',
  paid_date     DATE,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ── 通知紀錄 ──
CREATE TABLE notifications (
  id            SERIAL PRIMARY KEY,
  type          VARCHAR(50),
  target        VARCHAR(50),
  message       TEXT,
  sent_via      VARCHAR(20) DEFAULT 'system', -- system/line/push
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ── 索引 ──
CREATE INDEX idx_cases_store ON cases(store);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_checkins_date ON checkins(date);
CREATE INDEX idx_checkins_user ON checkins(user_id);
CREATE INDEX idx_gp_monthly_user ON gp_monthly(user_id, month);
CREATE INDEX idx_logs_date ON construction_logs(date);
CREATE INDEX idx_files_case ON files(case_id);
CREATE INDEX idx_invoices_period ON invoices(period);
