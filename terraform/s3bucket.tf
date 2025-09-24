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

# Add this resource to disable the "Block Public Access" settings
resource "aws_s3_bucket_public_access_block" "site_public_access_block" {
  bucket = aws_s3_bucket.site_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Configure the S3 bucket to serve a static website.
resource "aws_s3_bucket_website_configuration" "site_website_config" {
  bucket = aws_s3_bucket.site_bucket.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

# Create a policy to allow public read access to the bucket's objects.
resource "aws_s3_bucket_policy" "site_bucket_policy" {
  bucket = aws_s3_bucket.site_bucket.id

  # THIS IS THE FIX: Explicitly wait for the public access block to be configured first.
  depends_on = [aws_s3_bucket_public_access_block.site_public_access_block]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.site_bucket.arn}/*"
      }
    ]
  })
}