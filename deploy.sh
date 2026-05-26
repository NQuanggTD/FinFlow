#!/bin/bash
# FinFlow – VPS Deploy Script
# Run on your VPS: bash deploy.sh
set -e

APP_DIR="/var/www/finflow"
DOMAIN="${DOMAIN:-finflow.example.com}"

echo "🚀 FinFlow VPS Deploy"
echo "Domain: $DOMAIN"

# 1. Install dependencies
echo "📦 Installing system dependencies..."
apt-get update -qq
apt-get install -y -qq docker.io nginx certbot python3-certbot-nginx curl git

# Enable Docker
systemctl enable docker --now

# Install Docker Compose plugin
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# 2. Clone or pull
if [ -d "$APP_DIR/.git" ]; then
  echo "📥 Pulling latest code..."
  cd "$APP_DIR" && git pull
else
  echo "📥 Cloning repository..."
  git clone https://github.com/YOUR_USERNAME/finflow.git "$APP_DIR"
  cd "$APP_DIR"
fi

# 3. Check .env.local
if [ ! -f "$APP_DIR/.env.local" ]; then
  echo "⚠️  .env.local not found!"
  echo "Create it from .env.local.example and fill in your values."
  cp "$APP_DIR/.env.local.example" "$APP_DIR/.env.local"
  echo "👉 Edit $APP_DIR/.env.local then re-run this script."
  exit 1
fi

# 4. Build and start Docker
echo "🐳 Building Docker container..."
cd "$APP_DIR"
docker compose down --remove-orphans 2>/dev/null || true
docker compose up -d --build
echo "⏳ Waiting for container to be healthy..."
sleep 10
docker compose ps

# 5. Nginx config
echo "🌐 Configuring Nginx..."
cat > /etc/nginx/sites-available/finflow << NGINX
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    ssl_certificate     /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 10m;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-Content-Type-Options nosniff always;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    gzip_min_length 1024;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade \$http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
    }

    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
NGINX

ln -sf /etc/nginx/sites-available/finflow /etc/nginx/sites-enabled/finflow
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# 6. SSL
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
  echo "🔒 Requesting SSL certificate..."
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "admin@$DOMAIN" --redirect
else
  echo "🔒 SSL certificate already exists."
fi

echo ""
echo "✅ Deploy complete!"
echo "🌐 App running at: https://$DOMAIN"
echo ""
echo "Useful commands:"
echo "  docker compose logs -f        # View logs"
echo "  docker compose restart        # Restart app"
echo "  docker compose down && docker compose up -d --build  # Rebuild"
