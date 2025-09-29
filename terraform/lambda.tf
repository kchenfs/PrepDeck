# terraform/lambda.tf

# This file assumes you have the SQS queue and IAM roles defined elsewhere
# as previously discussed.

# ------------------------------------------------------------------------------
# LAMBDA FUNCTION DEFINITIONS
# ------------------------------------------------------------------------------
data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

resource "aws_lambda_function" "webhook_ingestor" {
  function_name = "WebhookIngestor"
  role          = aws_iam_role.webhook_ingestor_role.arn
  handler       = "webhook_ingestor.handler"
  # 👇 CHANGE IS HERE: Updated to the latest supported Python version 👇
  runtime       = "python3.13"
  
  # These values are placeholders for the initial Terraform apply.
  # The CI/CD pipeline will manage the actual code package.
  filename         = "backend/placeholder.zip" 
  source_code_hash = filebase64sha256("backend/placeholder.zip")

  environment {
    variables = {
      SQS_QUEUE_URL = aws_sqs_queue.order_processing_queue.id
    }
  }

  tags = {
    Name        = "Webhook Ingestor Lambda"
    Environment = "Production"
  }
}

resource "aws_lambda_function" "order_processor" {
  function_name = "OrderProcessor"
  role          = aws_iam_role.order_processor_role.arn
  handler       = "order_processor.handler"
  # 👇 CHANGE IS HERE: Updated to the latest supported Python version 👇
  runtime       = "python3.13"
  filename      = "backend/placeholder.zip"
  source_code_hash = filebase64sha256("backend/placeholder.zip")
  timeout       = 30

  environment {
    variables = {
      TOKEN_CACHE_TABLE   = aws_dynamodb_table.api_token_cache.name
      MENU_TABLE          = aws_dynamodb_table.menu_table.name
      ORDERS_TABLE        = aws_dynamodb_table.orders_table.name
      CLIENT_ID_PARAM     = "/momotaro/uber_eats/client_id"
      CLIENT_SECRET_PARAM = "/momotaro/uber_eats/client_secret"
    }
  }

  event_source_mapping {
    event_source_arn = aws_sqs_queue.order_processing_queue.arn
    batch_size       = 1
  }

  tags = {
    Name        = "Order Processor Lambda"
    Environment = "Production"
  }
}

