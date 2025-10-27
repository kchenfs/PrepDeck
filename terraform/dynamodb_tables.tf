# terraform/dynamodb.tf

# ------------------------------------------------------------------------------
# DYNAMODB TABLE FOR API TOKEN CACHING
# ------------------------------------------------------------------------------
resource "aws_dynamodb_table" "api_token_cache" {
  name           = "Momotaro-Dashboard-ApiTokenCache"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "ProviderName"

  attribute {
    name = "ProviderName"
    type = "S"
  }

  tags = {
    Name        = "API Token Cache"
    Environment = "Production"
  }
}

# ------------------------------------------------------------------------------
# DYNAMODB TABLE FOR THE MENU
# ------------------------------------------------------------------------------
resource "aws_dynamodb_table" "menu_table" {
  name           = "Momotaro-Dashboard-Menu"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "ItemID" # Your internal, primary ID

  # Define all attributes that will be used in keys or indexes
  attribute {
    name = "ItemID"
    type = "S"
  }
  
  attribute {
    name = "UberEatsID" # The ID from the Uber Eats system
    type = "S"
  }

  # THIS IS THE CHANGE: Add a Global Secondary Index
  # This lets us query the table efficiently using the UberEatsID.
  global_secondary_index {
    name            = "UberEatsID-index"
    hash_key        = "UberEatsID"
    projection_type = "ALL" # Include all attributes in the index
  }

  tags = {
    Name        = "Menu Table"
    Environment = "Production"
  }
}

# ------------------------------------------------------------------------------
# DYNAMODB TABLE FOR ORDERS
# ------------------------------------------------------------------------------
resource "aws_dynamodb_table" "orders_table" {
  name         = "Momotaro-Dashboard-Orders"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "OrderID"

  attribute {
    name = "OrderID"
    type = "S"
  }

  tags = {
    Name        = "Momotaro Orders Table"
    Environment = "Production"
  }
}

resource "aws_dynamodb_table" "integration_mapping" {
  name           = "Prepdeck-integration-mapping"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "userId"        # e.g., Cognito User Sub or your internal User ID
  range_key      = "integrationId" # e.g., "uber-{store_id}" or just "{store_id}" if only Uber for now

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "integrationId"
    type = "S"
  }

  # Optional: Add other attributes like 'serviceName', 'connectedAt', etc.
  # attribute {
  #   name = "serviceName"
  #   type = "S"
  # }
  # attribute {
  #   name = "connectedAt"
  #   type = "S" # Store as ISO 8601 string
  # }

}

# Add an output for the table name
output "integration_mapping_table_name" {
  value = aws_dynamodb_table.integration_mapping.name
}
