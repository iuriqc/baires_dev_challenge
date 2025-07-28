import os
import uuid
import mimetypes
from typing import Optional
from datetime import datetime, timedelta
from fastapi import UploadFile
from google.cloud import storage
from google.cloud.storage.blob import Blob
from dotenv import load_dotenv

load_dotenv()

class StorageService:
    def __init__(self):
        # Initialize Google Cloud Storage client
        # In production, this will use service account credentials
        # For local development, you can use gcloud auth application-default login
        self.client = storage.Client()
        self.bucket_name = os.getenv('GCS_BUCKET_NAME', 'collaborative-app-files')
        self.bucket = self.client.bucket(self.bucket_name)
        
        # Ensure bucket exists
        if not self.bucket.exists():
            self.bucket = self.client.create_bucket(self.bucket_name)
    
    async def upload_file(self, file: UploadFile, room_id: Optional[str] = None) -> str:
        """Upload a file to Google Cloud Storage and return the public URL"""
        try:
            # Generate unique filename
            file_extension = os.path.splitext(file.filename)[1] if file.filename else ''
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            
            # Create blob path with room organization
            if room_id:
                blob_path = f"rooms/{room_id}/files/{unique_filename}"
            else:
                blob_path = f"files/{unique_filename}"
            
            # Create blob
            blob = self.bucket.blob(blob_path)
            
            # Set content type
            content_type = file.content_type or mimetypes.guess_type(file.filename)[0]
            if content_type:
                blob.content_type = content_type
            
            # Upload file
            content = await file.read()
            blob.upload_from_string(content)
            
            # Make blob publicly readable
            blob.make_public()
            
            return blob.public_url
            
        except Exception as e:
            print(f"Error uploading file: {e}")
            raise
    
    async def generate_signed_url(self, file_path: str, expiration_minutes: int = 60) -> str:
        """Generate a signed URL for private file access"""
        try:
            blob = self.bucket.blob(file_path)
            
            # Generate signed URL
            expiration = datetime.utcnow() + timedelta(minutes=expiration_minutes)
            signed_url = blob.generate_signed_url(
                version="v4",
                expiration=expiration,
                method="GET"
            )
            
            return signed_url
            
        except Exception as e:
            print(f"Error generating signed URL: {e}")
            raise
    
    async def delete_file(self, file_path: str) -> bool:
        """Delete a file from Google Cloud Storage"""
        try:
            blob = self.bucket.blob(file_path)
            blob.delete()
            return True
        except Exception as e:
            print(f"Error deleting file: {e}")
            return False
    
    async def get_file_info(self, file_path: str) -> Optional[dict]:
        """Get file information"""
        try:
            blob = self.bucket.blob(file_path)
            if blob.exists():
                blob.reload()
                return {
                    'name': blob.name,
                    'size': blob.size,
                    'content_type': blob.content_type,
                    'created': blob.time_created,
                    'updated': blob.updated,
                    'public_url': blob.public_url
                }
            return None
        except Exception as e:
            print(f"Error getting file info: {e}")
            return None
    
    def is_allowed_file_type(self, filename: str) -> bool:
        """Check if file type is allowed"""
        allowed_extensions = {
            '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp',  # Images
            '.pdf',  # Documents
            '.txt', '.md',  # Text files
            '.doc', '.docx',  # Word documents
            '.xls', '.xlsx',  # Excel files
            '.ppt', '.pptx',  # PowerPoint files
        }
        
        file_extension = os.path.splitext(filename.lower())[1]
        return file_extension in allowed_extensions
    
    def get_file_size_limit(self) -> int:
        """Get maximum file size in bytes (10MB default)"""
        return 10 * 1024 * 1024  # 10MB 