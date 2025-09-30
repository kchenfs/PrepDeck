
# ------------------------------------------------------------------------------
# APPSYNC GRAPHQL API
# This is the real-time layer that will push new orders to the frontend.
# ------------------------------------------------------------------------------
resource "aws_appsync_graphql_api" "orders_api" {
  name                = "MomotaroOrdersAPI"
  authentication_type = "AMAZON_COGNITO_USER_POOLS"

  # Link AppSync to your existing Cognito User Pool for security
  user_pool_config {
    aws_region     = data.aws_region.current.id # Use .id instead of .name to avoid deprecation warning
    user_pool_id   = aws_cognito_user_pool.user_pool.id
    default_action = "ALLOW"
  }

  # THE SCHEMA IS NOW DEFINED DIRECTLY INSIDE THIS RESOURCE
  schema = <<EOF
type Order {
    OrderID: ID!
    DisplayID: String
    State: String
    # Add other relevant order fields that you want to display on the dashboard
}

# THIS IS THE FIX: Add a placeholder Query type to satisfy the schema requirements.
type Query {
    # This query doesn't need to do anything, it just needs to exist.
    get_status: String
}

type Mutation {
    # This is the mutation our OrderProcessor Lambda will call.
    newOrder(order: AWSJSON): Order
}

type Subscription {
    # This is the subscription our React frontend will listen to.
    onNewOrder: Order
        @aws_subscribe(mutations: ["newOrder"])
}

schema {
    # Add the query type to the schema definition.
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

  request_template  = "{ \"payload\": $util.toJson($context.arguments) }"
  response_template = "$util.toJson($context.result)"
}

# Resolver for the placeholder Query
resource "aws_appsync_resolver" "get_status_resolver" {
  api_id      = aws_appsync_graphql_api.orders_api.id
  type        = "Query"
  field       = "get_status"
  data_source = aws_appsync_datasource.none_datasource.name

  # This resolver simply returns a static string.
  request_template  = "{}"
  response_template = "$util.toJson(\"ok\")"
}


# ------------------------------------------------------------------------------
# OUTPUTS
# These will be needed for your frontend configuration.
# ------------------------------------------------------------------------------
output "appsync_graphql_api_url" {
  description = "The URL for the AppSync GraphQL API."
  value       = aws_appsync_graphql_api.orders_api.uris["GRAPHQL"]
}

output "appsync_graphql_api_id" {
  description = "The ID of the AppSync GraphQL API."
  value       = aws_appsync_graphql_api.orders_api.id
}

