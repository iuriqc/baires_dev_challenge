# Real-Time Collaborative Web Application

A real-time collaborative web application featuring a whiteboard for multi-user drawing and a chat system with file sharing capabilities.

## Features

### Whiteboard (Left Panel)
- Real-time drawing synchronization
- Basic tools: pen, colors, clear canvas
- Multiple users drawing simultaneously
- User presence indicators

### Chat (Right Panel)
- Real-time messaging
- File upload support (images, PDFs)
- User presence indicators
- File previews in chat

### File Handling
- Upload to Google Cloud Storage
- Generate secure download URLs
- Support common file types

## Technology Stack

- **Frontend**: Next.js + TypeScript
- **Backend**: Python FastAPI
- **Database**: Google Cloud Firestore
- **Storage**: Google Cloud Storage
- **Deployment**: GCP Cloud Run
- **Infrastructure**: Terraform
- **CI/CD**: GitHub Actions

## Project Structure

```
baires_dev_challenge/
├── frontend/                 # Next.js frontend application
├── backend/                  # FastAPI backend application
├── infrastructure/           # Terraform configuration
├── .github/                  # GitHub Actions workflows
├── docs/                     # Documentation
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- Google Cloud SDK
- Terraform

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd baires_dev_challenge
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Environment Variables**
   - Copy `.env.example` to `.env` in both frontend and backend directories
   - Update with your Google Cloud credentials

## Deployment

### Environments
- **DEV**: Development environment for testing
- **PRD**: Production environment

### Deployment Process
1. Infrastructure deployment via Terraform
2. Backend deployment to Cloud Run
3. Frontend deployment to Cloud Run
4. CI/CD pipeline via GitHub Actions

## Documentation

- [Setup Guide](docs/setup.md)
- [Deployment Guide](docs/deployment.md)
- [API Documentation](docs/api.md)
- [Architecture Overview](docs/architecture.md)

## Live Demo

- **Frontend**: [Frontend URL]
- **Backend**: [Backend URL]
- **API Documentation**: [API Docs URL]

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License 