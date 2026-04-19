#!/bin/bash
# =============================================
# MKPI Deploy Script
# Domain: http://mkpi.popcorn-creator.com
# Port:   3020
# Path:   /home/web/mckpi
# =============================================

set -e

SERVER="root@srv1100100.hstgr.cloud"
REPO="https://github.com/mizae1234/mckpi.git"
APP_DIR="/home/web/mckpi"
CONTAINER="mkpi-app"
BRANCH="main"

echo "🚀 Deploying MKPI to $SERVER ..."

ssh $SERVER << 'ENDSSH'
set -e

APP_DIR="/home/web/mckpi"
REPO="https://github.com/mizae1234/mckpi.git"
BRANCH="main"
CONTAINER="mkpi-app"
IS_FIRST_DEPLOY=false

# Ensure directory exists
mkdir -p /home/web

# Clone or pull
if [ ! -d "$APP_DIR/.git" ]; then
    echo "📦 Cloning repository..."
    git clone "$REPO" "$APP_DIR"
    IS_FIRST_DEPLOY=true
else
    echo "📥 Pulling latest changes..."
    cd "$APP_DIR"
    git pull origin "$BRANCH"
fi

cd "$APP_DIR"

# Check .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found! Creating from template..."
    if [ -f ".env.production.example" ]; then
        cp .env.production.example .env
        echo "📝 Please edit /home/web/mckpi/.env with production values, then re-run deploy.sh"
        exit 1
    else
        echo "❌ No .env.production.example found either. Please create .env manually."
        exit 1
    fi
fi

# Docker compose down → build → up
echo "🔨 Rebuilding containers..."
docker compose down || true
docker compose build --no-cache
docker compose up -d

# Wait for containers to be ready
echo "⏳ Waiting for containers to start..."
sleep 10

# First deploy: push database schema
if [ "$IS_FIRST_DEPLOY" = true ]; then
    echo "🗄️  First deploy detected — pushing database schema..."
    docker exec "$CONTAINER" npx prisma db push --accept-data-loss
    echo "✅ Database schema created."
fi

# Check container status
echo ""
echo "📋 Container status:"
docker ps --filter "name=$CONTAINER" --filter "name=mkpi-db"

# Show recent logs
echo ""
echo "📄 App logs (last 20 lines):"
docker logs --tail 20 "$CONTAINER" 2>&1 || true

echo ""
echo "✅ Deploy complete! → http://mkpi.popcorn-creator.com"
ENDSSH
