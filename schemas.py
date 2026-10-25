from pydantic import BaseModel, ConfigDict, EmailStr, Field

class RegisterIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8)

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    is_admin: bool

class VehicleIn(BaseModel):
    make: str = Field(min_length=1, max_length=80)
    model: str = Field(min_length=1, max_length=80)
    category: str = Field(min_length=1, max_length=80)
    price: float = Field(gt=0)
    quantity: int = Field(ge=0)

class VehicleOut(VehicleIn):
    id: int
    model_config = ConfigDict(from_attributes=True)

class MessageOut(BaseModel):
    message: str
