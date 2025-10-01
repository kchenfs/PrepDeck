# terraform/cloudfront.tf

# ------------------------------------------------------------------------------
# ADDITIONAL AWS PROVIDER FOR US-EAST-1
# This is required specifically for the ACM certificate, as CloudFront can only
# use certificates created in the us-east-1 (N. Virginia) region.
# ------------------------------------------------------------------------------
provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"
}

# ------------------------------------------------------------------------------
# AWS CERTIFICATE MANAGER (ACM)
# This resource requests a free, public SSL/TLS certificate for your custom domain.
# ------------------------------------------------------------------------------
resource "aws_acm_certificate" "site_cert" {
  # THIS IS THE FIX: Tell Terraform to use the aliased provider for this resource.
  provider = aws.us-east-1

  domain_name       = "prepdeck.momotarosushi.ca"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "prepdeck.momotarosushi.ca Certificate"
  }
}

# ------------------------------------------------------------------------------
# CLOUDFRONT ORIGIN ACCESS CONTROL (OAC)
# ------------------------------------------------------------------------------
resource "aws_cloudfront_origin_access_control" "s3_oac" {
  name                              = "MomotaroDashboardS3OAC"
  description                       = "Origin Access Control for Momotaro Dashboard S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ------------------------------------------------------------------------------
# CLOUDFRONT DISTRIBUTION
# ------------------------------------------------------------------------------
resource "aws_cloudfront_distribution" "site_distribution" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CloudFront distribution for Momotaro Dashboard"
  default_root_object = "index.html"

  aliases = [aws_acm_certificate.site_cert.domain_name]

  origin {
    domain_name              = aws_s3_bucket.site_bucket.bucket_regional_domain_name
    origin_id                = "S3-${aws_s3_bucket.site_bucket.id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.s3_oac.id
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.site_bucket.id}"

    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  custom_error_response {
    error_caching_min_ttl = 0
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
  }
  
  custom_error_response {
    error_caching_min_ttl = 0
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
  }

  viewer_certificate {
    acm_certificate_arn = aws_acm_certificate.site_cert.arn
    ssl_support_method  = "sni-only"
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = {
    Name = "Momotaro Dashboard Distribution"
  }
}


# ------------------------------------------------------------------------------
# OUTPUTS
# ------------------------------------------------------------------------------
output "cloudfront_domain_name" {
  description = "The domain name of the CloudFront distribution. Use this for your CNAME record."
  value       = aws_cloudfront_distribution.site_distribution.domain_name
}

output "acm_certificate_validation_name" {
  description = "The name of the CNAME record needed to validate the ACM certificate."
  value       = tolist(aws_acm_certificate.site_cert.domain_validation_options)[0].resource_record_name
}

output "acm_certificate_validation_value" {
  description = "The value of the CNAME record needed to validate the ACM certificate."
  value       = tolist(aws_acm_certificate.site_cert.domain_validation_options)[0].resource_record_value
}

