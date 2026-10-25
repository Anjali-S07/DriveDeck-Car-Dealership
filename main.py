from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import or_
from sqlalchemy.orm import Session
from .database import Base, engine, get_db
from .models import User, Vehicle
from .schemas import LoginIn, MessageOut, RegisterIn, TokenOut, VehicleIn, VehicleOut
from .security import create_access_token, decode_subject, hash_password, verify_password
from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(bind=engine)
app = FastAPI(title="Car Dealership Inventory API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
bearer = HTTPBearer(auto_error=False)

@app.get("/api/health")
def health():
    return {"status": "ok"}

def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    subject = decode_subject(credentials.credentials)
    if not subject:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.query(User).filter(User.email == subject).first()
    if not user:
        raise HTTPException(status_code=401, detail="User no longer exists")
    return user

def admin_user(user: User = Depends(current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Administrator access required")
    return user

@app.post("/api/auth/register", response_model=MessageOut, status_code=201)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    email = payload.email.lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="Email is already registered")
    db.add(User(name=payload.name.strip(), email=email, password_hash=hash_password(payload.password)))
    db.commit()
    return {"message": "Registration successful. You can now log in."}

@app.post("/api/auth/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    return {"access_token": create_access_token(user.email), "is_admin": user.is_admin}

@app.get("/api/vehicles", response_model=list[VehicleOut])
def list_vehicles(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return db.query(Vehicle).order_by(Vehicle.id.desc()).all()

@app.get("/api/vehicles/search", response_model=list[VehicleOut])
def search_vehicles(make: str | None = None, model: str | None = None, category: str | None = None,
                   min_price: float | None = Query(default=None, ge=0), max_price: float | None = Query(default=None, ge=0),
                   user: User = Depends(current_user), db: Session = Depends(get_db)):
    query = db.query(Vehicle)
    if make: query = query.filter(Vehicle.make.ilike(f"%{make}%"))
    if model: query = query.filter(Vehicle.model.ilike(f"%{model}%"))
    if category: query = query.filter(Vehicle.category.ilike(f"%{category}%"))
    if min_price is not None: query = query.filter(Vehicle.price >= min_price)
    if max_price is not None: query = query.filter(Vehicle.price <= max_price)
    return query.order_by(Vehicle.id.desc()).all()

@app.post("/api/vehicles", response_model=VehicleOut, status_code=201)
def add_vehicle(payload: VehicleIn, admin: User = Depends(admin_user), db: Session = Depends(get_db)):
    vehicle = Vehicle(**payload.model_dump())
    db.add(vehicle); db.commit(); db.refresh(vehicle)
    return vehicle

@app.put("/api/vehicles/{vehicle_id}", response_model=VehicleOut)
def update_vehicle(vehicle_id: int, payload: VehicleIn, admin: User = Depends(admin_user), db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle: raise HTTPException(status_code=404, detail="Vehicle not found")
    for key, value in payload.model_dump().items(): setattr(vehicle, key, value)
    db.commit(); db.refresh(vehicle)
    return vehicle

@app.delete("/api/vehicles/{vehicle_id}", response_model=MessageOut)
def delete_vehicle(vehicle_id: int, admin: User = Depends(admin_user), db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle: raise HTTPException(status_code=404, detail="Vehicle not found")
    db.delete(vehicle); db.commit()
    return {"message": "Vehicle deleted"}

@app.post("/api/vehicles/{vehicle_id}/purchase", response_model=VehicleOut)
def purchase_vehicle(vehicle_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).with_for_update().first()
    if not vehicle: raise HTTPException(status_code=404, detail="Vehicle not found")
    if vehicle.quantity < 1: raise HTTPException(status_code=409, detail="Vehicle is out of stock")
    vehicle.quantity -= 1; db.commit(); db.refresh(vehicle)
    return vehicle

@app.post("/api/vehicles/{vehicle_id}/restock", response_model=VehicleOut)
def restock_vehicle(vehicle_id: int, amount: int = Query(gt=0), admin: User = Depends(admin_user), db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle: raise HTTPException(status_code=404, detail="Vehicle not found")
    vehicle.quantity += amount; db.commit(); db.refresh(vehicle)
    return vehicle
