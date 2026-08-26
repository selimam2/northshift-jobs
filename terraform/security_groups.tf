resource "aws_security_group" "ec2" {
  name   = "northshift-ec2-sg"
  vpc_id = aws_vpc.main.id

  # SSH is intentionally not exposed. Use SSM Session Manager, or grant a
  # temporary rule scoped to a single address when shell access is needed:
  #   aws ec2 authorize-security-group-ingress --group-id <id> \
  #     --protocol tcp --port 22 --cidr YOUR.IP/32
  ingress {
    description = "HTTP (Caddy redirect to HTTPS)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    description = "HTTPS/QUIC (HTTP/3)"
    from_port   = 443
    to_port     = 443
    protocol    = "udp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "northshift-ec2-sg" }
}
