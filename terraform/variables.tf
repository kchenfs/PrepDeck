# terraform/variables.tf

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


variable "uber_eats_client_id" {
  description = "The Client ID for the Uber Eats API."
  type        = string
  sensitive   = true
}

variable "uber_eats_client_secret" {
  description = "The Client Secret for the Uber Eats API."
  type        = string
  sensitive   = true
}
