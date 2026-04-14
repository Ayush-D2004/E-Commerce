from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.models import User, Address

router = APIRouter(tags=["Users"])

class AddressSchema(BaseModel):
    id: int
    line1: str
    line2: Optional[str] = None
    city: str
    state: str
    postal_code: str

    class Config:
        from_attributes = True

class AddressCreate(BaseModel):
    line1: str
    line2: Optional[str] = None
    city: str
    state: str
    postal_code: str

class UserProfile(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    addresses: List[AddressSchema]

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: str
    email: str
    phone: str

@router.get("/users/me", response_model=UserProfile)
def get_user_profile(db: Session = Depends(get_db)):
    # Mocking authenticated user logic
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No users in database")
    return user

@router.put("/users/me", response_model=UserProfile)
def update_user_profile(updates: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No users in database")
    
    # Check if phone belongs to another user
    if updates.phone != user.phone:
        existing = db.query(User).filter(User.phone == updates.phone).first()
        if existing:
            raise HTTPException(status_code=400, detail="Phone number already registered")
            
    user.name = updates.name
    user.email = updates.email
    user.phone = updates.phone
    db.commit()
    db.refresh(user)
    return user

@router.post("/users/me/addresses", response_model=AddressSchema)
def add_user_address(addr: AddressCreate, db: Session = Depends(get_db)):
    user = db.query(User).first()
    new_addr = Address(
        user_id=user.id,
        line1=addr.line1,
        line2=addr.line2,
        city=addr.city,
        state=addr.state,
        postal_code=addr.postal_code
    )
    db.add(new_addr)
    db.commit()
    db.refresh(new_addr)
    return new_addr
