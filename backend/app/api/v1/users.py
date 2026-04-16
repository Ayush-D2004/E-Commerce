from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.core.user_context import ensure_default_user
from app.models import User, Address, Order

router = APIRouter(tags=["Users"])

class AddressSchema(BaseModel):
    id: int
    line1: str
    line2: Optional[str] = None
    city: str
    state: str
    postal_code: str
    country: str
    is_default: bool

    class Config:
        from_attributes = True

class AddressCreate(BaseModel):
    line1: str
    line2: Optional[str] = None
    city: str
    state: str
    postal_code: str
    country: str = "India"
    is_default: bool = False

class AddressUpdate(BaseModel):
    line1: Optional[str] = None
    line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    is_default: Optional[bool] = None

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
    user = ensure_default_user(db)
    return user

@router.put("/users/me", response_model=UserProfile)
def update_user_profile(updates: UserUpdate, db: Session = Depends(get_db)):
    user = ensure_default_user(db)
    
    # Check if phone belongs to another user
    if updates.phone != user.phone:
        existing = db.query(User).filter(User.phone == updates.phone, User.id != user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Phone number already registered")

    if updates.email != user.email:
        existing_email = db.query(User).filter(User.email == updates.email, User.id != user.id).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already registered")
            
    user.name = updates.name
    user.email = updates.email
    user.phone = updates.phone
    db.commit()
    db.refresh(user)
    return user

@router.post("/users/me/addresses", response_model=AddressSchema)
def add_user_address(addr: AddressCreate, db: Session = Depends(get_db)):
    user = ensure_default_user(db)
    new_addr = Address(
        user_id=user.id,
        line1=addr.line1,
        line2=addr.line2,
        city=addr.city,
        state=addr.state,
        postal_code=addr.postal_code,
        country=addr.country,
        is_default=addr.is_default
    )
    if addr.is_default:
        db.query(Address).filter(Address.user_id == user.id).update({"is_default": False})
    db.add(new_addr)
    db.commit()
    db.refresh(new_addr)
    return new_addr

@router.get("/users/me/addresses", response_model=List[AddressSchema])
def list_user_addresses(db: Session = Depends(get_db)):
    user = ensure_default_user(db)
    return db.query(Address).filter(Address.user_id == user.id).order_by(Address.created_at.desc()).all()

@router.put("/users/me/addresses/{addr_id}", response_model=AddressSchema)
def update_user_address(addr_id: int, updates: AddressUpdate, db: Session = Depends(get_db)):
    user = ensure_default_user(db)
    address = db.query(Address).filter(Address.id == addr_id, Address.user_id == user.id).first()
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    if updates.is_default:
        db.query(Address).filter(Address.user_id == user.id).update({"is_default": False})

    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(address, field, value)
    db.commit()
    db.refresh(address)
    return address

@router.delete("/users/me/addresses/{addr_id}")
def delete_user_address(addr_id: int, db: Session = Depends(get_db)):
    user = ensure_default_user(db)
    address = db.query(Address).filter(Address.id == addr_id, Address.user_id == user.id).first()
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    has_order_reference = db.query(Order.id).filter(
        Order.user_id == user.id,
        Order.address_id == addr_id
    ).first()
    if has_order_reference:
        raise HTTPException(
            status_code=400,
            detail="This address is linked to past orders and cannot be deleted. You can edit it or set another default address."
        )

    db.delete(address)
    db.commit()
    return {"status": "success"}
