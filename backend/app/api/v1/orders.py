from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Order, OrderItem, Cart, Address, Inventory, Product
from app.schemas import CheckoutRequest, OrderListResponse, OrderSchema
import uuid

router = APIRouter()

@router.post("/checkout")
def checkout(req: CheckoutRequest, db: Session = Depends(get_db)):
    user_id = 1
    
    if not req.items or len(req.items) == 0:
        raise HTTPException(status_code=400, detail="Checkout items are missing")

    address = db.query(Address).filter(Address.id == req.address_id, Address.user_id == user_id).first()
    if not address:
        # Auto-create dummy address for MVP if it doesn't exist
        address = Address(user_id=user_id, line1="123 Scaler St", city="Bangalore", state="Karnataka", postal_code="560001")
        db.add(address)
        db.commit()
        db.refresh(address)

    # 1. Process Order Totals & Inventory Checks
    subtotal = 0.0
    valid_items = []
    
    for item in req.items:
        product_id = str(item.product_id)
        if product_id.startswith("ext-"):
            # Global product: skip local inventory, trust frontend price/name
            subtotal += item.price * item.quantity
            valid_items.append({
                "product_id": None, # or store as string if DB permits (currently integer)
                "product_name": f"[Global] {item.name}",
                "unit_price": item.price,
                "quantity": item.quantity,
                "line_total": item.price * item.quantity
            })
        else:
            # Local product: verify in database
            pid = int(product_id)
            inv = db.query(Inventory).filter(Inventory.product_id == pid).with_for_update().first()
            prod = db.query(Product).filter(Product.id == pid).first()
            if not prod:
                 raise HTTPException(status_code=404, detail=f"Product {pid} not found")
            if not inv or inv.stock_qty < item.quantity:
                db.rollback()
                raise HTTPException(status_code=400, detail=f"Insufficient stock for {prod.name}")
            
            inv.stock_qty -= item.quantity
            price = float(prod.base_price)
            subtotal += price * item.quantity
            valid_items.append({
                "product_id": pid,
                "product_name": prod.name,
                "unit_price": price,
                "quantity": item.quantity,
                "line_total": price * item.quantity
            })

    tax = subtotal * 0.18 # 18% tax
    shipping = 50.0 if subtotal < 500 else 0.0
    total = subtotal + tax + shipping

    # 2. Create Order
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

    for vi in valid_items:
        oi = OrderItem(
            order_id=order.id,
            product_id=vi["product_id"],
            product_name_snapshot=vi["product_name"][:255] if vi["product_name"] else "Unknown",
            unit_price_snapshot=vi["unit_price"],
            quantity=vi["quantity"],
            line_total=vi["line_total"]
        )
        db.add(oi)

    # 3. Clear existing local cart for hygiene
    cart = db.query(Cart).filter(Cart.user_id == user_id, Cart.status == 'active').first()
    if cart:
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
