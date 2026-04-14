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
    term: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db)
):
    query = db.query(Product).filter(Product.is_active == True)
    
    if category_id:
        query = query.filter(Product.category_id == category_id)
    if term:
        query = query.filter(Product.name.ilike(f"%{term}%") | Product.description.ilike(f"%{term}%"))

    total = query.count()
    products = query.offset((page - 1) * page_size).limit(page_size).all()
    
    items = []
    for p in products:
        # Prepopulate stock status for listing
        in_stock = p.inventory.stock_qty > 0 if p.inventory else False
        items.append(ProductSchemaBase(
            id=p.id,
            name=p.name,
            slug=p.slug,
            price=float(p.base_price),
            rating=float(p.rating),
            review_count=p.review_count,
            in_stock=in_stock
        ))

    return ProductListResponse(
        items=items,
        page=page,
        page_size=page_size,
        total=total
    )

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
