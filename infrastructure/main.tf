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

# Cloud Run service for backend
resource "google_cloud_run_service" "backend" {
  name     = "collaborative-app-backend-${var.environment}"
  location = var.region
  
  template {
    spec {
      containers {
        image = google_cloud_run_service.backend.status[0].url
        
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
      }
      
      service_account_name = google_service_account.backend_service_account.email
    }
    
    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = "0"
        "autoscaling.knative.dev/maxScale" = "10"
      }
    }
  }
  
  depends_on = [google_project_service.required_apis]
}

# Cloud Run service for frontend
resource "google_cloud_run_service" "frontend" {
  name     = "collaborative-app-frontend-${var.environment}"
  location = var.region
  
  template {
    spec {
      containers {
        image = google_cloud_run_service.frontend.status[0].url
        
        env {
          name  = "NEXT_PUBLIC_API_URL"
          value = google_cloud_run_service.backend.status[0].url
        }
        
        env {
          name  = "NEXT_PUBLIC_WS_URL"
          value = replace(google_cloud_run_service.backend.status[0].url, "https://", "wss://")
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
        "autoscaling.knative.dev/minScale" = "0"
        "autoscaling.knative.dev/maxScale" = "10"
      }
    }
  }
  
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

# Allow unauthenticated access to Cloud Run services
resource "google_cloud_run_service_iam_member" "backend_public_access" {
  location = google_cloud_run_service.backend.location
  service  = google_cloud_run_service.backend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_service_iam_member" "frontend_public_access" {
  location = google_cloud_run_service.frontend.location
  service  = google_cloud_run_service.frontend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Outputs
output "backend_url" {
  value = google_cloud_run_service.backend.status[0].url
}

output "frontend_url" {
  value = google_cloud_run_service.frontend.status[0].url
}

output "storage_bucket" {
  value = google_storage_bucket.file_storage.name
} 