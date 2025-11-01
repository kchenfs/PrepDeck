# ------------------------------------------------------------------------------
# APPSYNC GRAPHQL API
# This is the real-time layer that will push new orders to the frontend.
# ------------------------------------------------------------------------------
resource "aws_appsync_graphql_api" "orders_api" {
  name                = "MomotaroOrdersAPI"
  authentication_type = "AMAZON_COGNITO_USER_POOLS"

  # Link AppSync to your existing Cognito User Pool for security
  user_pool_config {
    aws_region     = data.aws_region.current.id
    user_pool_id   = aws_cognito_user_pool.user_pool.id
    default_action = "ALLOW"
  }

  additional_authentication_provider {
    authentication_type = "AWS_IAM"
  }

  # Enable CloudWatch Logs for AppSync
  log_config {
    cloudwatch_logs_role_arn = aws_iam_role.appsync_logs_role.arn
    field_log_level          = "ALL"  # Options: NONE, ERROR, ALL
    exclude_verbose_content  = false
  }

  # THE SCHEMA WITH IAM AUTH DIRECTIVE
    schema = <<EOF
type Order {
    OrderID: ID!
    DisplayID: String
    State: String
    Items: AWSJSON
    SpecialInstructions: String
}

input OrderInput {
    OrderID: ID!
    DisplayID: String
    State: String
    Items: AWSJSON
    SpecialInstructions: String
}

type Query {
    get_status: String
}

type Mutation {
    # Allow BOTH IAM (for Lambda) and Cognito (for frontend if needed)
    newOrder(order: OrderInput): Order @aws_iam @aws_cognito_user_pools
}

type Subscription {
    # Subscriptions inherit auth from the mutation that triggers them
    onNewOrder: Order
        @aws_subscribe(mutations: ["newOrder"])
        @aws_cognito_user_pools
}

schema {
    query: Query
    mutation: Mutation
    subscription: Subscription
}
EOF

  tags = {
    Name        = "Momotaro Orders API"
    Environment = "Production"
  }
}

# ------------------------------------------------------------------------------
# APPSYNC DATA SOURCE & RESOLVER
# This configures a "NONE" data source for our real-time pub/sub model.
# ------------------------------------------------------------------------------
resource "aws_appsync_datasource" "none_datasource" {
  api_id = aws_appsync_graphql_api.orders_api.id
  name   = "NoneDataSource"
  type   = "NONE"
}

# Resolver for the Mutation - FIXED VERSION
resource "aws_appsync_resolver" "new_order_resolver" {
  api_id      = aws_appsync_graphql_api.orders_api.id
  type        = "Mutation"
  field       = "newOrder"
  data_source = aws_appsync_datasource.none_datasource.name

  request_template  = <<EOF
{
  "version": "2018-05-29",
  "payload": {}
}
EOF

  # FIXED: Return the order input directly as an Order type
  response_template = <<EOF
$util.toJson($context.arguments.order)
EOF
}

# Resolver for the placeholder Query
resource "aws_appsync_resolver" "get_status_resolver" {
  api_id      = aws_appsync_graphql_api.orders_api.id
  type        = "Query"
  field       = "get_status"
  data_source = aws_appsync_datasource.none_datasource.name

  request_template  = "{}"
  response_template = "$util.toJson(\"ok\")"
}

# ------------------------------------------------------------------------------
# OUTPUTS
# ------------------------------------------------------------------------------
output "appsync_graphql_api_url" {
  description = "The URL for the AppSync GraphQL API."
  value       = aws_appsync_graphql_api.orders_api.uris["GRAPHQL"]
}

output "appsync_graphql_api_id" {
  description = "The ID of the AppSync GraphQL API."
  value       = aws_appsync_graphql_api.orders_api.id
}

# ------------------------------------------------------------------------------
# IAM ROLE FOR APPSYNC CLOUDWATCH LOGS
# ------------------------------------------------------------------------------
resource "aws_iam_role" "appsync_logs_role" {
  name = "MomotaroAppSyncLogsRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "appsync.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "appsync_logs_policy" {
  role       = aws_iam_role.appsync_logs_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSAppSyncPushToCloudWatchLogs"
}