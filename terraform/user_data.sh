#!/bin/bash
set -euo pipefail

# Install Docker (podman is not in AL2023 default repos)
dnf install -y docker
systemctl enable --now docker
usermod -aG docker ec2-user

# Docker Compose v2 plugin (not in AL2023 repos — install from GitHub)
mkdir -p /usr/local/lib/docker/cli-plugins
curl -fsSL https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# App directory — compose files are deployed here by scripts/deploy.sh
mkdir -p /opt/northshift/caddy
chown -R ec2-user:ec2-user /opt/northshift

# Reads secrets from SSM and writes /opt/northshift/.env for compose substitution
cat > /opt/northshift/fetch-secrets.sh << 'INNER'
#!/bin/bash
set -euo pipefail
get() { aws ssm get-parameter --name "$1" --with-decryption --query Parameter.Value --output text --region us-east-1; }
{
  printf 'DB_PASSWORD=%s\n'           "$(get /northshift/db_password)"
  printf 'JWT_KEY=%s\n'               "$(get /northshift/jwt_key)"
  printf 'STRIPE_SECRET_KEY=%s\n'     "$(get /northshift/stripe_secret_key)"
  printf 'STRIPE_WEBHOOK_SECRET=%s\n' "$(get /northshift/stripe_webhook_secret)"
  printf 'RESEND_API_KEY=%s\n'        "$(get /northshift/resend_api_key)"
} > /opt/northshift/.env
chmod 600 /opt/northshift/.env
INNER
chmod +x /opt/northshift/fetch-secrets.sh

# Systemd unit — started by scripts/deploy.sh on first run, then auto-starts on reboot
cat > /etc/systemd/system/northshift.service << 'INNER'
[Unit]
Description=NorthShift Application Stack
After=network-online.target docker.service
Wants=network-online.target
Requires=docker.service

[Service]
Type=forking
WorkingDirectory=/opt/northshift
ExecStartPre=/opt/northshift/fetch-secrets.sh
ExecStartPre=/bin/bash -c 'aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 674482656393.dkr.ecr.us-east-1.amazonaws.com'
ExecStart=/usr/bin/docker compose -p northshift -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker compose -p northshift -f docker-compose.prod.yml down
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
INNER

systemctl daemon-reload
# Do NOT start here — compose files must be copied first (see scripts/deploy.sh)
