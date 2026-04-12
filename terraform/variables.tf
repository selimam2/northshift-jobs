variable "aws_region" {
  default = "us-east-1"
}

variable "domain" {
  default = "northshift.ca"
}

variable "hosted_zone_id" {
  default = "Z0407884VYEFJ6ATMRYV"
}

variable "environment" {
  default = "prod"
}

# Pulled from SSM at plan time — set these once:
#   aws ssm put-parameter --name /northshift/db_password       --type SecureString --value "..."
#   aws ssm put-parameter --name /northshift/jwt_key           --type SecureString --value "..."
#   aws ssm put-parameter --name /northshift/stripe_secret_key --type SecureString --value "..."
#   aws ssm put-parameter --name /northshift/resend_api_key    --type SecureString --value "..."

variable "db_name"     { default = "northshift" }
variable "db_username" { default = "northshift" }
