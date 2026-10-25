from .conftest import register_and_login
from app.database import SessionLocal
from app.models import User
from app.security import hash_password

def auth(token): return {"Authorization": f"Bearer {token}"}

def admin_token():
    db = SessionLocal()
    user = User(name="Admin", email="admin@example.com", password_hash=hash_password("AdminPass123"), is_admin=True)
    db.add(user); db.commit(); db.close()
    return "admin@example.com"

def test_admin_can_add_and_list_vehicle(client):
    client.post("/api/auth/register", json={"name":"Admin", "email":"admin@example.com", "password":"AdminPass123"})
    db = SessionLocal(); user = db.query(User).filter_by(email="admin@example.com").first(); user.is_admin = True; db.commit(); db.close()
    token = client.post("/api/auth/login", json={"email":"admin@example.com", "password":"AdminPass123"}).json()["access_token"]
    payload = {"make":"Toyota", "model":"Corolla", "category":"Sedan", "price":18000, "quantity":3}
    created = client.post("/api/vehicles", json=payload, headers=auth(token))
    assert created.status_code == 201
    assert client.get("/api/vehicles", headers=auth(token)).json()[0]["make"] == "Toyota"

def test_purchase_decreases_quantity(client):
    client.post("/api/auth/register", json={"name":"Admin", "email":"admin@example.com", "password":"AdminPass123"})
    db = SessionLocal(); user = db.query(User).filter_by(email="admin@example.com").first(); user.is_admin = True; db.commit(); db.close()
    token = client.post("/api/auth/login", json={"email":"admin@example.com", "password":"AdminPass123"}).json()["access_token"]
    headers = auth(token)
    v = client.post("/api/vehicles", json={"make":"Honda", "model":"City", "category":"Sedan", "price":12000, "quantity":1}, headers=headers).json()
    bought = client.post(f"/api/vehicles/{v['id']}/purchase", headers=headers)
    assert bought.status_code == 200 and bought.json()["quantity"] == 0
    sold_out = client.post(f"/api/vehicles/{v['id']}/purchase", headers=headers)
    assert sold_out.status_code == 409

def test_non_admin_cannot_add_vehicle(client):
    token = register_and_login(client)
    payload = {"make":"Honda", "model":"City", "category":"Sedan", "price":12000, "quantity":1}
    assert client.post("/api/vehicles", json=payload, headers=auth(token)).status_code == 403
