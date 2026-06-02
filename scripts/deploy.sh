#!/usr/bin/env bash
# Usage: ./scripts/deploy.sh [api|frontend|all]
# Builds nothing — assumes images are already pushed to ECR.
# On first run, starts the systemd service. Subsequent runs hot-reload changed services.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${1:-all}"
IP=$(terraform -chdir="$REPO_ROOT/terraform" output -raw instance_ip)
SSH="ssh -i ~/.ssh/northshift -o StrictHostKeyChecking=accept-new ec2-user@$IP"
SCP="scp -i ~/.ssh/northshift -o StrictHostKeyChecking=accept-new"

echo "==> Deploying to $IP (target: $TARGET)"

# Copy compose + caddy config
$SCP "$REPO_ROOT/docker-compose.prod.yml"  "ec2-user@$IP:/opt/northshift/docker-compose.prod.yml"
$SCP "$REPO_ROOT/caddy/Caddyfile"          "ec2-user@$IP:/opt/northshift/caddy/Caddyfile"

# ECR login on the server
$SSH "aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 674482656393.dkr.ecr.us-east-1.amazonaws.com"

# Pull only what changed
case "$TARGET" in
  api)      $SSH "cd /opt/northshift && docker compose -p northshift -f docker-compose.prod.yml pull api" ;;
  frontend) $SSH "cd /opt/northshift && docker compose -p northshift -f docker-compose.prod.yml pull frontend" ;;
  *)        $SSH "cd /opt/northshift && docker compose -p northshift -f docker-compose.prod.yml pull api frontend" ;;
esac

# Fetch fresh secrets, then bring stack up (creates containers that don't exist, recreates changed ones)
$SSH "/opt/northshift/fetch-secrets.sh && cd /opt/northshift && docker compose -p northshift -f docker-compose.prod.yml up -d"

# Enable systemd service so stack restarts on reboot (idempotent)
$SSH "sudo systemctl enable northshift 2>/dev/null || true"

echo "==> Done. Stack is up at https://northshift.ca"
