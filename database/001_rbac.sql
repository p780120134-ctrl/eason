-- ══════════════════════════════════════════════════════
-- RBAC 權限系統（角色 + 權限 + 使用者）
-- 取代原本 schema.sql 中的 users 單表設計
-- ══════════════════════════════════════════════════════

-- ── 1. 權限模組表（26 個功能模組）──
CREATE TABLE permissions (
  id            SERIAL PRIMARY KEY,
  code          VARCHAR(50) UNIQUE NOT NULL,   -- 'cases', 'finance', 'gp'
  name          VARCHAR(100) NOT NULL,          -- '案件管理'
  description   VARCHAR(200),
  category      VARCHAR(50),                    -- 'core', 'ai', 'integration'
  icon          VARCHAR(10),
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ── 2. 角色表 ──
CREATE TABLE roles (
  id            SERIAL PRIMARY KEY,
  code          VARCHAR(30) UNIQUE NOT NULL,    -- 'boss', 'staff', 'worker'
  name          VARCHAR(100) NOT NULL,          -- '老闆', '設計師'
  description   VARCHAR(200),
  parent_role   VARCHAR(30) REFERENCES roles(code), -- 上級角色
  level         INTEGER DEFAULT 0,             -- 0=最高, 越大越低
  is_internal   BOOLEAN DEFAULT true,          -- false=外部角色(client/contractor/partner)
  is_active     BOOLEAN DEFAULT true,
  gp_role_key   VARCHAR(30),                   -- GP系統對應 key
  nav_config    JSONB DEFAULT '[]',            -- 導覽項設定（從 NAV_MAP 遷移）
  default_nav   VARCHAR(50),                   -- 登入後預設頁面
  badge_style   VARCHAR(100),                  -- 角色標籤樣式
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- ── 3. 角色-權限 對應（多對多）──
CREATE TABLE role_permissions (
  id            SERIAL PRIMARY KEY,
  role_id       INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
  can_create    BOOLEAN DEFAULT false,
  can_read      BOOLEAN DEFAULT true,
  can_update    BOOLEAN DEFAULT false,
  can_delete    BOOLEAN DEFAULT false,
  scope         VARCHAR(20) DEFAULT 'own',     -- 'own'=只看自己, 'store'=看本店, 'all'=看全部
  created_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- ── 4. 使用者表（重新設計）──
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_id       INTEGER REFERENCES roles(id) NOT NULL,
  name          VARCHAR(100) NOT NULL,
  title         VARCHAR(100),
  org           VARCHAR(100),
  store_id      INTEGER,                       -- 所屬門市 ID
  zone          VARCHAR(100),
  avatar        VARCHAR(10),
  avatar_url    VARCHAR(500),
  phone         VARCHAR(20),
  email         VARCHAR(100),
  line_id       VARCHAR(50),
  hire_date     DATE,
  base_salary   INTEGER DEFAULT 0,
  annual_leave  INTEGER DEFAULT 0,
  used_leave    INTEGER DEFAULT 0,
  is_active     BOOLEAN DEFAULT true,
  last_login    TIMESTAMP,
  login_count   INTEGER DEFAULT 0,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- ── 5. 使用者-權限 覆寫（個人自訂，優先於角色預設）──
CREATE TABLE user_permission_overrides (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
  permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
  granted       BOOLEAN NOT NULL,              -- true=額外授予, false=撤銷
  can_create    BOOLEAN,
  can_read      BOOLEAN,
  can_update    BOOLEAN,
  can_delete    BOOLEAN,
  scope         VARCHAR(20),
  granted_by    INTEGER REFERENCES users(id),
  reason        VARCHAR(200),
  expires_at    TIMESTAMP,                     -- 可設定到期時間
  created_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, permission_id)
);

-- ── 6. 門市/分店表 ──
CREATE TABLE stores (
  id            SERIAL PRIMARY KEY,
  code          VARCHAR(20) UNIQUE NOT NULL,   -- 'TP01'
  name          VARCHAR(100) NOT NULL,         -- '台北東門店'
  address       TEXT,
  phone         VARCHAR(20),
  manager_id    INTEGER REFERENCES users(id),
  region        VARCHAR(50),                   -- '北區', '桃園區'
  monthly_target INTEGER DEFAULT 0,
  is_active     BOOLEAN DEFAULT true,
  opened_at     DATE,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ── 7. 登入紀錄（稽核用）──
CREATE TABLE login_logs (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER REFERENCES users(id),
  ip_address    VARCHAR(45),
  user_agent    TEXT,
  action        VARCHAR(20) NOT NULL,          -- 'login', 'logout', 'refresh', 'failed'
  success       BOOLEAN DEFAULT true,
  fail_reason   VARCHAR(100),
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ── 8. Token 黑名單（登出/撤銷用）──
CREATE TABLE token_blacklist (
  id            SERIAL PRIMARY KEY,
  token_jti     VARCHAR(100) UNIQUE NOT NULL,  -- JWT ID
  user_id       INTEGER REFERENCES users(id),
  expires_at    TIMESTAMP NOT NULL,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ═══ 初始資料 ═══

-- 權限模組
INSERT INTO permissions (code, name, description, category, icon, sort_order) VALUES
  ('dashboard',    '儀表板',      '首頁總覽',                    'core',        '📊', 1),
  ('cases',        '案件管理',    '案件建立/編輯/刪除',          'core',        '📁', 2),
  ('cases_view',   '案件查看',    '僅查看案件',                  'core',        '👁', 3),
  ('leads',        '填單管理',    '客戶填單分派',                'core',        '📥', 4),
  ('finance',      '財務管理',    '收款/請款/損益',              'core',        '💰', 5),
  ('finance_view', '財務查看',    '僅查看財務報表',              'core',        '👁', 6),
  ('hr',           '人資管理',    '招募/出勤/薪資',              'core',        '👥', 7),
  ('gp',           'GP 管理',     '獎金設定/發放',               'core',        '⚡', 8),
  ('gp_view',      'GP 查看',     '僅查看自己GP',                'core',        '👁', 9),
  ('ai_dispatch',  'AI 派案',     '智慧派案系統',                'ai',          '🤖', 10),
  ('ai_quote',     'AI 報價',     '報價引擎',                    'ai',          '🤖', 11),
  ('ai_schedule',  'AI 工期',     '工期預測',                    'ai',          '📅', 12),
  ('ai_style',     'AI 風格',     '風格推薦',                    'ai',          '🎨', 13),
  ('checkin',      '打卡管理',    '查看所有打卡紀錄',            'operation',   '📍', 14),
  ('checkin_self', '自助打卡',    '僅自己打卡',                  'operation',   '📍', 15),
  ('log_manage',   '日誌管理',    '查看所有工程日誌',            'operation',   '📝', 16),
  ('log_write',    '日誌填寫',    '僅填寫自己日誌',              'operation',   '📝', 17),
  ('inspection',   '巡查管理',    '查看所有巡查紀錄',            'operation',   '🔍', 18),
  ('monitor',      '現場監控',    '即時監控看板',                'operation',   '📡', 19),
  ('chat',         '通訊系統',    '群組對話',                    'communication','💬', 20),
  ('line_oa',      'LINE 客服',   'LINE OA 對話管理',            'integration', '💬', 21),
  ('esign',        '電子簽章',    '合約/追加減簽署',             'document',    '✍', 22),
  ('reports',      '報表匯出',    'Excel/CSV 匯出',              'document',    '📊', 23),
  ('reward_pool',  '獎勵池',      '獎勵池設定/發放',             'management',  '🏦', 24),
  ('line_notify',  'LINE 推播',   '推播設定/發送',               'integration', '📱', 25),
  ('onboarding',   '新人訓練管理','查看新人進度',                'management',  '🎓', 26),
  ('settings',     '系統設定',    '全域設定',                    'management',  '⚙', 27),
  ('user_manage',  '帳號管理',    '新增/編輯/停用帳號',          'management',  '👤', 28),
  ('erp',          'ERP 串接',    'ERP 同步管理',                'integration', '🔗', 29),
  ('einvoice',     '電子發票',    '發票開立/申報',               'integration', '🧾', 30),
  ('files',        '檔案管理',    '雲端檔案管理',               'document',    '☁', 31),
  ('permissions',  '權限管理',    '角色/權限設定',              'management',  '🔐', 32);

-- 角色
INSERT INTO roles (code, name, description, parent_role, level, is_internal, gp_role_key, default_nav) VALUES
  ('boss',        '老闆/負責人',  '總部負責人，最高權限',        NULL,         0, true,  'boss',           'overview'),
  ('supervisor',  '區域督導',     '多店管理，培養店長',          'boss',       1, true,  'district',       'svhome'),
  ('manager',     '店長',         '單店營收與團隊管理',          'supervisor', 2, true,  'manager',        'dept'),
  ('designmgr',   '設計主管',     '帶設計師，控提案品質',        'manager',    3, true,  'designSup',      'dmhome'),
  ('workmgr',     '工務主管',     '帶工務，控工期品質',          'manager',    3, true,  'constructionSup','wmhome'),
  ('staff',       '設計師',       '接洽、提案、簽約',            'designmgr',  4, true,  'designer',       'shome'),
  ('worker',      '工務監工',     '監工、日誌、驗收',            'workmgr',    4, true,  'siteStaff',      'wkhome'),
  ('finance',     '財務主管',     '月結、收款、損益、稅務',      'boss',       2, true,  'finance',        'finhome'),
  ('admin',       '行政/人資',    '招募、客服、出勤',            'boss',       2, true,  'hr',             'adminhome'),
  ('marketing',   '行銷',         '社群、填單、素材',            'boss',       3, true,  'designer',       'mkthome'),
  ('digitalmgr',  '資訊行銷主管', '系統、數據、跨部門',          'boss',       2, true,  'hr',             'dghome'),
  ('client',      '客戶/業主',    '外部，查看自己的案件',        NULL,         9, false, NULL,             'chome'),
  ('contractor',  '工班廠商',     '外部，打卡回報請款',          NULL,         9, false, NULL,             'wjobs'),
  ('partner',     '合作夥伴',     '外部，接單核銷',              NULL,         9, false, NULL,             'phome');

-- 角色-權限 對應（boss 擁有全部）
INSERT INTO role_permissions (role_id, permission_id, can_create, can_read, can_update, can_delete, scope)
SELECT r.id, p.id, true, true, true, true, 'all'
FROM roles r, permissions p
WHERE r.code = 'boss';

-- 店長
INSERT INTO role_permissions (role_id, permission_id, can_create, can_read, can_update, can_delete, scope)
SELECT r.id, p.id,
  p.code IN ('cases','leads','chat'),
  true,
  p.code IN ('cases','leads','chat'),
  false,
  CASE WHEN p.code IN ('finance','finance_view','reports') THEN 'store' ELSE 'store' END
FROM roles r, permissions p
WHERE r.code = 'manager'
  AND p.code IN ('dashboard','cases','leads','finance_view','gp','gp_view','ai_dispatch','checkin','log_manage','inspection','monitor','chat','line_oa','esign','reports','onboarding');

-- 設計師
INSERT INTO role_permissions (role_id, permission_id, can_create, can_read, can_update, can_delete, scope)
SELECT r.id, p.id,
  p.code IN ('chat','esign'),
  true,
  p.code IN ('chat'),
  false,
  'own'
FROM roles r, permissions p
WHERE r.code = 'staff'
  AND p.code IN ('dashboard','cases_view','gp_view','ai_quote','ai_style','checkin_self','inspection','chat','line_oa','esign');

-- 工務
INSERT INTO role_permissions (role_id, permission_id, can_create, can_read, can_update, can_delete, scope)
SELECT r.id, p.id, p.code IN ('log_write','chat'), true, p.code IN ('log_write','chat'), false, 'own'
FROM roles r, permissions p
WHERE r.code = 'worker'
  AND p.code IN ('dashboard','gp_view','checkin_self','log_write','chat');

-- 客戶
INSERT INTO role_permissions (role_id, permission_id, can_create, can_read, can_update, can_delete, scope)
SELECT r.id, p.id, false, true, false, false, 'own'
FROM roles r, permissions p
WHERE r.code = 'client'
  AND p.code IN ('dashboard','cases_view','chat','esign');

-- 初始使用者（密碼都是 1234，bcrypt hash）
-- $2a$10$... 是 bcrypt('1234') 的結果
INSERT INTO users (username, password_hash, role_id, name, title, org, zone, avatar, hire_date, base_salary, annual_leave) VALUES
  ('boss',       '$2a$10$XQxBGz7GQZJ1Yw3xqFqYaeKFMkV6YpE.QbLl5xQKoMZzJq1eH2Ky', (SELECT id FROM roles WHERE code='boss'),       '陳逸昇', '負責人',     '總部管理層',   '全區',     '昇', '2021-01-01', 0,      20),
  ('manager',    '$2a$10$XQxBGz7GQZJ1Yw3xqFqYaeKFMkV6YpE.QbLl5xQKoMZzJq1eH2Ky', (SELECT id FROM roles WHERE code='manager'),    '陳建誠', '店長',       '桃園區',       '桃園區',   '誠', '2022-06-15', 55000,  16),
  ('staff',      '$2a$10$XQxBGz7GQZJ1Yw3xqFqYaeKFMkV6YpE.QbLl5xQKoMZzJq1eH2Ky', (SELECT id FROM roles WHERE code='staff'),      '鄭博文', '設計師',     '設計服務部',   '五股總部', '博', '2023-03-01', 42000,  14),
  ('worker',     '$2a$10$XQxBGz7GQZJ1Yw3xqFqYaeKFMkV6YpE.QbLl5xQKoMZzJq1eH2Ky', (SELECT id FROM roles WHERE code='worker'),     '王源',   '工務監工',   '工務售服部',   '五股總部', '源', '2023-08-20', 38000,  12),
  ('finance',    '$2a$10$XQxBGz7GQZJ1Yw3xqFqYaeKFMkV6YpE.QbLl5xQKoMZzJq1eH2Ky', (SELECT id FROM roles WHERE code='finance'),    '財務部', '財務主管',   '財務部',       '五股總部', '財', '2023-01-10', 48000,  14),
  ('admin',      '$2a$10$XQxBGz7GQZJ1Yw3xqFqYaeKFMkV6YpE.QbLl5xQKoMZzJq1eH2Ky', (SELECT id FROM roles WHERE code='admin'),      '耿嵩燕', '人資主管',   '總部行政部',   '總部',     '嵩', '2023-02-15', 45000,  14),
  ('designmgr',  '$2a$10$XQxBGz7GQZJ1Yw3xqFqYaeKFMkV6YpE.QbLl5xQKoMZzJq1eH2Ky', (SELECT id FROM roles WHERE code='designmgr'),  '王聖傑', '設計主管',   '設計服務部',   '五股總部', '傑', '2022-04-01', 52000,  16),
  ('workmgr',    '$2a$10$XQxBGz7GQZJ1Yw3xqFqYaeKFMkV6YpE.QbLl5xQKoMZzJq1eH2Ky', (SELECT id FROM roles WHERE code='workmgr'),    '曾俊豪', '工務主管',   '工務售服部',   '五股總部', '豪', '2022-09-01', 52000,  16),
  ('marketing',  '$2a$10$XQxBGz7GQZJ1Yw3xqFqYaeKFMkV6YpE.QbLl5xQKoMZzJq1eH2Ky', (SELECT id FROM roles WHERE code='marketing'),  '江宗聖', '影像行銷',   '行銷部',       '五股總部', '聖', '2023-05-01', 36000,  12),
  ('digitalmgr', '$2a$10$XQxBGz7GQZJ1Yw3xqFqYaeKFMkV6YpE.QbLl5xQKoMZzJq1eH2Ky', (SELECT id FROM roles WHERE code='digitalmgr'), '黃振峰', '資訊主管',   '總部管理層',   '總部',     '峰', '2022-08-01', 55000,  16),
  ('supervisor', '$2a$10$XQxBGz7GQZJ1Yw3xqFqYaeKFMkV6YpE.QbLl5xQKoMZzJq1eH2Ky', (SELECT id FROM roles WHERE code='supervisor'), '林督導', '區域督導',   '直營門市',     '板橋直營', '林', '2021-11-01', 65000,  18),
  ('client',     '$2a$10$XQxBGz7GQZJ1Yw3xqFqYaeKFMkV6YpE.QbLl5xQKoMZzJq1eH2Ky', (SELECT id FROM roles WHERE code='client'),     '張先生', '業主',       '外部',         NULL,       '張', NULL,          0,      0),
  ('contractor', '$2a$10$XQxBGz7GQZJ1Yw3xqFqYaeKFMkV6YpE.QbLl5xQKoMZzJq1eH2Ky', (SELECT id FROM roles WHERE code='contractor'), '工班廠商','協力廠商',  '外部',         NULL,       '工', NULL,          0,      0),
  ('partner',    '$2a$10$XQxBGz7GQZJ1Yw3xqFqYaeKFMkV6YpE.QbLl5xQKoMZzJq1eH2Ky', (SELECT id FROM roles WHERE code='partner'),    '合作夥伴','外聘設計師','外部',         NULL,       '合', NULL,          0,      0);

-- 門市
INSERT INTO stores (code, name, address, region, monthly_target) VALUES
  ('TP01', '台北東門店', '台北市大安區信義路二段XX號3F', '北區', 2000000),
  ('TY01', '桃園店',     '桃園市桃園區中正路XX號',      '桃園區', 1500000);

-- 索引
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_store ON users(store_id);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_role_perms_role ON role_permissions(role_id);
CREATE INDEX idx_user_overrides_user ON user_permission_overrides(user_id);
CREATE INDEX idx_login_logs_user ON login_logs(user_id);
CREATE INDEX idx_login_logs_time ON login_logs(created_at);
CREATE INDEX idx_token_blacklist_exp ON token_blacklist(expires_at);
