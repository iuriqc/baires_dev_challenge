variable "project_id" {
  description = "Google Cloud Project ID"
  type        = string
}

variable "region" {
  description = "Google Cloud region"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "Google Cloud zone"
  type        = string
  default     = "us-central1-a"
}

variable "environment" {
  description = "Environment (dev or prd)"
  type        = string
  default     = "dev"
  
  validation {
    condition     = contains(["dev", "prd"], var.environment)
    error_message = "Environment must be either 'dev' or 'prd'."
  }
}

variable "domain" {
  description = "Custom domain for the application"
  type        = string
  default     = ""
}

variable "enable_ssl" {
  description = "Enable SSL for custom domain"
  type        = bool
  default     = false
} 