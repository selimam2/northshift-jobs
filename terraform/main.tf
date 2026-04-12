terraform {
  required_version = ">= 1.7"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Remote state — create the bucket first:
  #   aws s3 mb s3://northshift-tfstate --region us-east-1
  #   aws s3api put-bucket-versioning \
  #     --bucket northshift-tfstate \
  #     --versioning-configuration Status=Enabled
  #   aws dynamodb create-table \
  #     --table-name northshift-tflock \
  #     --attribute-definitions AttributeName=LockID,AttributeType=S \
  #     --key-schema AttributeName=LockID,KeyType=HASH \
  #     --billing-mode PAY_PER_REQUEST \
  #     --region us-east-1
  backend "s3" {
    bucket         = "northshift-tfstate"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "northshift-tflock"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}
