from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models import Product, Category, ProductImage, ProductSpec, Inventory
from app.schemas import ProductDetailSchema, ProductListResponse, ProductSchemaBase, CategorySchema

router = APIRouter()

@router.get("/categories", response_model=List[CategorySchema])
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(Category).all()
    return categories

@router.get("/products", response_model=ProductListResponse)
def get_products(
    category_id: Optional[int] = None,
    category: Optional[str] = None,
    term: Optional[str] = None,
    brand: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db)
):
    query = db.query(Product).filter(Product.is_active == True)
    
    if category_id:
        query = query.filter(Product.category_id == category_id)
    if category:
        query = query.join(Category).filter(Category.slug == category)
    if term:
        query = query.filter(Product.name.ilike(f"%{term}%") | Product.description.ilike(f"%{term}%") | Product.brand.ilike(f"%{term}%"))
    if brand:
        query = query.filter(Product.brand.ilike(f"%{brand}%"))
    if min_price is not None:
        query = query.filter(Product.base_price >= min_price)
    if max_price is not None:
        query = query.filter(Product.base_price <= max_price)
        
    if sort == "price_asc":
        query = query.order_by(Product.base_price.asc())
    elif sort == "price_desc":
        query = query.order_by(Product.base_price.desc())
    elif sort == "rating":
        query = query.order_by(Product.rating.desc())
    elif sort == "newest":
        query = query.order_by(Product.created_at.desc())
    else:
        query = query.order_by(Product.rating.desc(), Product.review_count.desc())

    total = query.count()
    products = query.offset((page - 1) * page_size).limit(page_size).all()
    
    items = []
    for p in products:
        # Prepopulate stock status for listing
        in_stock = p.inventory.stock_qty > 0 if p.inventory else False
        image_url = p.images[0].image_url if p.images else None
        items.append(ProductSchemaBase(
            id=p.id,
            name=p.name,
            slug=p.slug,
            price=float(p.base_price),
            rating=float(p.rating),
            review_count=p.review_count,
            in_stock=in_stock,
            image_url=image_url
        ))

    return ProductListResponse(
        items=items,
        page=page,
        page_size=page_size,
        total=total
    )

@router.get("/products/flash-deals", response_model=List[ProductSchemaBase])
def get_flash_deals(db: Session = Depends(get_db)):
    # Flash deals can just be top rated products on sale. Here we mock it via rating/stock
    deals = db.query(Product).filter(Product.is_active == True).order_by(Product.review_count.desc()).limit(10).all()
    
    items = []
    for p in deals:
        in_stock = p.inventory.stock_qty > 0 if p.inventory else False
        image_url = p.images[0].image_url if p.images else None
        items.append(ProductSchemaBase(
            id=p.id,
            name=p.name,
            slug=p.slug,
            price=float(p.base_price),
            rating=float(p.rating),
            review_count=p.review_count,
            in_stock=in_stock,
            image_url=image_url
        ))
    return items

@router.get("/products/{product_id}", response_model=ProductDetailSchema)
def get_product(product_id: int, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id, Product.is_active == True).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")

    in_stock = p.inventory.stock_qty > 0 if p.inventory else False
    stock_qty = p.inventory.stock_qty if p.inventory else 0

    return ProductDetailSchema(
        id=p.id,
        name=p.name,
        slug=p.slug,
        price=float(p.base_price),
        rating=float(p.rating),
        review_count=p.review_count,
        in_stock=in_stock,
        description=p.description,
        brand=p.brand,
        stock_qty=stock_qty,
        images=[{"url": img.image_url, "alt_text": img.alt_text} for img in p.images],
        specs=[{"key": spec.spec_key, "value": spec.spec_value} for spec in p.specs],
        category={"id": p.category.id, "name": p.category.name, "slug": p.category.slug}
    )

@router.get("/products/{product_id}/recommendations", response_model=List[ProductSchemaBase])
def get_product_recommendations(product_id: int, db: Session = Depends(get_db)):
    from app.models import ProductRecommendation
    recs = db.query(ProductRecommendation).filter(ProductRecommendation.product_id == product_id).order_by(ProductRecommendation.rank).limit(10).all()
    
    # Fallback to general recommendations if product has none
    if not recs:
        deals = db.query(Product).filter(Product.id != product_id, Product.is_active == True).order_by(Product.rating.desc(), Product.review_count.desc()).limit(10).all()
        recs_products = deals
    else:
        recs_products = [r.recommended_product for r in recs if r.recommended_product]

    items = []
    for p in recs_products:
        in_stock = p.inventory.stock_qty > 0 if p.inventory else False
        image_url = p.images[0].image_url if p.images else None
        items.append(ProductSchemaBase(
            id=p.id,
            name=p.name,
            slug=p.slug,
            price=float(p.base_price),
            rating=float(p.rating),
            review_count=p.review_count,
            in_stock=in_stock,
            image_url=image_url
        ))
    return items

