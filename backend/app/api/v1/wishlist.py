from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Wishlist, WishlistItem, Product

router = APIRouter(tags=["Wishlist"])

def _get_or_create_wishlist(user_id: int, db: Session) -> Wishlist:
    wishlist = db.query(Wishlist).filter(Wishlist.user_id == user_id).first()
    if not wishlist:
        wishlist = Wishlist(user_id=user_id)
        db.add(wishlist)
        db.commit()
        db.refresh(wishlist)
    return wishlist

@router.get("/wishlist")
def get_wishlist(db: Session = Depends(get_db)):
    user_id = 1
    wishlist = _get_or_create_wishlist(user_id, db)
    items = []
    for wi in wishlist.items:
        prod = wi.product
        image_url = prod.images[0].image_url if prod.images else ""
        items.append({
            "id": prod.id,
            "name": prod.name,
            "price": float(prod.base_price),
            "rating": float(prod.rating),
            "review_count": prod.review_count,
            "image_url": image_url,
            "in_stock": bool(prod.inventory and prod.inventory.stock_qty > 0),
            "slug": prod.slug,
        })
    return {"items": items}

@router.post("/wishlist/{product_id}")
def add_to_wishlist(product_id: int, db: Session = Depends(get_db)):
    user_id = 1
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    wishlist = _get_or_create_wishlist(user_id, db)
    existing = db.query(WishlistItem).filter(
        WishlistItem.wishlist_id == wishlist.id,
        WishlistItem.product_id == product_id
    ).first()
    if existing:
        return {"status": "already_exists"}
    wi = WishlistItem(wishlist_id=wishlist.id, product_id=product_id)
    db.add(wi)
    db.commit()
    return {"status": "added"}

@router.delete("/wishlist/{product_id}")
def remove_from_wishlist(product_id: int, db: Session = Depends(get_db)):
    user_id = 1
    wishlist = _get_or_create_wishlist(user_id, db)
    wi = db.query(WishlistItem).filter(
        WishlistItem.wishlist_id == wishlist.id,
        WishlistItem.product_id == product_id
    ).first()
    if not wi:
        raise HTTPException(status_code=404, detail="Item not in wishlist")
    db.delete(wi)
    db.commit()
    return {"status": "removed"}
