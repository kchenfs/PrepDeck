# ------------------------------------------------------------------------------
# DYNAMODB TABLE FOR ORDERS
# ------------------------------------------------------------------------------

resource "aws_dynamodb_table" "orders_table" {
  # Table name as specified in the plan
  name         = "Orders"
  billing_mode = "PAY_PER_REQUEST"

  # Define the primary key for the table
  hash_key = "OrderID"

  # Define the attributes of the table.
  attribute {
    name = "OrderID"
    type = "S" # "S" stands for String
  }

  tags = {
    Name        = "Momotaro Orders Table"
    Environment = "Production"
  }
}