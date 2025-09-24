# terraform/restaurants_table.tf

# ------------------------------------------------------------------------------
# DYNAMODB TABLE FOR RESTAURANTS
# ------------------------------------------------------------------------------

resource "aws_dynamodb_table" "restaurants_table" {
  # Table name for storing restaurant information
  name         = "Restaurants"
  billing_mode = "PAY_PER_REQUEST"

  # The primary key, which will link to the Cognito custom attribute
  hash_key = "RestaurantID"

  # Define the attributes of the table.
  attribute {
    name = "RestaurantID"
    type = "S" # "S" for String
  }

  # Add other useful attributes for each restaurant.
  # Note: You only need to define attributes that are part of a key or index here.
  # Other attributes like RestaurantName can be added to items without being defined in the schema.

  tags = {
    Name        = "Momotaro Restaurants Table"
    Environment = "Production"
  }
}