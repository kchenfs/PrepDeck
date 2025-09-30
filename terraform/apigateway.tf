# terraform/apigateway.tf

# ------------------------------------------------------------------------------
# API GATEWAY V2 (HTTP API)
# This creates a simple, low-cost HTTP endpoint for our webhook.
# ------------------------------------------------------------------------------
resource "aws_apigatewayv2_api" "webhook_api" {
  name          = "WebhookIngestorAPI"
  protocol_type = "HTTP"
  description   = "API for ingesting webhooks from delivery partners"

  tags = {
    Name        = "Webhook Ingestor API"
    Environment = "Production"
  }
}

# ------------------------------------------------------------------------------
# API GATEWAY STAGE
# A default stage that automatically deploys changes made to the API.
# ------------------------------------------------------------------------------
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.webhook_api.id
  name        = "$default"
  auto_deploy = true
}

# ------------------------------------------------------------------------------
# LAMBDA INTEGRATION
# This defines how API Gateway should pass requests to our Lambda function.
# ------------------------------------------------------------------------------
resource "aws_apigatewayv2_integration" "webhook_ingestor_integration" {
  api_id           = aws_apigatewayv2_api.webhook_api.id
  integration_type = "AWS_PROXY" # Standard integration type for Lambda
  integration_uri  = aws_lambda_function.webhook_ingestor.invoke_arn
}

# ------------------------------------------------------------------------------
# API GATEWAY ROUTE
# This creates the specific path and method for our webhook.
# Uber will send POST requests to https://<your_api_url>/webhooks/uber-eats
# ------------------------------------------------------------------------------
resource "aws_apigatewayv2_route" "webhook_post" {
  api_id    = aws_apigatewayv2_api.webhook_api.id
  route_key = "POST /webhooks/uber-eats"
  target    = "integrations/${aws_apigatewayv2_integration.webhook_ingestor_integration.id}"
}

# ------------------------------------------------------------------------------
# LAMBDA PERMISSION
# This is the crucial resource that allows API Gateway to invoke the
# WebhookIngestor Lambda function.
# ------------------------------------------------------------------------------
resource "aws_lambda_permission" "api_gateway_invoke" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.webhook_ingestor.function_name
  principal     = "apigateway.amazonaws.com"

  # This ARN source ensures only requests coming from our specific API route
  # are allowed to invoke the function.
  source_arn = "${aws_apigatewayv2_api.webhook_api.execution_arn}/*/${aws_apigatewayv2_route.webhook_post.route_key}"
}

# ------------------------------------------------------------------------------
# OUTPUT
# This will print the public URL of your API endpoint after you run `terraform apply`.
# ------------------------------------------------------------------------------
output "webhook_api_endpoint" {
  description = "The base URL for the webhook API endpoint."
  value       = aws_apigatewayv2_api.webhook_api.api_endpoint
}

