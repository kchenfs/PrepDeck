# terraform/apigateway.tf

# ADDITION 1: Create a CloudWatch Log Group for the API Gateway logs.
resource "aws_cloudwatch_log_group" "api_gateway_logs" {
  name              = "/aws/apigateway/${aws_apigatewayv2_api.webhook_api.name}"
  retention_in_days = 30
}

# ------------------------------------------------------------------------------
# API GATEWAY V2 (HTTP API)
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
# API GATEWAY DEPLOYMENT
# ------------------------------------------------------------------------------
resource "aws_apigatewayv2_deployment" "webhook_deployment" {
  api_id = aws_apigatewayv2_api.webhook_api.id

  lifecycle {
    create_before_destroy = true
  }

  triggers = {
    redeployment = sha1(jsonencode([
      aws_apigatewayv2_integration.webhook_ingestor_integration.id,
      aws_apigatewayv2_route.webhook_post.id,
    ]))
  }
}

# ------------------------------------------------------------------------------
# API GATEWAY STAGE
# ------------------------------------------------------------------------------
resource "aws_apigatewayv2_stage" "default" {
  api_id = aws_apigatewayv2_api.webhook_api.id
  name   = "$default"

  auto_deploy   = false
  deployment_id = aws_apigatewayv2_deployment.webhook_deployment.id

  # ADDITION 2: Configure the stage to write detailed logs to the new log group.
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway_logs.arn
    format = jsonencode({
      requestId               = "$context.requestId"
      sourceIp                = "$context.identity.sourceIp"
      requestTime             = "$context.requestTime"
      protocol                = "$context.protocol"
      httpMethod              = "$context.httpMethod"
      resourcePath            = "$context.resourcePath"
      status                  = "$context.status"
      responseLength          = "$context.responseLength"
      integrationStatus       = "$context.integration.status"
      integrationLatency      = "$context.integration.latency"
      integrationErrorMessage = "$context.integration.error"
      errorMessageString      = "$context.error.message"
    })
  }
}


# ------------------------------------------------------------------------------
# LAMBDA INTEGRATION & ROUTE
# ------------------------------------------------------------------------------
resource "aws_apigatewayv2_integration" "webhook_ingestor_integration" {
  api_id           = aws_apigatewayv2_api.webhook_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.webhook_ingestor.invoke_arn
}

resource "aws_apigatewayv2_route" "webhook_post" {
  api_id    = aws_apigatewayv2_api.webhook_api.id
  route_key = "POST /webhooks/uber-eats"
  target    = "integrations/${aws_apigatewayv2_integration.webhook_ingestor_integration.id}"
}

# ------------------------------------------------------------------------------
# LAMBDA PERMISSION
# ------------------------------------------------------------------------------
resource "aws_lambda_permission" "api_gateway_invoke" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.webhook_ingestor.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.webhook_api.execution_arn}/*/${aws_apigatewayv2_route.webhook_post.route_key}"
}


# ------------------------------------------------------------------------------
# OUTPUT
# ------------------------------------------------------------------------------
output "webhook_api_endpoint" {
  description = "The base URL for the webhook API endpoint."
  value       = aws_apigatewayv2_api.webhook_api.api_endpoint
}