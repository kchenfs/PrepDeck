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

  # 👇 ADD THIS BLOCK TO CONFIGURE REMOTE STATE 👇
  backend "s3" {
    # The name of the S3 bucket you created to store the state file.
    bucket = "momotaro-terraform-state-f8x2y7"

    # The path and filename for the state file inside the S3 bucket.
    key = "global/terraform.tfstate"

    # The AWS region where your S3 bucket and DynamoDB table are located.
    region = "ca-central-1"

    # The name of the DynamoDB table used for state locking.
    dynamodb_table = "momotaro-terraform-lock"
    
    # Encrypts the state file at rest in S3.
    encrypt = true
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