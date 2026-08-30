#!/usr/bin/env bash
# Re-provisions the preview environment after a pod restart.
# Everything outside /app and /root is ephemeral: PHP, MariaDB binaries, Composer and the
# supervisor programs have to be recreated. Run: bash /app/scripts/bootstrap.sh
set -u
export DEBIAN_FRONTEND=noninteractive

echo "==> system packages"
command -v php >/dev/null || apt-get update -qq
command -v php >/dev/null || apt-get install -y php8.2-cli php8.2-mysql php8.2-mbstring \
  php8.2-xml php8.2-curl php8.2-zip php8.2-bcmath php8.2-intl php8.2-gd php8.2-sqlite3 \
  mariadb-server mariadb-client unzip

echo "==> composer"
if ! command -v composer >/dev/null; then
  curl -sS https://getcomposer.org/installer -o /tmp/composer-setup.php
  php /tmp/composer-setup.php --install-dir=/usr/local/bin --filename=composer -q
fi

echo "==> mariadb datadir (/root/mysql-data, persistent)"
chmod 711 /root
mkdir -p /var/run/mysqld && chown mysql:mysql /var/run/mysqld
mkdir -p /etc/mysql/conf.d
printf '[client]\nsocket = /var/run/mysqld/mysqld.sock\n' > /etc/mysql/conf.d/99-cms-client.cnf
if [ ! -d /root/mysql-data/mysql ]; then
  mkdir -p /root/mysql-data
  mariadb-install-db --user=mysql --datadir=/root/mysql-data >/dev/null
fi
# A mariadb-server reinstall can change the `mysql` uid, so always reassert ownership.
chown -R mysql:mysql /root/mysql-data

echo "==> supervisor programs"
cat > /etc/supervisor/conf.d/cms.conf <<'CONF'
[program:mariadb]
command=/usr/sbin/mariadbd --user=mysql --datadir=/root/mysql-data --socket=/var/run/mysqld/mysqld.sock --bind-address=127.0.0.1 --port=3306 --skip-name-resolve
autostart=true
autorestart=true
priority=10
stdout_logfile=/var/log/supervisor/mariadb.out.log
stderr_logfile=/var/log/supervisor/mariadb.err.log

[program:laravel-queue]
command=/usr/bin/php artisan queue:work --sleep=1 --tries=3 --timeout=60
directory=/app/backend
autostart=true
autorestart=true
priority=30
stdout_logfile=/var/log/supervisor/laravel-queue.out.log
stderr_logfile=/var/log/supervisor/laravel-queue.err.log
CONF
# The platform's `backend` program defaults to uvicorn on port 8001; point it at Laravel.
sed -i 's#^command=/root/.venv/bin/uvicorn server:app.*#command=/usr/bin/php artisan serve --host=0.0.0.0 --port=8001#' \
  /etc/supervisor/conf.d/supervisord.conf
# `next start` serves a production build; the preview ingress rejects dev-mode chunk URLs.
sed -i 's#^command=yarn dev$#command=yarn start#' /etc/supervisor/conf.d/supervisord.conf
supervisorctl reread >/dev/null && supervisorctl update >/dev/null
supervisorctl start mariadb >/dev/null 2>&1
sleep 5

echo "==> database"
mysql -u root -e "CREATE DATABASE IF NOT EXISTS adiprimanto_cms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'cms_user'@'%' IDENTIFIED BY 'cms_secret_2026';
GRANT ALL PRIVILEGES ON adiprimanto_cms.* TO 'cms_user'@'%'; FLUSH PRIVILEGES;"

echo "==> backend dependencies"
cd /app/backend
[ -d vendor ] || composer install --no-interaction --no-progress
[ -f .env ] || { echo "MISSING /app/backend/.env — restore it before continuing"; exit 1; }
grep -q '^APP_KEY=base64' .env || php artisan key:generate --force
php artisan migrate --force
php artisan db:seed --force
php artisan storage:link 2>/dev/null

echo "==> frontend dependencies"
cd /app/frontend
[ -d node_modules ] || yarn install --ignore-engines
[ -d .next ] || yarn build

supervisorctl restart backend laravel-queue frontend
echo "==> done"
