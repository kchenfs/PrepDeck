# terraform/lambda.tf

# ------------------------------------------------------------------------------
# SQS QUEUE FOR DECOUPLING ORDER INGESTION FROM PROCESSING
# ------------------------------------------------------------------------------
resource "aws_sqs_queue" "order_processing_queue" {
  name = "OrderProcessingQueue"

  tags = {
    Name        = "Order Processing Queue"
    Environment = "Production"
  }
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
        Action   = "logs:CreateLogGroup"
        Effect   = "Allow"
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Effect   = "Allow"
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/WebhookIngestor:*"
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
      {
        Action   = "appsync:GraphQL"
        Effect   = "Allow"
        Resource = "*" # TODO: Replace with your specific AppSync API ARN when created
      },
      {
        Action   = "logs:CreateLogGroup"
        Effect   = "Allow"
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Effect   = "Allow"
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/OrderProcessor:*"
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
# Data sources to get current region and account ID for ARNs
data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

# Placeholder for your Lambda deployment package
# In a real CI/CD pipeline, you would create this zip file with your code.
resource "null_resource" "lambda_package_placeholder" {
  triggers = {
    always_run = timestamp()
  }

  provisioner "local-exec" {
    command = "mkdir -p ../dist && touch ../dist/lambda_package.zip"
  }
}

resource "aws_lambda_function" "webhook_ingestor" {
  function_name    = "WebhookIngestor"
  role             = aws_iam_role.webhook_ingestor_role.arn
  handler          = "main.handler" # Assumes your handler is in a file named 'main.py' or 'main.js'
  runtime          = "python3.11"   # Or nodejs18.x, etc.
  filename         = "../dist/lambda_package.zip"
  source_code_hash = filebase64sha256("../dist/lambda_package.zip")

  depends_on = [null_resource.lambda_package_placeholder]

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
  function_name    = "OrderProcessor"
  role             = aws_iam_role.order_processor_role.arn
  handler          = "main.handler"
  runtime          = "python3.11"
  filename         = "../dist/lambda_package.zip"
  source_code_hash = filebase64sha256("../dist/lambda_package.zip")
  timeout          = 30 # Increased timeout for processing

  depends_on = [null_resource.lambda_package_placeholder]

  environment {
    variables = {
      TOKEN_CACHE_TABLE = aws_dynamodb_table.api_token_cache.name
      MENU_TABLE        = aws_dynamodb_table.menu_table.name
      ORDERS_TABLE      = aws_dynamodb_table.orders_table.name
      CLIENT_ID_PARAM   = "/momotaro/uber_eats/client_id"
      CLIENT_SECRET_PARAM = "/momotaro/uber_eats/client_secret"
    }
  }

  # This links the SQS queue as the trigger for this Lambda
  event_source_mapping {
    event_source_arn = aws_sqs_queue.order_processing_queue.arn
    batch_size       = 1 # Process one order at a time
  }

  tags = {
    Name        = "Order Processor Lambda"
    Environment = "Production"
  }
}

# Note: The OrderActionHandler Lambda would be defined similarly to the others,
# with its own specific IAM role and policy. For brevity, it is omitted here
# but would follow the same pattern.

