resource "aws_db_subnet_group" "main" {
  name       = "northshift-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id
}

# Password stored in SSM — set before applying:
#   aws ssm put-parameter --name /northshift/db_password --type SecureString --value "your-strong-password"
data "aws_ssm_parameter" "db_password" {
  name            = "/northshift/db_password"
  with_decryption = true
}

# Build the full connection string as an SSM parameter so ECS can reference it
resource "aws_ssm_parameter" "db_connection_string" {
  name  = "/northshift/db_connection_string"
  type  = "SecureString"
  value = "Host=${aws_db_instance.main.address};Port=5432;Database=${var.db_name};Username=${var.db_username};Password=${data.aws_ssm_parameter.db_password.value}"
}

resource "aws_db_instance" "main" {
  identifier        = "northshift-db"
  engine            = "postgres"
  engine_version    = "16"
  instance_class    = "db.t3.micro"
  allocated_storage = 20
  storage_encrypted = true

  db_name  = var.db_name
  username = var.db_username
  password = data.aws_ssm_parameter.db_password.value

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  backup_retention_period = 7
  skip_final_snapshot     = false
  final_snapshot_identifier = "northshift-db-final"
  deletion_protection     = true

  tags = { Name = "northshift-db" }
}
