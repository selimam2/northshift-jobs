# ── SSH Key Pair ──────────────────────────────────────────────────────────────

resource "aws_key_pair" "deploy" {
  key_name   = "northshift-deploy"
  public_key = var.ssh_public_key
}

# ── IAM Role + Policies ───────────────────────────────────────────────────────

resource "aws_iam_role" "ec2" {
  name = "northshift-ec2"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "ec2_ssm" {
  name = "northshift-ec2-ssm"
  role = aws_iam_role.ec2.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["ssm:GetParameters", "ssm:GetParameter"]
      Resource = "arn:aws:ssm:${var.aws_region}:674482656393:parameter/northshift/*"
    }]
  })
}

resource "aws_iam_role_policy" "ec2_s3" {
  name = "northshift-ec2-s3"
  role = aws_iam_role.ec2.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"]
      Resource = "${aws_s3_bucket.resumes.arn}/*"
    }]
  })
}

resource "aws_iam_role_policy" "ec2_ecr" {
  name = "northshift-ec2-ecr"
  role = aws_iam_role.ec2.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "ecr:GetAuthorizationToken"
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchCheckLayerAvailability",
        ]
        Resource = [
          aws_ecr_repository.api.arn,
          aws_ecr_repository.frontend.arn,
        ]
      },
    ]
  })
}

resource "aws_iam_instance_profile" "ec2" {
  name = "northshift-ec2"
  role = aws_iam_role.ec2.name
}

# ── AMI (Amazon Linux 2023, x86_64) ──────────────────────────────────────────

data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ── EC2 Instance ──────────────────────────────────────────────────────────────

resource "aws_instance" "main" {
  ami                    = data.aws_ami.al2023.id
  instance_type          = "t3.small"
  key_name               = aws_key_pair.deploy.key_name
  subnet_id              = aws_subnet.public[0].id
  vpc_security_group_ids = [aws_security_group.ec2.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2.name

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 2  # containers need hop limit > 1 to reach IMDS
  }

  user_data = file("${path.module}/user_data.sh")

  tags = { Name = "northshift" }
}

# ── Elastic IP ────────────────────────────────────────────────────────────────

resource "aws_eip" "main" {
  domain   = "vpc"
  instance = aws_instance.main.id
  tags     = { Name = "northshift-eip" }
}
