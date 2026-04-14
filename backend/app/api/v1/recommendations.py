from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.models import Product, ProductRecommendation, OrderItem, CartItem, Order

router = APIRouter()

def get_popularity_score(product: Product) -> float:
    # Normalize review_count to a 0-1 scale (assuming 1000 reviews is max for now)
    return min(product.review_count / 1000.0, 1.0)

def get_rating_score(product: Product) -> float:
    # Normalize rating to a 0-1 scale
    return float(product.rating) / 5.0

def get_price_proximity(source_price: float, target_price: float) -> float:
    if source_price == 0:
        return 0.0
    # Score 1 if perfectly matching, lower as distance increases
    ratio = min(source_price, target_price) / max(source_price, target_price)
    return float(ratio)

@router.get("/recommendations/{product_id}/similar")
def get_similar_products(product_id: int, db: Session = Depends(get_db)):
    source_product = db.query(Product).filter(Product.id == product_id).first()
    if not source_product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Get top 20 precomputed semantic similarities
    recommendations = db.query(ProductRecommendation).filter(
        ProductRecommendation.product_id == product_id
    ).order_by(ProductRecommendation.rank.asc()).limit(20).all()

    if not recommendations:
        return {"items": []}

    ranked_results = []
    
    for rec in recommendations:
        target = rec.recommended_product
        if not target.is_active:
            continue
            
        similarity_score = float(rec.score)
        rating_score = get_rating_score(target)
        popularity_score = get_popularity_score(target)
        price_prox = get_price_proximity(float(source_product.base_price), float(target.base_price))

        # Advanced Ranking Layer Logic
        final_score = (0.5 * similarity_score) + (0.2 * rating_score) + (0.2 * popularity_score) + (0.1 * price_prox)

        ranked_results.append({
            "product": target,
            "metrics": {
                "similarity": similarity_score,
                "rating": rating_score,
                "popularity": popularity_score,
                "price_prox": price_prox
            },
            "final_score": final_score
        })

    # Sort descending by our engineered final score
    ranked_results.sort(key=lambda x: x['final_score'], reverse=True)

    # Return top 10
    response_items = []
    for r in ranked_results[:10]:
        prod = r['product']
        image_url = prod.images[0].image_url if prod.images else ''
        response_items.append({
            "id": prod.id,
            "name": prod.name,
            "price": float(prod.base_price),
            "rating": float(prod.rating),
            "image_url": image_url,
            "recommendation_score": r['final_score']
        })

    return {"items": response_items}

@router.get("/recommendations/personalized")
def get_personalized(db: Session = Depends(get_db), user_id: int = 1):
    # Strategy: User -> Recommendation Service
    # 1. Fetch user signals
    past_order_items = db.query(OrderItem).join(Order).filter(Order.user_id == user_id).limit(10).all()
    # (Optional: fetch cart / wishlist. For MVP we use past orders as primary signal)
    
    # If UI signals exist, build personalized list
    if past_order_items:
        signal_product_ids = [item.product_id for item in past_order_items]
        
        # Aggregate semantic neighbors
        raw_recs = db.query(ProductRecommendation).filter(
            ProductRecommendation.product_id.in_(signal_product_ids)
        ).all()
        
        # Simple popularity blend for personalized
        # We use a frequency map of recommended items
        freq_map = {}
        for rec in raw_recs:
            if rec.recommended_product_id not in signal_product_ids: # Don't recommend what they already bought
                freq_map[rec.recommended_product_id] = freq_map.get(rec.recommended_product_id, 0) + float(rec.score)
                
        # Sort by grouped semantic score
        sorted_targets = sorted(freq_map.items(), key=lambda x: x[1], reverse=True)[:10]
        
        final_products = []
        for pid, _ in sorted_targets:
            p = db.query(Product).get(pid)
            if p:
                final_products.append(p)
                
        if final_products:
            items = []
            for prod in final_products:
                image_url = prod.images[0].image_url if prod.images else ''
                items.append({
                    "id": prod.id,
                    "name": prod.name,
                    "price": float(prod.base_price),
                    "rating": float(prod.rating),
                    "image_url": image_url,
                    "recommendation_reason": "Based on your purchase history"
                })
            return {"type": "personalized", "items": items}

    # FALLBACK LOGIC
    # Trending & Popular if no signals
    popular = db.query(Product).order_by(desc(Product.review_count), desc(Product.rating)).limit(10).all()
    
    items = []
    for prod in popular:
        image_url = prod.images[0].image_url if prod.images else ''
        items.append({
            "id": prod.id,
            "name": prod.name,
            "price": float(prod.base_price),
            "rating": float(prod.rating),
            "image_url": image_url,
            "recommendation_reason": "Trending now"
        })
    return {"type": "fallback_trending", "items": items}
