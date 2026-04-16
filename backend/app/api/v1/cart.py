from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.user_context import ensure_default_user
from app.models import Cart, CartItem, Product, User
from app.schemas import CartResponse, CartItemAddRequest, CartItemSchema

router = APIRouter()

def get_or_create_cart(db: Session, user_id: int | None = None):
    if user_id is None:
        user_id = ensure_default_user(db).id
    cart = db.query(Cart).filter(Cart.user_id == user_id, Cart.status == 'active').first()
    if not cart:
        user = db.query(User).filter(User.id == user_id).first() or ensure_default_user(db)
        user_id = user.id
        cart = Cart(user_id=user_id, status='active')
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart

@router.get("/cart", response_model=CartResponse)
def get_cart(db: Session = Depends(get_db)):
    cart = get_or_create_cart(db)
    items = []
    subtotal = 0.0
    item_count = 0
    for i in cart.items:
        in_stock = i.product.inventory.stock_qty > 0 if i.product.inventory else False
        img_url = i.product.images[0].image_url if i.product.images else ''
        line_total = float(i.quantity * i.unit_price_snapshot)
        subtotal += line_total
        item_count += i.quantity
        items.append(CartItemSchema(
            id=i.id,
            product_id=i.product_id,
            name=i.product.name,
            image_url=img_url,
            quantity=i.quantity,
            unit_price=float(i.unit_price_snapshot),
            line_total=line_total,
            in_stock=in_stock
        ))
    
    return CartResponse(cart_id=cart.id, items=items, subtotal=subtotal, item_count=item_count)

@router.post("/cart/items")
def add_to_cart(req: CartItemAddRequest, db: Session = Depends(get_db)):
    cart = get_or_create_cart(db)
    product = db.query(Product).filter(Product.id == req.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    existing_item = db.query(CartItem).filter(CartItem.cart_id == cart.id, CartItem.product_id == req.product_id).first()
    if existing_item:
        existing_item.quantity += req.quantity
    else:
        new_item = CartItem(
            cart_id=cart.id,
            product_id=product.id,
            quantity=req.quantity,
            unit_price_snapshot=product.base_price
        )
        db.add(new_item)
    db.commit()
    return {"message": "Item added to cart"}

@router.delete("/cart/items/{item_id}")
def remove_from_cart(item_id: int, db: Session = Depends(get_db)):
    cart = get_or_create_cart(db)
    item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.cart_id == cart.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return {"message": "Cart item removed"}
