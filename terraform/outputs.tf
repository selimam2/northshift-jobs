output "alb_dns_name" {
  value = aws_lb.main.dns_name
}

output "ecr_api_url" {
  value       = aws_ecr_repository.api.repository_url
  description = "Push API image here: docker push <url>:latest"
}

output "ecr_frontend_url" {
  value       = aws_ecr_repository.frontend.repository_url
  description = "Push frontend image here: docker push <url>:latest"
}

output "rds_endpoint" {
  value     = aws_db_instance.main.endpoint
  sensitive = true
}

output "db_connection_string" {
  value     = "Host=${aws_db_instance.main.address};Port=5432;Database=${var.db_name};Username=${var.db_username};Password=<from SSM /northshift/db_password>"
  sensitive = true
}
