import os
os.environ["DATABASE_URL"] = "sqlite:///./test_dealership.db"
os.environ["JWT_SECRET_KEY"] = "test-secret-key"
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine

@pytest.fixture(autouse=True)
def reset_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client

def register_and_login(client, email="user@example.com", password="StrongPass123"):
    client.post("/api/auth/register", json={"name":"Test User", "email":email, "password":password})
    response = client.post("/api/auth/login", json={"email":email, "password":password})
    return response.json()["access_token"]
