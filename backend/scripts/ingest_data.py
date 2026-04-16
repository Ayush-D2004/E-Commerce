import os
import sys
import re
import pandas as pd
import numpy as np
import random
from sqlalchemy.orm import Session

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, Base, engine
from app.models import Category, Product, ProductImage, Inventory, ProductRecommendation, Base

# Set seeds
random.seed(42)

def read_csv_safe(path: str) -> pd.DataFrame:
    # Try common encodings; latin1 is a safe last resort for mixed datasets
    for enc in ("utf-8", "utf-8-sig", "cp1252"):
        try:
            return pd.read_csv(path, encoding=enc)
        except UnicodeDecodeError:
            continue
    return pd.read_csv(path, encoding="latin1")

def collect_categories(df: pd.DataFrame, col: str) -> set:
    categories = set()
    if col in df.columns:
        for cat in df[col].dropna().unique():
            if str(cat).strip():
                categories.add(str(cat).strip())
    return categories

def slugify(value: str) -> str:
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value.strip().lower())
    return value.strip("-")[:100]

def clean_image_url(img_str: str) -> str | None:
    if not isinstance(img_str, str) or not img_str.strip():
        return None
    return img_str.strip()

import math

def parse_rating(val):
    try:
        fval = float(val)
        if math.isnan(fval):
            return random.uniform(3.0, 5.0)
        return fval
    except:
        return random.uniform(3.0, 5.0)

def normalize_text(val, default: str | None = None) -> str | None:
    if pd.isna(val):
        return default
    if isinstance(val, list):
        if len(val) == 0:
            return default
        return str(val[0]).strip() or default
    text = str(val).strip()
    if text in {"", "nan", "None", "[]"}:
        return default
    return text

def ingest_data():
    db = SessionLocal()
    print("Clearing old product data...")
    # Clean tables (except Users/Addresses/Orders for safety)
    db.query(ProductRecommendation).delete()
    db.query(Inventory).delete()
    db.query(ProductImage).delete()
    db.query(Product).delete()
    db.query(Category).delete()
    db.commit()
    
    print("Loading dataset...")
    df_products = read_csv_safe('../data/ecommerce_dataset.csv').dropna(subset=['title', 'price'])
    print(f"ecommerce_dataset.csv holds {len(df_products)} rows.")

    df_p = df_products.copy()
    categories_set = set()
    category_id_map = {}

    categories_set.update(collect_categories(df_p, "category"))
    categories_set.update(["General"])
    
    for cat in categories_set:
        slug = slugify(cat)
        c = Category(name=cat, slug=slug)
        db.add(c)
    db.commit()
    
    for c in db.query(Category).all():
        category_id_map[c.name] = c.id
        
    print("Inserting products via Pandas...")
    
    # Insert Products.csv with clean schema
    for idx, row in df_p.iterrows():
        cat_name = normalize_text(row.get('category'), 'General') or 'General'
        sub_category = normalize_text(row.get('sub_category'))
        cid = category_id_map.get(cat_name, category_id_map['General'])
        slug_base = str(row['title']).lower().replace(' ', '-').replace('/', '-')[:200]
        product_id_raw = normalize_text(row.get('product_id'))
        slug_suffix = product_id_raw or f"{idx}-{random.randint(1000,9999)}"
        slug = f"{slug_base}-{slug_suffix}"[:280]
        brand = normalize_text(row.get('brand'), 'Generic') or 'Generic'
        description = normalize_text(row.get('description'), 'No description') or 'No description'
        rating = parse_rating(row.get('rating'))

        p = Product(
            category_id=cid,
            name=str(row['title'])[:250],
            slug=f"{slug}-{random.randint(1000,9999)}",
            description=description[:1000],
            brand=brand[:120],
            sub_category=sub_category[:140] if sub_category else None,
            base_price=float(row['price']),
            rating=rating,
            review_count=random.randint(5, 500)
        )
        db.add(p)
        db.flush()

        image_url = clean_image_url(normalize_text(row.get('image_url')))
        if image_url:
            db.add(ProductImage(product_id=p.id, image_url=image_url))

        db.add(Inventory(product_id=p.id, stock_qty=random.randint(10, 100)))

    db.commit()
    print(f"Successfully inserted {len(df_p)} products!")
    print("Data ingestion complete.")


if __name__ == "__main__":
    ingest_data()
