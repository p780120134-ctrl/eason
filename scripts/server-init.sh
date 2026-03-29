#!/bin/bash
# ══════════════════════════════════════
# 伺服器初始化腳本
# 在全新的 Ubuntu 22.04 / 24.04 上執行
# ══════════════════════════════════════

set -e

echo "══ 統包先生 伺服器初始化 ══"
echo ""

# 1. 更新系統
echo "📦 更新系統..."
apt update && apt upgrade -y

# 2. 安裝 Docker
echo "🐳 安裝 Docker..."
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi
docker -v

# 3. 安裝 Docker Compose plugin
echo "🐳 安裝 Docker Compose..."
apt install -y docker-compose-plugin 2>/dev/null || true

# 4. 安裝 Git
echo "📥 安裝 Git..."
apt install -y git

# 5. 設定防火牆
echo "🔒 設定防火牆..."
apt install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable

# 6. 建立專案目錄
echo "📁 建立目錄..."
mkdir -p /opt/tongbao
cd /opt/tongbao

echo ""
echo "══════════════════════════════════"
echo "  ✅ 伺服器初始化完成"
echo ""
echo "  下一步："
echo "  1. git clone <你的 repo> /opt/tongbao"
echo "  2. cd /opt/tongbao"
echo "  3. cp .env.example .env && nano .env"
echo "  4. ./scripts/deploy.sh your-domain.com"
echo "══════════════════════════════════"
