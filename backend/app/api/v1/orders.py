from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Order, OrderItem, Cart, Address, Inventory
from app.schemas import CheckoutRequest, OrderListResponse, OrderSchema
import uuid

router = APIRouter()

@router.post("/checkout")
def checkout(req: CheckoutRequest, db: Session = Depends(get_db)):
    # Assuming user_id = 1 for MVP
    user_id = 1
    cart = db.query(Cart).filter(Cart.user_id == user_id, Cart.status == 'active').first()
    
    if not cart or not cart.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    address = db.query(Address).filter(Address.id == req.address_id, Address.user_id == user_id).first()
    if not address:
        # Auto-create dummy address for MVP if it doesn't exist
        address = Address(user_id=user_id, line1="123 Scaler St", city="Bangalore", state="Karnataka", postal_code="560001")
        db.add(address)
        db.commit()
        db.refresh(address)

    # 1. Process Order Totals
    subtotal = sum(i.quantity * i.unit_price_snapshot for i in cart.items)
    tax = subtotal * 0.18 # 18% tax
    shipping = 50.0 if subtotal < 500 else 0.0
    total = subtotal + tax + shipping

    # 2. Update Inventory (Transactional check for single-DB MVP)
    for i in cart.items:
        inv = db.query(Inventory).filter(Inventory.product_id == i.product_id).with_for_update().first()
        if not inv or inv.stock_qty < i.quantity:
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {i.product.name}")
        inv.stock_qty -= i.quantity

    # 3. Create Order
    order_num = f"ORD-{uuid.uuid4().hex[:8].upper()}"
    order = Order(
        order_number=order_num,
        user_id=user_id,
        address_id=address.id,
        subtotal=subtotal,
        tax_amount=tax,
        shipping_amount=shipping,
        total_amount=total,
        status='placed'
    )
    db.add(order)
    db.flush()

    for i in cart.items:
        oi = OrderItem(
            order_id=order.id,
            product_id=i.product_id,
            product_name_snapshot=i.product.name,
            unit_price_snapshot=i.unit_price_snapshot,
            quantity=i.quantity,
            line_total=i.quantity * i.unit_price_snapshot
        )
        db.add(oi)

    # 4. Mock Payment (Skipped directly to order success)

    # 5. Clear Cart
    cart.status = 'converted'
    db.commit()

    return {
        "order_id": order.id,
        "order_number": order.order_number,
        "status": order.status,
        "total_amount": float(order.total_amount)
    }

@router.get("/orders", response_model=OrderListResponse)
def get_orders(db: Session = Depends(get_db)):
    user_id = 1
    orders = db.query(Order).filter(Order.user_id == user_id).order_by(Order.created_at.desc()).all()
    items = []
    for o in orders:
        items.append(OrderSchema(
            order_id=o.id,
            order_number=o.order_number,
            status=o.status,
            total_amount=float(o.total_amount),
            created_at=o.created_at
        ))
    return OrderListResponse(items=items)
