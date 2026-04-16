from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import case, func, or_
import re
from typing import List, Optional
import numpy as np

try:
    from rapidfuzz import fuzz, process
except Exception:
    fuzz = None
    process = None

from app.core.database import get_db
from app.core.search_artifacts import SEARCH_ARTIFACTS
from app.models import Product, Category, ProductImage, ProductSpec, Inventory
from app.schemas import ProductDetailSchema, ProductListResponse, ProductSchemaBase, CategorySchema

router = APIRouter()

def normalize_category_value(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.strip().lower())

def normalize_sql(col):
    normalized = func.lower(col)
    normalized = func.replace(normalized, "&", "")
    normalized = func.replace(normalized, "-", "")
    normalized = func.replace(normalized, "_", "")
    normalized = func.replace(normalized, "/", "")
    normalized = func.replace(normalized, " ", "")
    return normalized


def _best_field_match(term: str):
    if not process or not fuzz:
        return None

    priority_fields = ["sub_category", "category", "brand"]
    for field in priority_fields:
        choices = SEARCH_ARTIFACTS.labels.get(field, [])
        if not choices:
            continue
        matched = process.extractOne(term, choices, scorer=fuzz.WRatio)
        if matched and matched[1] >= 70:
            return {
                "field": field,
                "value": matched[0],
                "score": float(matched[1])
            }
    return None


def _safe_int(value):
    try:
        if value is None:
            return None
        if isinstance(value, int):
            return value
        text = str(value).strip()
        if text.isdigit():
            return int(text)
        return None
    except Exception:
        return None


def _semantic_candidates(term: str, top_k: int = 160):
    artifacts = SEARCH_ARTIFACTS
    if not artifacts.loaded or artifacts.faiss_index is None or artifacts.encoder is None or artifacts.id_map is None:
        return []

    try:
        query_emb = artifacts.encoder.encode([term], normalize_embeddings=True).astype("float32")
        norm = np.linalg.norm(query_emb, axis=1, keepdims=True)
        norm[norm == 0] = 1.0
        query_emb = query_emb / norm
        scores, indices = artifacts.faiss_index.search(query_emb, top_k)
        result = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0:
                continue
            product_id = int(artifacts.id_map[idx])
            result.append((product_id, float(score)))
        return result
    except Exception:
        return []

def apply_category_filter(query, category_value: str):
    normalized = normalize_category_value(category_value)
    return query.outerjoin(Category).filter(
        or_(
            normalize_sql(Category.slug) == normalized,
            normalize_sql(Category.name) == normalized,
            normalize_sql(Product.sub_category) == normalized
        )
    )

@router.get("/categories", response_model=List[CategorySchema])
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(Category).all()
    return categories

@router.get("/products", response_model=ProductListResponse)
def get_products(
    category_id: Optional[int] = None,
    category: Optional[str] = None,
    standard_category: Optional[str] = None,
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
    did_you_mean = None
    applied_correction = False
    correction_confidence = None
    correction_source = None
    priority_id_scores = {}
    
    if category_id:
        query = query.filter(Product.category_id == category_id)
    category_value = standard_category or category
    if category_value:
        query = apply_category_filter(query, category_value)
    if term:
        match = _best_field_match(term)
        effective_term = term
        lexical_ids = []
        if match:
            correction_source = match["field"]
            correction_confidence = round(match["score"], 2)
            if normalize_category_value(match["value"]) != normalize_category_value(term):
                did_you_mean = match["value"]
                applied_correction = True
                effective_term = match["value"]
            postings_map = SEARCH_ARTIFACTS.postings.get(match["field"], {})
            lexical_ids = [pid for pid in (_safe_int(x) for x in postings_map.get(match["value"], [])) if pid is not None]
            for pid in lexical_ids:
                priority_id_scores[pid] = max(priority_id_scores.get(pid, 0.0), 3.0)

        semantic = _semantic_candidates(effective_term, top_k=160)
        for pid, semantic_score in semantic:
            blended = 1.2 + semantic_score
            priority_id_scores[pid] = max(priority_id_scores.get(pid, 0.0), blended)

        if priority_id_scores:
            query = query.filter(Product.id.in_(list(priority_id_scores.keys())))

        if not priority_id_scores:
            normalized_term = normalize_category_value(effective_term)
            query = query.outerjoin(Category).filter(
                or_(
                    Product.name.ilike(f"%{effective_term}%"),
                    Product.description.ilike(f"%{effective_term}%"),
                    Product.brand.ilike(f"%{effective_term}%"),
                    normalize_sql(Category.name).like(f"%{normalized_term}%"),
                    normalize_sql(Category.slug).like(f"%{normalized_term}%"),
                    normalize_sql(Product.sub_category).like(f"%{normalized_term}%")
                )
            )
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
        if term and priority_id_scores:
            ranked_pairs = sorted(priority_id_scores.items(), key=lambda x: x[1], reverse=True)[:800]
            priority_case = case(
                *[(Product.id == pid, score) for pid, score in ranked_pairs],
                else_=0
            )
            query = query.order_by(priority_case.desc(), Product.rating.desc(), Product.review_count.desc())
        elif term:
            normalized_term = normalize_category_value(term)
            priority_score = case(
                (normalize_sql(Product.sub_category).like(f"%{normalized_term}%"), 3),
                (normalize_sql(Category.name).like(f"%{normalized_term}%"), 2),
                (normalize_sql(Category.slug).like(f"%{normalized_term}%"), 2),
                (normalize_sql(Product.brand).like(f"%{normalized_term}%"), 1),
                else_=0
            )
            query = query.order_by(priority_score.desc(), Product.rating.desc(), Product.review_count.desc())
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
            sub_category=p.sub_category,
            image_url=image_url
        ))

    return ProductListResponse(
        items=items,
        page=page,
        page_size=page_size,
        total=total,
        did_you_mean=did_you_mean,
        applied_correction=applied_correction,
        correction_confidence=correction_confidence,
        correction_source=correction_source
    )

@router.get("/products/random", response_model=List[ProductSchemaBase])
def get_random_products(limit: int = 24, db: Session = Depends(get_db)):
    products = (
        db.query(Product)
        .filter(Product.is_active == True)
        .order_by(func.random())
        .limit(limit)
        .all()
    )

    items = []
    for p in products:
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
            sub_category=p.sub_category,
            image_url=image_url
        ))
    return items

@router.get("/products/flash-deals", response_model=List[ProductSchemaBase])
def get_flash_deals(db: Session = Depends(get_db)):
    # Flash deals can just be top rated products on sale. Here we mock it via rating/stock
    deals = (
        db.query(Product)
        .filter(Product.is_active == True)
        .order_by(func.random())
        .limit(10)
        .all()
    )
    
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
            sub_category=p.sub_category,
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
        sub_category=p.sub_category,
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
            sub_category=p.sub_category,
            image_url=image_url
        ))
    return items

