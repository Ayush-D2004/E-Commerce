from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.user_context import ensure_default_user
from app.models import Order, OrderItem, Cart, Address, Inventory, Product, Notification
from app.schemas import CheckoutRequest, OrderListResponse, OrderSchema, CancelOrderRequest, ReturnOrderRequest, OrderItemSchema, OrderAddressSchema
import uuid

router = APIRouter()

@router.post("/checkout")
def checkout(req: CheckoutRequest, db: Session = Depends(get_db)):
    user_id = ensure_default_user(db).id
    
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
            raise HTTPException(
                status_code=400,
                detail="External products cannot be checked out yet. Please add local catalog products only."
            )
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

    notification = Notification(
        user_id=user_id,
        type="order_placed",
        title="Order placed",
        body=f"Your order {order.order_number} was placed successfully.",
        order_id=order.id
    )
    db.add(notification)

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
    user_id = ensure_default_user(db).id
    orders = db.query(Order).filter(Order.user_id == user_id).order_by(Order.created_at.desc()).all()
    items = []
    for o in orders:
        address = db.query(Address).filter(Address.id == o.address_id).first()
        order_items = [
            OrderItemSchema(
                product_id=oi.product_id,
                product_name=oi.product_name_snapshot,
                unit_price=float(oi.unit_price_snapshot),
                quantity=oi.quantity,
                line_total=float(oi.line_total)
            )
            for oi in o.items
        ]
        address_schema = None
        if address:
            address_schema = OrderAddressSchema(
                line1=address.line1,
                line2=address.line2,
                city=address.city,
                state=address.state,
                postal_code=address.postal_code,
                country=address.country
            )
        items.append(OrderSchema(
            order_id=o.id,
            order_number=o.order_number,
            status=o.status,
            total_amount=float(o.total_amount),
            created_at=o.created_at,
            items=order_items,
            address=address_schema
        ))
    return OrderListResponse(items=items)

@router.post("/orders/{order_id}/cancel")
def cancel_order(order_id: int, req: CancelOrderRequest, db: Session = Depends(get_db)):
    user_id = ensure_default_user(db).id
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == user_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status != 'placed':
        raise HTTPException(status_code=400, detail="Only placed orders can be cancelled")

    order.status = 'cancelled'

    # Restore inventory for each local product in the order
    for oi in order.items:
        if oi.product_id is not None:  # skip global/external items
            inv = db.query(Inventory).filter(Inventory.product_id == oi.product_id).with_for_update().first()
            if inv:
                inv.stock_qty += oi.quantity

    # Commit status change + inventory restore + notification in ONE transaction
    notification = Notification(
        user_id=user_id,
        type="order_cancelled",
        title="Order cancelled",
        body=f"Your order {order.order_number} was cancelled. Reason: {req.reason}.",
        order_id=order.id
    )
    db.add(notification)
    db.commit()

    return {"status": "success", "message": "Order cancelled successfully"}

@router.post("/orders/{order_id}/return")
def return_or_replace_order(order_id: int, req: ReturnOrderRequest, db: Session = Depends(get_db)):
    user_id = ensure_default_user(db).id
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == user_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    action = (req.action or "").strip().lower()
    if action not in {"return", "replace"}:
        raise HTTPException(status_code=400, detail="Action must be return or replace")

    if order.status in {"cancelled", "return_requested", "replace_requested"}:
        raise HTTPException(status_code=400, detail="Order is not eligible for return or replace")

    order.status = "return_requested" if action == "return" else "replace_requested"

    reason = req.reason
    if req.other_reason:
        reason = f"{reason} ({req.other_reason})"

    # Commit status change + notification in ONE transaction
    notification = Notification(
        user_id=user_id,
        type=f"order_{action}_requested",
        title=f"{action.capitalize()} requested",
        body=f"We received your {action} request for order {order.order_number}. Reason: {reason}.",
        order_id=order.id
    )
    db.add(notification)
    db.commit()

    return {"status": "success", "message": f"{action.capitalize()} requested successfully"}
