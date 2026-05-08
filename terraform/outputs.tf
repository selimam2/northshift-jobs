output "instance_ip" {
  value       = aws_eip.main.public_ip
  description = "Public IP of the EC2 instance"
}

output "ssh_command" {
  value       = "ssh ec2-user@${aws_eip.main.public_ip}"
  description = "SSH into the instance"
}

output "ecr_api_url" {
  value       = aws_ecr_repository.api.repository_url
  description = "Push API image: podman push <url>:latest"
}

output "ecr_frontend_url" {
  value       = aws_ecr_repository.frontend.repository_url
  description = "Push frontend image: podman push <url>:latest"
}
