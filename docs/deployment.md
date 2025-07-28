# Deployment Guide

This guide covers deploying the Collaborative Web Application to Google Cloud Platform using Terraform and GitHub Actions.

## Overview

The application uses a modern CI/CD pipeline with:
- **GitHub Actions** for automated testing and deployment
- **Terraform** for infrastructure as code
- **Google Cloud Run** for serverless container deployment
- **Google Cloud Firestore** for real-time database
- **Google Cloud Storage** for file storage

## Prerequisites

1. **Google Cloud Project** with billing enabled
2. **GitHub Repository** with the application code
3. **Service Account** with appropriate permissions
4. **Terraform** installed locally (for manual deployment)

## GitHub Secrets Setup

Configure the following secrets in your GitHub repository:

### Required Secrets

1. **GCP_PROJECT_ID**: Your Google Cloud Project ID
2. **GCP_SA_KEY**: Service account JSON key (base64 encoded)

### Optional Secrets

3. **SNYK_TOKEN**: Snyk security scanning token
4. **CODECOV_TOKEN**: Codecov coverage reporting token

### Setting up Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add each secret with the appropriate value

## Automated Deployment

### Development Environment

The development environment is automatically deployed when:
- Code is pushed to the `develop` branch
- A pull request is created against the `develop` branch

**Workflow**: `.github/workflows/deploy-dev.yml`

### Production Environment

The production environment is deployed when:
- Code is pushed to the `main` branch
- A new release is published

**Workflow**: `.github/workflows/deploy-prod.yml`

## Manual Deployment

### 1. Prepare Infrastructure

```bash
cd infrastructure

# Initialize Terraform
terraform init

# Configure variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

# Plan deployment
terraform plan -var="project_id=your-project-id" -var="environment=dev"

# Apply infrastructure
terraform apply -var="project_id=your-project-id" -var="environment=dev"
```

### 2. Build and Deploy Backend

```bash
cd backend

# Build Docker image
docker build -t gcr.io/your-project-id/collaborative-app-backend:latest .

# Push to Google Container Registry
docker push gcr.io/your-project-id/collaborative-app-backend:latest

# Deploy to Cloud Run
gcloud run deploy collaborative-app-backend-dev \
  --image gcr.io/your-project-id/collaborative-app-backend:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_CLOUD_PROJECT_ID=your-project-id,ENVIRONMENT=dev"
```

### 3. Build and Deploy Frontend

```bash
cd frontend

# Build Docker image
docker build -t gcr.io/your-project-id/collaborative-app-frontend:latest .

# Push to Google Container Registry
docker push gcr.io/your-project-id/collaborative-app-frontend:latest

# Get backend URL
BACKEND_URL=$(gcloud run services describe collaborative-app-backend-dev \
  --region=us-central1 --format='value(status.url)')

# Deploy to Cloud Run
gcloud run deploy collaborative-app-frontend-dev \
  --image gcr.io/your-project-id/collaborative-app-frontend:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars="NEXT_PUBLIC_API_URL=$BACKEND_URL,ENVIRONMENT=dev"
```

## Environment Configuration

### Development Environment

- **Region**: `us-central1`
- **Auto-scaling**: 0-10 instances
- **Resources**: 1 CPU, 512MB RAM
- **Database**: Firestore in native mode
- **Storage**: Cloud Storage with lifecycle policies

### Production Environment

- **Region**: `us-central1`
- **Auto-scaling**: 1-20 instances
- **Resources**: 1 CPU, 512MB RAM
- **Database**: Firestore in native mode
- **Storage**: Cloud Storage with versioning
- **Monitoring**: Cloud Monitoring enabled
- **Security**: Vulnerability scanning enabled

## Monitoring and Logging

### Cloud Run Logs

```bash
# View backend logs
gcloud logs read "resource.type=cloud_run_revision AND resource.labels.service_name=collaborative-app-backend-dev" --limit=50

# View frontend logs
gcloud logs read "resource.type=cloud_run_revision AND resource.labels.service_name=collaborative-app-frontend-dev" --limit=50
```

### Cloud Monitoring

1. Go to Google Cloud Console
2. Navigate to **Monitoring**
3. View metrics for:
   - Request latency
   - Error rates
   - Resource utilization
   - Custom metrics

### Health Checks

The application includes health check endpoints:

- **Backend**: `GET /health`
- **Frontend**: Root endpoint

## Security Considerations

### Service Account Permissions

The backend service account has minimal required permissions:
- `roles/datastore.user` for Firestore access
- `roles/storage.admin` for Cloud Storage access

### Network Security

- Cloud Run services are accessible via HTTPS
- No VPC configuration required for basic setup
- Consider VPC Connector for private network access

### Data Security

- Firestore data is encrypted at rest
- Cloud Storage objects are encrypted
- All API communications use HTTPS/WSS

## Scaling and Performance

### Auto-scaling Configuration

```hcl
metadata {
  annotations = {
    "autoscaling.knative.dev/minScale" = "0"  # dev
    "autoscaling.knative.dev/maxScale" = "10" # dev
    "autoscaling.knative.dev/minScale" = "1"  # prd
    "autoscaling.knative.dev/maxScale" = "20" # prd
  }
}
```

### Performance Optimization

1. **Container Optimization**
   - Multi-stage Docker builds
   - Alpine Linux base images
   - Non-root user execution

2. **Database Optimization**
   - Firestore indexes for queries
   - Batch operations for bulk data
   - Connection pooling

3. **Frontend Optimization**
   - Next.js static generation
   - Image optimization
   - Code splitting

## Troubleshooting

### Common Deployment Issues

1. **Service Account Permissions**
   ```bash
   # Verify service account permissions
   gcloud projects get-iam-policy your-project-id \
     --flatten="bindings[].members" \
     --format="table(bindings.role)" \
     --filter="bindings.members:collaborative-app-sa"
   ```

2. **API Not Enabled**
   ```bash
   # Enable required APIs
   gcloud services enable run.googleapis.com
   gcloud services enable firestore.googleapis.com
   gcloud services enable storage.googleapis.com
   ```

3. **Container Build Failures**
   ```bash
   # Check build logs
   gcloud builds log [BUILD_ID]
   
   # Test build locally
   docker build -t test-image .
   ```

4. **Service Deployment Failures**
   ```bash
   # Check service status
   gcloud run services describe collaborative-app-backend-dev --region=us-central1
   
   # View recent revisions
   gcloud run revisions list --service=collaborative-app-backend-dev --region=us-central1
   ```

### Rollback Strategy

```bash
# List revisions
gcloud run revisions list --service=collaborative-app-backend-dev --region=us-central1

# Rollback to previous revision
gcloud run services update-traffic collaborative-app-backend-dev \
  --to-revisions=REVISION_NAME=100 \
  --region=us-central1
```

## Cost Optimization

### Development Environment

- Auto-scaling to 0 instances when not in use
- Firestore in native mode (pay per use)
- Cloud Storage lifecycle policies

### Production Environment

- Minimum 1 instance for availability
- Resource limits to prevent over-provisioning
- Monitoring and alerting for cost anomalies

## Next Steps

- [Setup Guide](setup.md)
- [API Documentation](api.md)
- [Architecture Overview](architecture.md) 