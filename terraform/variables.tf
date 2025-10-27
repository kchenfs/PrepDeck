# terraform/variables.tf

variable "aws_region" {
  description = "AWS region for deployment (e.g., ca-central-1)"
  type        = string
  default     = "ca-central-1" # Set your default region here
}

variable "frontend_url_success" {
  description = "Frontend URL to redirect to on successful OAuth connection"
  type        = string
  default     = "https://prepdeck.momotarosushi.ca/integrations?service=uber&status=success" # Adjust domain/path if needed
}

variable "frontend_url_error" {
  description = "Frontend URL to redirect to on failed OAuth connection"
  type        = string
  default     = "https://prepdeck.momotarosushi.ca/integrations?service=uber&status=error" # Adjust domain/path if needed
}


variable "google_client_id" {
  description = "Google OAuth Client ID"
  type        = string
  sensitive   = true
}

variable "google_client_secret" {
  description = "Google OAuth Client Secret"
  type        = string
  sensitive   = true
}


variable "uber_eats_client_id_prod" {
  description = "The Client ID for the Uber Eats API."
  type        = string
  sensitive   = true
}

variable "uber_eats_client_secret_prod" {
  description = "The Client Secret for the Uber Eats API."
  type        = string
  sensitive   = true
}


variable "uber_eats_client_id_dev" {
  description = "The Client ID for the Uber Eats API."
  type        = string
  sensitive   = true
}

variable "uber_eats_client_secret_dev" {
  description = "The Client Secret for the Uber Eats API."
  type        = string
  sensitive   = true
}