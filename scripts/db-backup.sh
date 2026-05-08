#!/usr/bin/env bash
# Dump Postgres to S3. Safe to run as a cron job on the EC2 instance.
# Suggested cron: 0 3 * * * /opt/northshift/db-backup.sh >> /var/log/northshift-backup.log 2>&1
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="/tmp/northshift_${TIMESTAMP}.sql.gz"
S3_KEY="backups/northshift_${TIMESTAMP}.sql.gz"
BUCKET="northshift-resumes-674482656393"

DB_CONTAINER=$(podman ps --filter name=northshift_db --format '{{.Names}}' | head -1)
if [[ -z "$DB_CONTAINER" ]]; then
  echo "ERROR: db container not running" >&2
  exit 1
fi

podman exec "$DB_CONTAINER" pg_dump -U northshift northshift | gzip > "$BACKUP_FILE"
aws s3 cp "$BACKUP_FILE" "s3://${BUCKET}/${S3_KEY}" --region us-east-1
rm "$BACKUP_FILE"

echo "Backup complete: s3://${BUCKET}/${S3_KEY}"
