# Setup Guide

This guide will help you set up the Collaborative Web Application for local development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **Python** (v3.9 or higher)
- **Google Cloud SDK**
- **Terraform** (v1.0 or higher)
- **Docker** (optional, for containerized development)

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd baires_dev_challenge
```

### 2. Backend Setup

#### Install Python Dependencies

```bash
cd backend
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

#### Configure Environment Variables

Copy the example environment file and configure it:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GCS_BUCKET_NAME=collaborative-app-files-dev

# FastAPI Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=true

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

#### Set up Google Cloud Authentication

```bash
# Install Google Cloud SDK if not already installed
gcloud auth application-default login
gcloud config set project your-project-id
```

#### Run the Backend

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`

### 3. Frontend Setup

#### Install Node.js Dependencies

```bash
cd frontend
npm install
```

#### Configure Environment Variables

```bash
cp env.example .env.local
```

Edit `.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# App Configuration
NEXT_PUBLIC_APP_NAME=Collaborative Web App
NEXT_PUBLIC_APP_VERSION=1.0.0
```

#### Run the Frontend

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Google Cloud Setup

### 1. Create a New Project

```bash
gcloud projects create collaborative-app-$(date +%s) --name="Collaborative Web App"
gcloud config set project collaborative-app-$(date +%s)
```

### 2. Enable Required APIs

```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

### 3. Create Service Account

```bash
gcloud iam service-accounts create collaborative-app-sa \
    --display-name="Collaborative App Service Account"

gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
    --member="serviceAccount:collaborative-app-sa@$(gcloud config get-value project).iam.gserviceaccount.com" \
    --role="roles/datastore.user"

gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
    --member="serviceAccount:collaborative-app-sa@$(gcloud config get-value project).iam.gserviceaccount.com" \
    --role="roles/storage.admin"
```

### 4. Create and Download Service Account Key

```bash
gcloud iam service-accounts keys create collaborative-app-sa-key.json \
    --iam-account=collaborative-app-sa@$(gcloud config get-value project).iam.gserviceaccount.com
```

## Infrastructure Setup

### 1. Initialize Terraform

```bash
cd infrastructure
terraform init
```

### 2. Configure Terraform Variables

Copy and edit the example variables file:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:

```hcl
project_id = "your-project-id"
region     = "us-central1"
zone       = "us-central1-a"
environment = "dev"
```

### 3. Deploy Infrastructure

```bash
terraform plan
terraform apply
```

## Testing

### Backend Tests

```bash
cd backend
python -m pytest tests/ -v
```

### Frontend Tests

```bash
cd frontend
npm test
```

### End-to-End Tests

```bash
# Install Playwright
npm install -D @playwright/test

# Run E2E tests
npx playwright test
```

## Development Workflow

1. **Start Backend**: `cd backend && uvicorn main:app --reload`
2. **Start Frontend**: `cd frontend && npm run dev`
3. **Access Application**: Open `http://localhost:3000`
4. **API Documentation**: Open `http://localhost:8000/docs`

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Find process using port
   lsof -i :8000
   # Kill process
   kill -9 <PID>
   ```

2. **Google Cloud Authentication Issues**
   ```bash
   gcloud auth application-default login
   gcloud config set project your-project-id
   ```

3. **Firestore Connection Issues**
   - Ensure Firestore is enabled in your Google Cloud project
   - Check service account permissions
   - Verify project ID in environment variables

4. **WebSocket Connection Issues**
   - Check CORS configuration
   - Ensure backend is running on correct port
   - Verify WebSocket URL in frontend configuration

### Getting Help

- Check the [API Documentation](api.md)
- Review the [Architecture Overview](architecture.md)
- Open an issue on GitHub for bugs
- Check the logs in Google Cloud Console

## Next Steps

- [Deployment Guide](deployment.md)
- [API Documentation](api.md)
- [Architecture Overview](architecture.md) 