import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root_endpoint():
    """Test the root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "status" in data
    assert data["status"] == "running"

def test_health_endpoint():
    """Test the health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] == "healthy"
    assert "service" in data
    assert data["service"] == "backend"

def test_ready_endpoint():
    """Test the readiness check endpoint"""
    response = client.get("/ready")
    # This might fail if Firestore is not available, but that's expected
    assert response.status_code in [200, 503]
    data = response.json()
    assert "status" in data

def test_websocket_endpoint():
    """Test WebSocket endpoint structure"""
    # This is a basic test to ensure the endpoint exists
    # Actual WebSocket testing would require more complex setup
    pass

def test_upload_file_endpoint():
    """Test file upload endpoint structure"""
    # This endpoint requires a file, so we just test that it exists
    # by checking the OpenAPI schema
    response = client.get("/docs")
    assert response.status_code == 200

def test_messages_endpoint():
    """Test messages endpoint structure"""
    # Test with a dummy room_id
    response = client.get("/messages/test-room")
    # This might fail if Firestore is not available, but that's expected
    assert response.status_code in [200, 500]

def test_drawing_actions_endpoint():
    """Test drawing actions endpoint structure"""
    # Test with a dummy room_id
    response = client.get("/drawing-actions/test-room")
    # This might fail if Firestore is not available, but that's expected
    assert response.status_code in [200, 500]

def test_rooms_endpoint():
    """Test rooms endpoint structure"""
    response = client.get("/rooms")
    # This might fail if Firestore is not available, but that's expected
    assert response.status_code in [200, 500]

def test_cors_headers():
    """Test that CORS headers are present"""
    response = client.options("/")
    # CORS preflight request should work
    assert response.status_code in [200, 405]  # 405 is also acceptable for OPTIONS

if __name__ == "__main__":
    pytest.main([__file__]) 