#!/usr/bin/env bash
# One-time migration: dump RDS → restore into containerized Postgres.
#
# Prerequisites:
#   1. New EC2 stack is running (scripts/deploy.sh already run).
#   2. RDS security group temporarily allows inbound 5432 from the EC2 SG.
#      Run once before this script:
#        aws ec2 authorize-security-group-ingress \
#          --group-id <rds-sg-id> \
#          --protocol tcp --port 5432 \
#          --source-group <ec2-sg-id> \
#          --region us-east-1
#   3. pg_dump available locally or on the EC2 instance.
#
# After migration: disable RDS deletion protection, then remove rds.tf from
# Terraform and run `terraform apply`.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IP=$(terraform -chdir="$REPO_ROOT/terraform" output -raw instance_ip)
SSH="ssh -o StrictHostKeyChecking=accept-new ec2-user@$IP"

RDS_ENDPOINT="${RDS_ENDPOINT:?Set RDS_ENDPOINT to the RDS hostname}"
RDS_PASSWORD=$(aws ssm get-parameter --name /northshift/db_password --with-decryption --query Parameter.Value --output text --region us-east-1)

echo "==> Dumping RDS from $RDS_ENDPOINT ..."
PGPASSWORD="$RDS_PASSWORD" pg_dump \
  -h "$RDS_ENDPOINT" -U northshift -d northshift \
  --no-owner --no-acl \
  | gzip > /tmp/northshift_rds.sql.gz

echo "==> Copying dump to EC2 ..."
scp -o StrictHostKeyChecking=accept-new /tmp/northshift_rds.sql.gz "ec2-user@$IP:/tmp/"

echo "==> Restoring into containerized Postgres ..."
$SSH '
  DB=$(podman ps --filter name=northshift_db --format "{{.Names}}" | head -1)
  zcat /tmp/northshift_rds.sql.gz | podman exec -i "$DB" psql -U northshift northshift
  rm /tmp/northshift_rds.sql.gz
'
rm /tmp/northshift_rds.sql.gz

echo "==> Migration complete."
echo "    Verify data at https://northshift.ca, then:"
echo "    1. aws rds modify-db-instance --db-instance-identifier northshift-db --no-deletion-protection --apply-immediately --region us-east-1"
echo "    2. Remove rds.tf, alb.tf, ecs.tf, acm.tf and run terraform apply"
