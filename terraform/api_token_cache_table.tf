esource "aws_dynamodb_table" "api_token_cache" {
  name           = "ApiTokenCache"
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