#!/bin/bash

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_BACKUP_FILE="$BACKUP_DIR/database_backup_$DATE.sql"
FILES_BACKUP_FILE="$BACKUP_DIR/files_backup_$DATE.tar.gz"

mkdir -p "$BACKUP_DIR"

echo "Starting database backup at $(date)"

# Key fixes:
# --ssl=0           : disable SSL
# --no-tablespaces  : avoid PROCESS privilege requirement
mysqldump --ssl=0 \
          --no-tablespaces \
          -h mysql \
          -u "$DB_USERNAME" \
          -p"$DB_PASSWORD" \
          "$DB_DATABASE" > "$DB_BACKUP_FILE"

if [ $? -eq 0 ] && [ -s "$DB_BACKUP_FILE" ]; then
    echo "Database backup completed successfully: $DB_BACKUP_FILE"
    gzip "$DB_BACKUP_FILE"
else
    echo "Database backup failed!"
    exit 1
fi

echo "Starting files backup at $(date)"
if [ -d "/var/www/html/storage/app/files" ]; then
    cd /var/www/html/storage/app
    tar -czf "$FILES_BACKUP_FILE" files/ 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "Files backup completed successfully: $FILES_BACKUP_FILE"
    else
        echo "Files backup failed!"
        exit 1
    fi
else
    echo "Files directory does not exist yet, creating empty backup"
    touch "$FILES_BACKUP_FILE"
fi

# Clean up old backups
find "$BACKUP_DIR" -name "database_backup_*.sql.gz" -mtime +7 -delete 2>/dev/null
find "$BACKUP_DIR" -name "files_backup_*.tar.gz" -mtime +7 -delete 2>/dev/null

echo "Backup process completed at $(date)"
echo "$(date): Backup completed - DB: ${DB_BACKUP_FILE}.gz, Files: $FILES_BACKUP_FILE" >> "$BACKUP_DIR/backup.log"

# Always exit cleanly if we got here
exit 0