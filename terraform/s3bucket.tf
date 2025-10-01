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


# ------------------------------------------------------------------------------
# S3 BUCKET POLICY
# This policy is added to your S3 bucket to grant the CloudFront distribution
# permission to read the files in the bucket.
# ------------------------------------------------------------------------------
resource "aws_s3_bucket_policy" "allow_cloudfront_access" {
  bucket = aws_s3_bucket.site_bucket.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.site_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.site_distribution.arn
          }
        }
      }
    ]
  })
}

