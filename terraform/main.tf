# ------------------------------------------------------------------------------
# TERRAFORM AND PROVIDER CONFIGURATION
# ------------------------------------------------------------------------------

# This block tells Terraform which providers are needed to run your code.
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "6.14.1" # Specifies a compatible version of the AWS provider
    }
  }
}

# This block configures the AWS provider itself.
provider "aws" {
  # Specifies the AWS region where your resources will be created.
  # "ca-central-1" is the Canada (Central) region located in Montreal.
  region = "ca-central-1"

  # You can add optional default tags here that will be applied to all
  # resources created by this provider, which is great for organization.
  default_tags {
    tags = {
      Project     = "MomotaroDashboard"
      ManagedBy   = "Terraform"
    }
  }
}