resource "aws_ecs_cluster" "main" {
  name = "northshift"
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/northshift-api"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/northshift-frontend"
  retention_in_days = 30
}

# ── IAM ───────────────────────────────────────────────────────────────────────

resource "aws_iam_role" "ecs_task_execution" {
  name = "northshift-ecs-task-execution"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Allow ECS to read SSM secrets
resource "aws_iam_role_policy" "ecs_ssm" {
  name = "northshift-ecs-ssm"
  role = aws_iam_role.ecs_task_execution.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["ssm:GetParameters", "ssm:GetParameter"]
      Resource = "arn:aws:ssm:${var.aws_region}:674482656393:parameter/northshift/*"
    }]
  })
}

# ── SSM secret references ─────────────────────────────────────────────────────

data "aws_ssm_parameter" "jwt_key" {
  name            = "/northshift/jwt_key"
  with_decryption = false
}

data "aws_ssm_parameter" "stripe_secret_key" {
  name            = "/northshift/stripe_secret_key"
  with_decryption = false
}

data "aws_ssm_parameter" "resend_api_key" {
  name            = "/northshift/resend_api_key"
  with_decryption = false
}

# ── API task definition ───────────────────────────────────────────────────────

resource "aws_ecs_task_definition" "api" {
  family                   = "northshift-api"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "api"
    image     = "${aws_ecr_repository.api.repository_url}:latest"
    essential = true
    portMappings = [{ containerPort = 8080, protocol = "tcp" }]

    environment = [
      { name = "ASPNETCORE_ENVIRONMENT", value = "Production" },
      { name = "Frontend__Url",          value = "https://${var.domain}" },
      { name = "Jwt__Issuer",            value = "https://api.${var.domain}" },
      { name = "Jwt__Audience",          value = "https://${var.domain}" },
      { name = "Resend__FromEmail",      value = "hello@${var.domain}" },
      { name = "Resend__FromName",       value = "NorthShift Jobs" },
      { name = "AWS__Region",            value = var.aws_region },
      { name = "AWS__ResumeBucket",      value = aws_s3_bucket.resumes.bucket },
    ]

    secrets = [
      { name = "ConnectionStrings__DefaultConnection", valueFrom = aws_ssm_parameter.db_connection_string.arn },
      { name = "Jwt__Key",                             valueFrom = data.aws_ssm_parameter.jwt_key.arn },
      { name = "Stripe__SecretKey",                    valueFrom = data.aws_ssm_parameter.stripe_secret_key.arn },
      { name = "Resend__ApiKey",                       valueFrom = data.aws_ssm_parameter.resend_api_key.arn },
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.api.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "api"
      }
    }
  }])
}

resource "aws_ecs_service" "api" {
  name            = "northshift-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 8080
  }

  depends_on = [aws_lb_listener.https]
}

# ── Frontend task definition ──────────────────────────────────────────────────

resource "aws_ecs_task_definition" "frontend" {
  family                   = "northshift-frontend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([{
    name      = "frontend"
    image     = "${aws_ecr_repository.frontend.repository_url}:latest"
    essential = true
    portMappings = [{ containerPort = 3000, protocol = "tcp" }]

    environment = [
      { name = "NEXT_PUBLIC_API_URL", value = "https://api.${var.domain}" },
      { name = "NODE_ENV",            value = "production" },
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.frontend.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "frontend"
      }
    }
  }])
}

resource "aws_ecs_service" "frontend" {
  name            = "northshift-frontend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.frontend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend.arn
    container_name   = "frontend"
    container_port   = 3000
  }

  depends_on = [aws_lb_listener.https]
}
