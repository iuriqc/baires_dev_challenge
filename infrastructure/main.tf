terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
  
  backend "gcs" {
    bucket = "collaborative-app-terraform-state"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

# Enable required APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "cloudbuild.googleapis.com",
    "run.googleapis.com",
    "firestore.googleapis.com",
    "storage.googleapis.com",
    "artifactregistry.googleapis.com"
  ])
  
  service = each.value
  disable_dependent_services = true
}

# Firestore Database
resource "google_firestore_database" "database" {
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"
  
  depends_on = [google_project_service.required_apis]
}

# Cloud Storage Bucket for files
resource "google_storage_bucket" "file_storage" {
  name          = "${var.project_id}-files-${var.environment}"
  location      = var.region
  force_destroy = var.environment == "prd"
  
  uniform_bucket_level_access = true
  
  versioning {
    enabled = true
  }
  
  lifecycle_rule {
    condition {
      age = 365
    }
    action {
      type = "Delete"
    }
  }
}

# Artifact Registry for container images
resource "google_artifact_registry_repository" "app_repository" {
  location      = var.region
  repository_id = "collaborative-app"
  description   = "Container repository for collaborative app"
  format        = "DOCKER"
  
  depends_on = [google_project_service.required_apis]
}

# Service account for backend
resource "google_service_account" "backend_service_account" {
  account_id   = "collaborative-app-backend-${var.environment}"
  display_name = "Collaborative App Backend Service Account"
}

# IAM bindings for backend service account
resource "google_project_iam_member" "backend_firestore_user" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.backend_service_account.email}"
}

resource "google_project_iam_member" "backend_storage_admin" {
  project = var.project_id
  role    = "roles/storage.admin"
  member  = "serviceAccount:${google_service_account.backend_service_account.email}"
}

# Cloud Run service for backend
resource "google_cloud_run_service" "backend" {
  name     = "collaborative-app-backend-${var.environment}"
  location = var.region
  
  template {
    spec {
      containers {
        image = var.backend_image != "" ? var.backend_image : "${var.region}-docker.pkg.dev/${var.project_id}/collaborative-app/collaborative-app-backend:latest"
        
        env {
          name  = "GOOGLE_CLOUD_PROJECT_ID"
          value = var.project_id
        }
        
        env {
          name  = "GCS_BUCKET_NAME"
          value = google_storage_bucket.file_storage.name
        }
        
        env {
          name  = "ENVIRONMENT"
          value = var.environment
        }
        
        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }
        
        # No health checks - let the container start naturally
      }
      
      service_account_name = google_service_account.backend_service_account.email
    }
    
    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = var.environment == "dev" ? "0" : "1"
        "autoscaling.knative.dev/maxScale" = var.environment == "dev" ? "10" : "20"
        "run.googleapis.com/execution-environment" = "gen2"
        "run.googleapis.com/cloudsql-instances" = ""
        "run.googleapis.com/client-name" = "terraform"
      }
    }
  }
  
  depends_on = [google_project_service.required_apis]
  
  # Ignore changes to image during initial deployment
  lifecycle {
    ignore_changes = [
      template[0].spec[0].containers[0].image
    ]
  }
}

# Explicitly set public access for backend
resource "google_cloud_run_service_iam_member" "backend_public" {
  location = google_cloud_run_service.backend.location
  service  = google_cloud_run_service.backend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
  
  depends_on = [google_cloud_run_service.backend]
}

# Cloud Run service for frontend
resource "google_cloud_run_service" "frontend" {
  name     = "collaborative-app-frontend-${var.environment}"
  location = var.region
  
  template {
    spec {
      containers {
        image = var.frontend_image != "" ? var.frontend_image : "${var.region}-docker.pkg.dev/${var.project_id}/collaborative-app/collaborative-app-frontend:latest"
        
        env {
          name  = "NEXT_PUBLIC_API_URL"
          value = "https://collaborative-app-backend-${var.environment}-${replace(var.region, "-", "")}-${var.project_id}.run.app"
        }
        
        env {
          name  = "NEXT_PUBLIC_WS_URL"
          value = "wss://collaborative-app-backend-${var.environment}-${replace(var.region, "-", "")}-${var.project_id}.run.app"
        }
        
        env {
          name  = "ENVIRONMENT"
          value = var.environment
        }
        
        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }
      }
    }
    
    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = var.environment == "dev" ? "0" : "1"
        "autoscaling.knative.dev/maxScale" = var.environment == "dev" ? "10" : "20"
        "run.googleapis.com/execution-environment" = "gen2"
      }
    }
  }
  
  depends_on = [google_project_service.required_apis]
  
  # Ignore changes to image during initial deployment
  lifecycle {
    ignore_changes = [
      template[0].spec[0].containers[0].image
    ]
  }
}

# Allow unauthenticated access to Cloud Run services
resource "google_cloud_run_service_iam_member" "frontend_public_access" {
  location = google_cloud_run_service.frontend.location
  service  = google_cloud_run_service.frontend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Outputs
output "backend_url" {
  value = "https://collaborative-app-backend-${var.environment}-${replace(var.region, "-", "")}-${var.project_id}.run.app"
}

output "frontend_url" {
  value = "https://collaborative-app-frontend-${var.environment}-${replace(var.region, "-", "")}-${var.project_id}.run.app"
}

output "storage_bucket" {
  value = google_storage_bucket.file_storage.name
} 