# ------------------------------------------------------------------------------
# S3 BUCKET FOR FRONTEND REACT APPLICATION
# ------------------------------------------------------------------------------

# Create the S3 bucket. The bucket name must be globally unique.
resource "aws_s3_bucket" "site_bucket" {
  bucket = "momotaro-dashboard"

  tags = {
    Name        = "Momotaro Dashboard Frontend"
    Environment = "Production"
  }
}

# By default, S3 buckets block all public access. We will keep this secure
# configuration and only allow CloudFront to access the bucket's contents.
resource "aws_s3_bucket_public_access_block" "site_public_access_block" {
  bucket = aws_s3_bucket.site_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# This new policy grants the CloudFront Origin Access Identity (OAI)
# permission to read objects from your bucket. No other access is allowed.
resource "aws_s3_bucket_policy" "site_bucket_policy" {
  bucket = aws_s3_bucket.site_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontAccess"
        Effect    = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.oai.iam_arn
        }
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.site_bucket.arn}/*"
      }
    ]
  })
}

# NOTE: The 'aws_s3_bucket_website_configuration' resource has been removed.
# It is not needed when serving content privately through CloudFront with an OAI.
