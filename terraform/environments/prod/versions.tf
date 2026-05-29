terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Recommended: remote state in eu-north-1 (create bucket + DynamoDB lock table first).
  # backend "s3" {
  #   bucket         = "your-terraform-state-eu-north-1"
  #   key            = "expense-tracker/prod/terraform.tfstate"
  #   region         = "eu-north-1"
  #   dynamodb_table = "terraform-locks"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = "prod"
      ManagedBy   = "terraform"
    }
  }
}
