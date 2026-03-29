#!/bin/bash
# ══════════════════════════════════════
# 統包先生 一鍵部署腳本
# 使用方式：./scripts/deploy.sh [domain]
# ══════════════════════════════════════

set -e

DOMAIN=${1:-localhost}
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "═══════════════════════════════════"
echo "  統包先生 MR.TURNKEY 部署"
echo "  網域: $DOMAIN"
echo "═══════════════════════════════════"
echo ""

# 1. 檢查 .env
if [ ! -f "$PROJECT_DIR/.env" ]; then
  echo "📋 建立 .env..."
  cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
  echo "⚠  請編輯 .env 設定密碼後重新執行"
  echo "   nano $PROJECT_DIR/.env"
  exit 1
fi

# 2. 設定網域到 Caddyfile
echo "🌐 設定網域: $DOMAIN"
sed -i.bak "s|\\\$DOMAIN|$DOMAIN|g" "$PROJECT_DIR/docker/Caddyfile" 2>/dev/null || \
sed "s|\\\$DOMAIN|$DOMAIN|g" "$PROJECT_DIR/docker/Caddyfile" > "$PROJECT_DIR/docker/Caddyfile.tmp" && mv "$PROJECT_DIR/docker/Caddyfile.tmp" "$PROJECT_DIR/docker/Caddyfile"

# 3. 更新 .env 的 FRONTEND_URL
if [ "$DOMAIN" != "localhost" ]; then
  sed -i.bak "s|FRONTEND_URL=.*|FRONTEND_URL=https://$DOMAIN|g" "$PROJECT_DIR/.env" 2>/dev/null || true
fi

# 4. 啟動
echo ""
echo "🚀 啟動 Docker 容器..."
cd "$PROJECT_DIR"
docker compose -f docker-compose.prod.yml up -d --build

echo ""
echo "⏳ 等待服務啟動..."
sleep 10

# 5. 執行種子資料（首次）
echo "🌱 檢查種子資料..."
docker compose -f docker-compose.prod.yml exec -T app node -e "
const knex = require('./knexfile');
const db = require('knex')(knex.production || knex.development);
db('users').count('id as n').first().then(r => {
  if(parseInt(r.n) > 0) { console.log('  ✅ 資料已存在，跳過 seed'); process.exit(0); }
  else { console.log('  🌱 執行 seed...'); require('./seeds/001_demo_data').seed(db).then(() => { console.log('  ✅ Seed 完成'); process.exit(0); }); }
}).catch(e => { console.log('  ⚠ DB 尚未就緒，稍後手動執行 seed'); process.exit(0); });
" 2>/dev/null || echo "  ⚠ Seed 需手動執行"

# 6. 健康檢查
echo ""
echo "🏥 健康檢查..."
HEALTH=$(curl -s http://localhost:3000/api/health 2>/dev/null)
if echo "$HEALTH" | grep -q "ok"; then
  echo "  ✅ 後端正常"
else
  echo "  ⚠ 後端可能還在啟動，請稍候"
fi

# 7. 完成
echo ""
echo "═══════════════════════════════════"
echo "  ✅ 部署完成！"
echo ""
if [ "$DOMAIN" = "localhost" ]; then
  echo "  🌐 http://localhost"
  echo "  🔧 http://localhost:3000/api/health"
else
  echo "  🌐 https://$DOMAIN"
  echo "  🔧 https://$DOMAIN/api/health"
fi
echo ""
echo "  帳號: boss / 1234"
echo "  其他: staff / worker / manager / finance / client"
echo "═══════════════════════════════════"
