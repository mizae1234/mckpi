#!/bin/bash
# =============================================
# MKPI Deploy Script
# Domain: mkpi.popcorn-creator.com
# Port:   3020
# Path:   /home/web/mckpi
# =============================================

set -e

SERVER="root@srv1100100.hstgr.cloud"
REPO="https://github.com/mizae1234/mckpi.git"
APP_DIR="/home/web/mckpi"
CONTAINER="mkpi-app"
BRANCH="main"
DOMAIN="mkpi.popcorn-creator.com"

echo "🚀 Deploying MKPI to $SERVER ..."

ssh $SERVER << 'ENDSSH'
set -e

APP_DIR="/home/web/mckpi"
REPO="https://github.com/mizae1234/mckpi.git"
BRANCH="main"
CONTAINER="mkpi-app"
DOMAIN="mkpi.popcorn-creator.com"

# Ensure directory exists
mkdir -p /home/web

# Clone or pull
if [ ! -d "$APP_DIR/.git" ]; then
    echo "📦 Cloning repository..."
    git clone "$REPO" "$APP_DIR"
else
    echo "📥 Pulling latest changes..."
    cd "$APP_DIR"
    git pull origin "$BRANCH"
fi

cd "$APP_DIR"

# Create .env if not exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'ENVEOF'
DATABASE_URL="postgresql://pop_user:%40Kanitta12PRD@127.0.0.1:5432/mkpi?schema=public&options=-c%20timezone%3DAsia/Bangkok"
TZ=Asia/Bangkok
AUTH_SECRET="svndsvnldnve"
AUTH_TRUST_HOST=true
R2_ACCOUNT_ID=99c23c987bd3023da5c7ccdb4e80507d
R2_ACCESS_KEY_ID=5da88f3c3e46f50c2e0a26ffb7f73bda
R2_SECRET_ACCESS_KEY=2b17d772e9f006d71a84053fd6e0f254087056fb17e14ac879066c9e3ce8d5a1
R2_BUCKET_NAME=mckpi
R2_PUBLIC_URL=https://pub-f0b1b293775a40b4a00275996c3ebf10.r2.dev
PASS_FOR_ALL="admin../"
GEMINI_API_KEY=AIzaSyAnv3kW1o7ae_4nEiXkHOfZ-mmtNq-dYuA
AUTH_URL="https://mkpi.popcorn-creator.com"
NEXTAUTH_URL="https://mkpi.popcorn-creator.com"
ENVEOF
    echo "✅ .env created"
fi

# Docker compose down → build → up
echo "🔨 Rebuilding containers..."
docker compose down || true
docker compose build --no-cache
docker compose up -d

# Wait for containers to be ready
echo "⏳ Waiting for containers to start..."
sleep 10

# ── Nginx reverse proxy setup ──────────────────────────────
NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"
if [ ! -f "$NGINX_CONF" ]; then
    echo "🌐 Setting up Nginx reverse proxy for $DOMAIN ..."

    cat > "$NGINX_CONF" << 'NGINXEOF'
server {
    listen 80;
    server_name mkpi.popcorn-creator.com;

    location / {
        proxy_pass http://127.0.0.1:3020;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
        client_max_body_size 500M;
    }
}
NGINXEOF

    # Enable site
    ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx
    echo "✅ Nginx configured"

    # SSL with Certbot
    echo "🔒 Setting up SSL with Certbot..."
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email admin@popcorn-creator.com --redirect || echo "⚠️  Certbot failed — SSL not configured. You can run manually: certbot --nginx -d $DOMAIN"
else
    echo "✅ Nginx config already exists for $DOMAIN"
    nginx -t && systemctl reload nginx
fi

# Check container status
echo ""
echo "📋 Container status:"
docker ps --filter "name=$CONTAINER"

# Show recent logs
echo ""
echo "📄 App logs (last 20 lines):"
docker logs --tail 20 "$CONTAINER" 2>&1 || true

echo ""
echo "✅ Deploy complete! → https://$DOMAIN"
ENDSSH
