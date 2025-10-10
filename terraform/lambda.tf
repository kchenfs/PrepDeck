# terraform/lambda.tf

# Data sources to get current region and account ID for ARNs
data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

# ------------------------------------------------------------------------------
# SQS DEAD LETTER QUEUE (DLQ)
# This queue acts as a safety net. Messages that fail processing multiple times
# in the main queue will be sent here for inspection and debugging.
# ------------------------------------------------------------------------------
resource "aws_sqs_queue" "order_processing_deadletter_queue" {
  name = "OrderProcessingDeadletterQueue"

  # Keep failed messages for the maximum duration (14 days) for analysis.
  message_retention_seconds = 1209600

  tags = {
    Name        = "Order Processing DLQ"
    Environment = "Production"
  }
}

# ------------------------------------------------------------------------------
# MAIN SQS QUEUE FOR ORDER PROCESSING
# This queue decouples the fast WebhookIngestor from the slower OrderProcessor.
# ------------------------------------------------------------------------------
resource "aws_sqs_queue" "order_processing_queue" {
  name = "OrderProcessingQueue"

  # The redrive_policy is the crucial link to the Dead Letter Queue.
  # If a message is received 5 times without being successfully deleted,
  # it will be moved to the DLQ specified in deadLetterTargetArn.
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.order_processing_deadletter_queue.arn
    maxReceiveCount     = 5
  })

  tags = {
    Name        = "Order Processing Queue"
    Environment = "Production"
  }
}

# ------------------------------------------------------------------------------
# SQS REDRIVE ALLOW POLICY
# This policy is required to explicitly grant the main queue permission
# to send messages to the dead letter queue.
# ------------------------------------------------------------------------------
resource "aws_sqs_queue_redrive_allow_policy" "order_processing_redrive_allow_policy" {
  queue_url = aws_sqs_queue.order_processing_deadletter_queue.id

  redrive_allow_policy = jsonencode({
    redrivePermission = "byQueue",
    sourceQueueArns   = [aws_sqs_queue.order_processing_queue.arn]
  })
}

# ------------------------------------------------------------------------------
# IAM ROLE & POLICY FOR THE WebhookIngestor LAMBDA
# ------------------------------------------------------------------------------
resource "aws_iam_role" "webhook_ingestor_role" {
  name = "WebhookIngestorLambdaRole"
  assume_role_policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      },
    ]
  })
}

resource "aws_iam_policy" "webhook_ingestor_policy" {
  name        = "WebhookIngestorLambdaPolicy"
  description = "Policy for the WebhookIngestor Lambda function"
  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [
      {
        Action   = "sqs:SendMessage"
        Effect   = "Allow"
        Resource = aws_sqs_queue.order_processing_queue.arn
      },
      {
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Effect   = "Allow"
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "webhook_ingestor_attach" {
  role       = aws_iam_role.webhook_ingestor_role.name
  policy_arn = aws_iam_policy.webhook_ingestor_policy.arn
}

# ------------------------------------------------------------------------------
# IAM ROLE & POLICY FOR THE OrderProcessor LAMBDA
# ------------------------------------------------------------------------------
resource "aws_iam_role" "order_processor_role" {
  name = "OrderProcessorLambdaRole"
  assume_role_policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      },
    ]
  })
}

resource "aws_iam_policy" "order_processor_policy" {
  name        = "OrderProcessorLambdaPolicy"
  description = "Policy for the OrderProcessor Lambda function"
  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [
      {
        Action   = ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes"]
        Effect   = "Allow"
        Resource = aws_sqs_queue.order_processing_queue.arn
      },
      {
        Action   = "ssm:GetParameters"
        Effect   = "Allow"
        Resource = [
          "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/momotaro/uber_eats/client_id",
          "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/momotaro/uber_eats/client_secret"
        ]
      },
      {
        Action   = ["dynamodb:Query", "dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:UpdateItem"]
        Effect   = "Allow"
        Resource = [
          aws_dynamodb_table.api_token_cache.arn,
          aws_dynamodb_table.menu_table.arn,
          aws_dynamodb_table.orders_table.arn
        ]
      },
      # THIS IS THE CHANGE: Grant permission to the specific AppSync API
      {
        Action   = "appsync:GraphQL"
        Effect   = "Allow"
        Resource = aws_appsync_graphql_api.orders_api.arn
      },
      {
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Effect   = "Allow"
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "order_processor_attach" {
  role       = aws_iam_role.order_processor_role.name
  policy_arn = aws_iam_policy.order_processor_policy.arn
}

# ------------------------------------------------------------------------------
# LAMBDA FUNCTION DEFINITIONS
# ------------------------------------------------------------------------------
resource "aws_lambda_function" "webhook_ingestor" {
  function_name = "WebhookIngestor"
  role          = aws_iam_role.webhook_ingestor_role.arn
  handler       = "webhook_ingestor.handler"
  runtime       = "python3.13"
  
  filename         = "../backend/placeholder.zip"
  source_code_hash = filebase64sha256("../backend/placeholder.zip")

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
  runtime       = "python3.13"
  filename      = "../backend/placeholder.zip"
  source_code_hash = filebase64sha256("../backend/placeholder.zip")
  timeout       = 30

  environment {
    variables = {
      # THIS IS THE CHANGE: Add the AppSync API URL as an environment variable
      APPSYNC_API_URL     = aws_appsync_graphql_api.orders_api.uris["GRAPHQL"]
      TOKEN_CACHE_TABLE   = aws_dynamodb_table.api_token_cache.name
      MENU_TABLE          = aws_dynamodb_table.menu_table.name
      ORDERS_TABLE        = aws_dynamodb_table.orders_table.name
      CLIENT_ID_PARAM     = "/momotaro/uber_eats/client_id"
      CLIENT_SECRET_PARAM = "/momotaro/uber_eats/client_secret"
    }
  }

  tags = {
    Name        = "Order Processor Lambda"
    Environment = "Production"
  }
}

# The SQS trigger for the OrderProcessor Lambda
resource "aws_lambda_event_source_mapping" "order_processor_trigger" {
  event_source_arn = aws_sqs_queue.order_processing_queue.arn
  function_name    = aws_lambda_function.order_processor.arn
  batch_size       = 1
}

