# 部署上線檢查清單

> 從「本機可跑」到「網路上大家一起用」需要完成的所有項目

---

## 現況：本機 A 級驗收通過

```
✅ 後端 19 API 全部接真 DB
✅ 前端 32 頁面（30 接 API）
✅ 登入 + 權限 + 種子資料
✅ Docker 本機可跑
❌ 還不能部署到網路
```

---

## 必須完成的 4 大類（缺一不可）

### 🔴 類別 1：安全性（不做會被駭）

| # | 項目 | 狀態 | 說明 | 預估 |
|---|------|------|------|------|
| 1 | HTTPS / SSL 憑證 | ❌ | 沒有 SSL = 密碼明文傳輸 = 必被駭 | 0.5 天 |
| 2 | CORS 白名單 | ❌ | 目前允許任何來源 → 要限制只允許你的網域 | 0.5 小時 |
| 3 | Rate Limiting | ❌ | 沒有限制 = 可被暴力破解密碼 | 0.5 小時 |
| 4 | Helmet 安全標頭 | ✅ | 已裝 helmet | — |
| 5 | 環境變數不入 Git | ✅ | .gitignore 已排除 .env | — |
| 6 | JWT Secret 強度 | ⚠ | 目前用 dev 密鑰，需換成 64+ 字元隨機串 | 5 分鐘 |
| 7 | 資料庫密碼 | ⚠ | 目前用 dev 密碼，上線要換強密碼 | 5 分鐘 |
| 8 | SQL Injection 防護 | ✅ | 使用 Knex 參數化查詢 | — |
| 9 | XSS 防護 | ✅ | Vue 預設 escape | — |
| 10 | 檔案上傳驗證 | ⚠ | 目前只限制大小和副檔名，需加 MIME 檢查 | 0.5 小時 |

### 🔴 類別 2：部署基礎建設（不做跑不起來）

| # | 項目 | 狀態 | 說明 | 預估 |
|---|------|------|------|------|
| 11 | 雲端伺服器 | ❌ | 需要 AWS EC2 / GCP / DigitalOcean | 1 天 |
| 12 | 網域名稱 | ❌ | 需要 tongbao.com 或類似網域 | 0.5 天 |
| 13 | DNS 設定 | ❌ | A Record 指向伺服器 IP | 0.5 小時 |
| 14 | 生產版 Dockerfile | ⚠ | 有 dev 版，需做生產版（多階段構建） | 0.5 天 |
| 15 | 前端 build | ❌ | `npm run build` 產出靜態檔 | 0.5 小時 |
| 16 | Nginx 反向代理 | ❌ | 前端靜態 + API 代理 + SSL | 0.5 天 |
| 17 | 資料庫備份 | ❌ | 定時備份 + 異地存放 | 0.5 天 |
| 18 | PM2 / 進程管理 | ❌ | 後端 crash 自動重啟 | 0.5 小時 |
| 19 | 環境變數管理 | ⚠ | 生產環境的 .env 需要獨立管理 | 0.5 小時 |

### 🟡 類別 3：品質保證（不做會出事）

| # | 項目 | 狀態 | 說明 | 預估 |
|---|------|------|------|------|
| 20 | 錯誤處理統一 | ⚠ | 部分 API catch 不完整 | 1 天 |
| 21 | 表單驗證 | ⚠ | 前端有基本驗證，後端需加 express-validator | 1 天 |
| 22 | Loading 狀態 | ⚠ | 部分頁面缺少 loading indicator | 0.5 天 |
| 23 | 空狀態處理 | ⚠ | 資料為空時要顯示引導，不是空白 | 0.5 天 |
| 24 | API 錯誤回饋 | ⚠ | 後端錯誤要轉成使用者看得懂的訊息 | 0.5 天 |
| 25 | 後端 API 測試 | ❌ | 0 個測試 → 至少核心流程要有 | 2 天 |
| 26 | 前端 E2E 測試 | ❌ | 登入→建案→收款 流程測試 | 1 天 |

### 🟢 類別 4：營運準備（不做很難用）

