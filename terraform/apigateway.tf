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

  # 👇 MODIFICATION: Add your new integration and route to the triggers
  triggers = {
    redeployment = sha1(jsonencode([
      # Existing resources
      aws_apigatewayv2_integration.webhook_ingestor_integration.id,
      aws_apigatewayv2_route.webhook_post.id,

      # ADDED: New resources for OAuth
      aws_apigatewayv2_integration.uber_oauth_callback_integration.id,
      aws_apigatewayv2_route.uber_oauth_callback_get.id
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
  source_arn    = "${aws_apigatewayv2_api.webhook_api.execution_arn}/*/*/webhooks/uber-eats"
}


# ------------------------------------------------------------------------------
# 👇 ADD THIS SECTION: LAMBDA INTEGRATION & ROUTE FOR UBER OAUTH CALLBACK
# ------------------------------------------------------------------------------

# 1. Create the integration to link the API to your OAuth Lambda
resource "aws_apigatewayv2_integration" "uber_oauth_callback_integration" {
  api_id           = aws_apigatewayv2_api.webhook_api.id
  integration_type = "AWS_PROXY"
  
  # This points to the OAuth lambda you defined in lambda.tf 
  integration_uri  = aws_lambda_function.uber_oauth_callback_lambda.invoke_arn
}

# 2. Create the GET route that Uber will redirect the user to
resource "aws_apigatewayv2_route" "uber_oauth_callback_get" {
  api_id    = aws_apigatewayv2_api.webhook_api.id
  route_key = "GET /auth/uber/callback"
  target    = "integrations/${aws_apigatewayv2_integration.uber_oauth_callback_integration.id}"
}

# 3. Give API Gateway permission to invoke this specific Lambda
resource "aws_lambda_permission" "api_gateway_invoke_oauth_callback" {
  statement_id  = "AllowAPIGatewayInvokeOAuthCallback"
  action        = "lambda:InvokeFunction"
  
  # This points to the OAuth lambda from lambda.tf 
  function_name = aws_lambda_function.uber_oauth_callback_lambda.function_name
  principal     = "apigateway.amazonaws.com"

  # This ARN must match your API and the new route
  source_arn    = "${aws_apigatewayv2_api.webhook_api.execution_arn}/*/*/auth/uber/callback"
}


# ------------------------------------------------------------------------------
# OUTPUT
# ------------------------------------------------------------------------------
output "webhook_api_endpoint" {
  description = "The base URL for the webhook API endpoint."
  value       = aws_apigatewayv2_api.webhook_api.api_endpoint
}

# 4. ADD THIS OUTPUT: This is the full URL you need for your Uber app
output "uber_oauth_callback_url" {
  description = "The full URL to use as the Redirect URI in the Uber Dev Dashboard."
  value       = "${aws_apigatewayv2_api.webhook_api.api_endpoint}/auth/uber/callback"
}