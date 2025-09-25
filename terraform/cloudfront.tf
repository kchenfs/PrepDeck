# terraform/cloudfront.tf

# ------------------------------------------------------------------------------
# ACM CERTIFICATE FOR HTTPS (SSL)
# ------------------------------------------------------------------------------
# This resource requests a public SSL certificate from AWS Certificate Manager (ACM)
# so your site can be served securely over HTTPS.
#
# IMPORTANT: After you run `terraform apply`, AWS requires you to prove you own
# this domain. Terraform will output a CNAME record that you MUST add to your
# GoDaddy DNS settings to complete this validation process.
resource "aws_acm_certificate" "site_cert" {
  domain_name       = "prepdeck.momotarosushi.ca"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "prepdeck.momotarosushi.ca cert"
    Environment = "Production"
  }
}

# ------------------------------------------------------------------------------
# CLOUDFRONT ORIGIN ACCESS IDENTITY (OAI)
# ------------------------------------------------------------------------------
# This creates a special CloudFront "user" that will be given permission
# to access your S3 bucket's files. This is the key to making your bucket private.
resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = "OAI for prepdeck-s3-bucket"
}

# ------------------------------------------------------------------------------
# CLOUDFRONT DISTRIBUTION
# ------------------------------------------------------------------------------
resource "aws_cloudfront_distribution" "s3_distribution" {
  # This links the distribution to your S3 bucket as the "origin" of the files.
  origin {
    domain_name = aws_s3_bucket.site_bucket.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.site_bucket.id}"

    # Connects the origin to the OAI, enforcing private access.
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CloudFront distribution for PrepDeck"
  default_root_object = "index.html"

  # Link to your custom domain.
  aliases = ["prepdeck.momotarosushi.ca"]

  # PriceClass_100 is the most cost-effective option and includes edge locations
  # in North America and Europe, which is perfect for serving users in Toronto.
  price_class = "PriceClass_100"

  # Default cache settings for how files are handled.
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.site_bucket.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https" # Enforce HTTPS
    min_ttl                = 0
    default_ttl            = 3600 # Cache files for 1 hour by default
    max_ttl                = 86400 # Cache files for up to 24 hours
  }
  
  # This is critical for React apps. If a user goes directly to /dashboard,
  # this rule ensures CloudFront serves index.html, allowing React Router to take over.
  custom_error_response {
    error_code            = 403 # Forbidden
    response_code         = 200
    response_page_path    = "/index.html"
  }
  custom_error_response {
    error_code            = 404 # Not Found
    response_code         = 200
    response_page_path    = "/index.html"
  }

  # This section configures the SSL certificate.
  viewer_certificate {
    acm_certificate_arn = aws_acm_certificate.site_cert.arn
    ssl_support_method  = "sni-only" # Modern standard for SSL
  }

  # Geo-restriction to serve content only to users in Canada.
  # Note: CloudFront restricts by country, not city, so this is the closest setting.
  restrictions {
    geo_restriction {
      restriction_type = "whitelist"
      locations        = ["CA"] # ISO 3166-1 alpha-2 code for Canada
    }
  }

  tags = {
    Name        = "PrepDeck Distribution"
    Environment = "Production"
  }
}

# ------------------------------------------------------------------------------
# TERRAFORM OUTPUTS
# ------------------------------------------------------------------------------
# These outputs will display the information you need for GoDaddy after `terraform apply`.
output "cloudfront_domain_name" {
  value       = aws_cloudfront_distribution.s3_distribution.domain_name
  description = "The CloudFront domain name. Use this for the CNAME record for 'prepdeck'."
}

output "acm_certificate_validation_name" {
  value       = tolist(aws_acm_certificate.site_cert.domain_validation_options)[0].resource_record_name
  description = "The NAME for the CNAME record needed to validate your ACM SSL certificate."
}

output "acm_certificate_validation_value" {
  value       = tolist(aws_acm_certificate.site_cert.domain_validation_options)[0].resource_record_value
  description = "The VALUE for the CNAME record needed to validate your ACM SSL certificate."
}