| # | 項目 | 狀態 | 說明 | 預估 |
|---|------|------|------|------|
| 27 | CI/CD 自動部署 | ❌ | GitHub push → 自動測試 → 自動部署 | 1 天 |
| 28 | 日誌收集 | ❌ | 後端 log → 集中收集（CloudWatch / Loki） | 0.5 天 |
| 29 | 錯誤監控 | ❌ | Sentry / 類似服務，前後端錯誤即時通知 | 0.5 天 |
| 30 | 健康檢查 | ❌ | /api/health endpoint + uptime 監控 | 0.5 小時 |
| 31 | S3 設定 | ❌ | 真正的 AWS S3 bucket + IAM | 0.5 天 |
| 32 | 使用者操作手冊 | ❌ | 各角色怎麼用的說明文件 | 2 天 |
| 33 | 管理員操作手冊 | ❌ | 系統管理、帳號建立、權限設定 | 1 天 |

---

## 軟體功能缺口

### 前端頁面缺少的互動

| 頁面 | 缺什麼 | 影響 |
|------|--------|------|
| LeadCenter | 指派 Modal 只有 alert | 不能真正選設計師 |
| CaseDetail | 追加減新增 Modal 未做 | 不能新增追加減 |
| CaseAssign | AI 推薦只有 alert | 不能看 AI 分數 |
| DesignerQuote | 編輯報價只有 alert | 不能改報價內容 |
| MeasureBooking | 排定日期只有 alert | 不能選日期時間 |
| ClientRepair | 新增報修送出 → 需接後端 | 資料不會存 |
| ESignCenter | 簽名存圖 → 需接 S3 | 簽名圖不會持久化 |

### 後端 API 的 TODO

| API | 未完成項目 |
|-----|-----------|
| chat.js | 沒有 WebSocket 即時推送（目前需重新整理才看到新訊息） |
| upload.js | 目前存本地，需改為 S3 |
| line.js | webhook 接收做了，但 Push API 回覆未實作 |
| erp.js | 同步是模擬，未接真正 ERP API |
| ai.js | Claude API proxy 未接（需 API Key） |
| checkin.js | GPS 驗證有做，但 NFC 讀取需原生 App |

---

## 建議部署順序

### Step 1（1天）：最小可用部署

```
1. 買一台雲端主機（DigitalOcean $12/月 最簡單）
2. 裝 Docker + Docker Compose
3. 上傳專案 → docker compose up -d
4. 設定防火牆（只開 80/443）
5. 用 Caddy 或 Nginx 做反向代理 + 自動 SSL
6. 設定網域 DNS
```
完成後：**團隊可以用瀏覽器登入使用**

### Step 2（2天）：安全加固

```
7. 換強密碼（JWT Secret + DB Password）
8. 加 Rate Limiting
9. 加 CORS 白名單
10. 設定資料庫備份排程
```

### Step 3（3天）：品質提升

```
11. 補完前端 Modal（指派/新增/編輯）
12. 表單驗證
13. 錯誤處理統一
14. 核心流程測試
```

### Step 4（2天）：營運就緒

```
15. CI/CD
16. 日誌 + 錯誤監控
17. S3 設定
18. 操作手冊
```

---

## 時間估算

| 等級 | 目標 | 時間 | 結果 |
|------|------|------|------|
| **最小上線** | 能登入、能看資料、有 SSL | 1-2 天 | 團隊試用 |
| **安全上線** | + 安全加固 + 備份 | +2 天 | 可對外 |
| **正式上線** | + 品質 + Modal + 測試 | +5 天 | B 級驗收 |
| **穩定運營** | + CI/CD + 監控 + 手冊 | +3 天 | C 級驗收 |

**從現在到正式上線：約 10-12 個工作天**

---

## 最快的路徑（如果你要今天就上線）

```bash
# 1. 買 DigitalOcean Droplet（$12/月）
# 2. SSH 進去
apt update && apt install -y docker.io docker-compose-plugin
git clone <你的repo> tongbao && cd tongbao
cp .env.example .env
# 3. 改 .env（強密碼+你的網域）
nano .env
# 4. 啟動
docker compose up -d
# 5. 裝 Caddy（自動 SSL）
apt install -y caddy
echo "tongbao.com { reverse_proxy localhost:3000 }" > /etc/caddy/Caddyfile
systemctl restart caddy
# 完成！打開 https://tongbao.com 就能用
```

5 個指令就上線。但這是最小版本，後續要逐步加固。
