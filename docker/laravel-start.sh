#!/bin/bash

# Wait for the application files to be mounted
while [ ! -f /var/www/html/artisan ]; do
    echo "Waiting for Laravel files to be mounted..."
    sleep 2
done

echo "Laravel files detected, setting up..."

# Create necessary directories
mkdir -p /var/www/html/storage/framework/{sessions,views,cache}
mkdir -p /var/www/html/storage/{app/files,logs}
mkdir -p /var/www/html/bootstrap/cache

# Set proper permissions
chown -R www-data:www-data /var/www/html/storage
chown -R www-data:www-data /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage
chmod -R 775 /var/www/html/bootstrap/cache

# Install dependencies if vendor doesn't exist
if [ ! -d "/var/www/html/vendor" ]; then
    echo "Installing Composer dependencies..."
    composer install --optimize-autoloader
fi

# Generate app key if not exists
if ! grep -q "APP_KEY=base64:" /var/www/html/.env; then
    echo "Generating application key..."
    php artisan key:generate --force
fi

# Run migrations
echo "Running migrations..."
php artisan migrate --force || true

# Clear caches
php artisan config:clear
php artisan view:clear
php artisan route:clear

echo "Laravel setup complete, starting services..."

# Start supervisord
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf