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

  # THE SCHEMA WITH IAM AUTH DIRECTIVE
  schema = <<EOF
type Order {
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
    # Add @aws_iam directive to allow IAM authentication for this mutation
    newOrder(order: AWSJSON): Order @aws_iam
}

type Subscription {
    onNewOrder: Order
        @aws_subscribe(mutations: ["newOrder"])
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

# Resolver for the Mutation
resource "aws_appsync_resolver" "new_order_resolver" {
  api_id      = aws_appsync_graphql_api.orders_api.id
  type        = "Mutation"
  field       = "newOrder"
  data_source = aws_appsync_datasource.none_datasource.name

  # Just pass through - let AppSync handle the JSON parsing
  request_template  = "{}"
  response_template = "$util.toJson($util.parseJson($context.arguments.order))"
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