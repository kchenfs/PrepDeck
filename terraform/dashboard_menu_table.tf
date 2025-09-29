resource "aws_dynamodb_table" "menu_table" {
  name           = "Menu"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "ItemID"

  attribute {
    name = "ItemID"
    type = "S"
  }

  tags = {
    Name        = "Menu Table"
    Environment = "Production"
  }
}