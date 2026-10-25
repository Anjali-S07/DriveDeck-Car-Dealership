from .conftest import register_and_login

def test_register_and_login(client):
    response = client.post("/api/auth/register", json={"name":"Asha", "email":"asha@example.com", "password":"StrongPass123"})
    assert response.status_code == 201
    login = client.post("/api/auth/login", json={"email":"asha@example.com", "password":"StrongPass123"})
    assert login.status_code == 200
    assert login.json()["token_type"] == "bearer"

def test_duplicate_registration_is_rejected(client):
    payload = {"name":"Asha", "email":"asha@example.com", "password":"StrongPass123"}
    assert client.post("/api/auth/register", json=payload).status_code == 201
    assert client.post("/api/auth/register", json=payload).status_code == 409

def test_vehicle_api_requires_login(client):
    assert client.get("/api/vehicles").status_code == 401
