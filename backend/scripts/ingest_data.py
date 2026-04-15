import os
import sys
import re
import pandas as pd
import numpy as np
import ast
import random
from sqlalchemy.orm import Session
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, Base, engine
from app.models import Category, Product, ProductImage, ProductSpec, Inventory, ProductRecommendation, Base

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

def pick_category(row: pd.Series, primary_cols: list, secondary_cols: list, default: str = "General") -> str:
    for col in primary_cols:
        if col in row and pd.notna(row[col]) and str(row[col]).strip():
            return str(row[col]).strip()
    for col in secondary_cols:
        if col in row and pd.notna(row[col]) and str(row[col]).strip():
            return str(row[col]).strip()
    return default

def get_optional_category(row: pd.Series, cols: list) -> str | None:
    for col in cols:
        if col in row and pd.notna(row[col]) and str(row[col]).strip():
            return str(row[col]).strip()
    return None

def collect_categories(df: pd.DataFrame, primary_cols: list, secondary_cols: list) -> set:
    categories = set()
    for col in primary_cols + secondary_cols:
        if col in df.columns:
            for cat in df[col].dropna().unique():
                if str(cat).strip():
                    categories.add(str(cat).strip())
    return categories

def slugify(value: str) -> str:
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value.strip().lower())
    return value.strip("-")[:100]

def clean_flipkart_image(img_str):
    if not isinstance(img_str, str) or not img_str:
        return []
    try:
        urls = ast.literal_eval(img_str)
        if isinstance(urls, list) and len(urls) > 0:
            return urls
    except:
        return [img.strip(' "[]') for img in img_str.split(',') if img.strip()]
    return []

def clean_flipkart_specs(spec_str):
    if not isinstance(spec_str, str) or not spec_str:
        return []
    try:
        spec_dict = ast.literal_eval(spec_str)
        if isinstance(spec_dict, dict):
            return [{"key": k, "value": str(v)} for k, v in spec_dict.items()]
    except:
        return []
    return []

import math

def parse_rating(val):
    try:
        fval = float(val)
        if math.isnan(fval):
            return random.uniform(3.0, 5.0)
        return fval
    except:
        return random.uniform(3.0, 5.0)

def ingest_data():
    db = SessionLocal()
    print("Clearing old product data...")
    # Clean tables (except Users/Addresses/Orders for safety)
    db.query(ProductRecommendation).delete()
    db.query(Inventory).delete()
    db.query(ProductImage).delete()
    db.query(ProductSpec).delete()
    db.query(Product).delete()
    db.query(Category).delete()
    db.commit()
    
    print("Loading datasets...")
    # We load a subset to keep the TF-IDF matrix computation fast in local environments
    df_products = read_csv_safe('../data/products.csv').dropna(subset=['title', 'price'])
    # Combine some from Flipkart
    df_flipkart = read_csv_safe('../data/flipkart_com-ecommerce_sample.csv').dropna(subset=['title', 'price'])
    # New fake dataset
    df_fake = read_csv_safe('../data/fake.csv').dropna(subset=['title', 'price'])
    
    print(f"Products.csv holds {len(df_products)} rows. Flipkart holds {len(df_flipkart)} rows. Fake.csv holds {len(df_fake)} rows.")
    
    # Take 1000 from products.csv and 1000 from Flipkart for a good demo size (2000 total)
    df_p = df_products.head(1000).copy()
    df_f = df_flipkart.head(1000).copy()
    
    categories_set = set()
    category_id_map = {}
    
    categories_set.update(collect_categories(df_p, ["standard_category"], ["category"]))
    categories_set.update(collect_categories(df_fake, ["standard_category"], ["category__name", "category"]))
    
    categories_set.update(["General", "Shoes", "Luxury Watches", "Electronics", "Premium Handbags", "New Season Fashion"])
    
    for cat in categories_set:
        slug = slugify(cat)
        c = Category(name=cat, slug=slug)
        db.add(c)
    db.commit()
    
    for c in db.query(Category).all():
        category_id_map[c.name] = c.id
        
    print("Inserting products via Pandas...")
    products_for_ml = []
    
    # 1. Insert Products.csv
    for _, row in df_p.iterrows():
        cat_name = pick_category(row, ["standard_category"], ["category"])
        secondary_cat = get_optional_category(row, ["category"])
        cid = category_id_map.get(cat_name, category_id_map['General'])
        slug = str(row['title']).lower().replace(' ', '-').replace('/', '-')[:200]
        
        p = Product(
            category_id=cid,
            name=str(row['title'])[:250],
            slug=f"{slug}-{random.randint(1000,9999)}",
            description=f"Great product from {row['brand']} in category {cat_name}",
            brand=str(row['brand']),
            base_price=float(row['price']),
            rating=parse_rating(row.get('rating')),
            review_count=random.randint(5, 500)
        )
        db.add(p)
        db.flush()
        
        # Image
        if pd.notna(row['image_url']):
            db.add(ProductImage(product_id=p.id, image_url=row['image_url']))
            
        # Inventory
        db.add(Inventory(product_id=p.id, stock_qty=random.randint(10, 100)))
        
        products_for_ml.append({
            'id': p.id,
            'text_content': f"{p.name} {p.brand} {cat_name} {secondary_cat or ''} {p.description}"
        })

    # 2. Insert Flipkart.csv
    for _, row in df_f.iterrows():
        pname = str(row['title']).lower()
        slug = pname.replace(' ', '-').replace('/', '-')[:200]
        price = float(row['price']) if pd.notna(row['price']) else 1000.0
        cat_name = pick_category(row, ["standard_category"], ["category"])
        secondary_cat = get_optional_category(row, ["category"])
        cid = category_id_map.get(cat_name, category_id_map['General'])
        
        p = Product(
            category_id=cid,
            name=str(row['title'])[:250],
            slug=f"{slug}-{random.randint(1000,9999)}",
            description=str(row['description'])[:1000] if pd.notna(row['description']) else "No description",
            brand=str(row['brand']) if pd.notna(row['brand']) else "Generic",
            base_price=price,
            rating=parse_rating(row.get('rating')),
            review_count=random.randint(5, 500)
        )
        db.add(p)
        db.flush()
        
        images = clean_flipkart_image(row['image'])
        for idx, img in enumerate(images[:2]):
            db.add(ProductImage(product_id=p.id, image_url=img, sort_order=idx))
            
        specs = clean_flipkart_specs(row['product_specifications'])
        for spec in specs[:5]:
            db.add(ProductSpec(product_id=p.id, spec_key=spec['key'][:120], spec_value=spec['value'][:500]))
            
        db.add(Inventory(product_id=p.id, stock_qty=random.randint(0, 100)))
        
        products_for_ml.append({
            'id': p.id,
            'text_content': f"{p.name} {p.brand} {cat_name} {secondary_cat or ''} {p.description}"
        })

    # 3. Insert Fake.csv
    for _, row in df_fake.iterrows():
        cat_name = pick_category(row, ["standard_category"], ["category__name", "category"])
        secondary_cat = get_optional_category(row, ["category__name", "category"])
        cid = category_id_map.get(cat_name, category_id_map['General'])
        slug = str(row['title']).lower().replace(' ', '-').replace('/', '-')[:200]
        
        p = Product(
            category_id=cid,
            name=str(row['title'])[:250],
            slug=f"{slug}-{random.randint(1000,9999)}",
            description=str(row['description'])[:1000] if pd.notna(row['description']) else "No description",
            brand="Generic",
            base_price=float(row['price']),
            rating=random.uniform(3.5, 4.9),
            review_count=random.randint(10, 500)
        )
        db.add(p)
        db.flush()
        
        # Images (images__001, images__002, images__003)
        for col in ['images__001', 'images__002', 'images__003']:
            if pd.notna(row.get(col)) and str(row.get(col)).strip():
                db.add(ProductImage(product_id=p.id, image_url=str(row[col]).strip()))
        
        # Inventory
        db.add(Inventory(product_id=p.id, stock_qty=random.randint(10, 100)))
        
        products_for_ml.append({
            'id': p.id,
            'text_content': f"{p.name} {cat_name} {secondary_cat or ''} {p.description}"
        })

    db.commit()
    print(f"Successfully inserted {len(products_for_ml)} products!")
    
    ##############################
    # ML Recommendation Matrix
    ##############################
    print("Computing TF-IDF Recommendation Matrix...")
    df_ml = pd.DataFrame(products_for_ml)
    
    tfidf = TfidfVectorizer(stop_words='english', max_features=5000)
    tfidf_matrix = tfidf.fit_transform(df_ml['text_content'])
    
    # We compute similarity in chunks to avoid blowing out memory even on 2000 rows
    print("Finding Top-10 Similar Products for each item...")
    cosine_sim = linear_kernel(tfidf_matrix, tfidf_matrix)

    recommendations_to_insert = []
    
    for idx, row in df_ml.iterrows():
        pid_source = row['id']
        sim_scores = list(enumerate(cosine_sim[idx]))
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
        # Skip the item itself (index 0) and take top 10
        sim_scores = sim_scores[1:11]
        
        for rank, (sim_idx, score) in enumerate(sim_scores):
            pid_target = int(df_ml.iloc[sim_idx]['id'])
            # We enforce the ranking logic layer standard from our plan via offline calculation
            # Note: 0.5 * similarity + ... (we do the raw prep here, rest in API)
            recommendations_to_insert.append(
                ProductRecommendation(
                    product_id=pid_source,
                    recommended_product_id=pid_target,
                    score=float(score),
                    rank=rank+1,
                    reason="content_similarity"
                )
            )

    print(f"Saving {len(recommendations_to_insert)} recommendations to database...")
    db.bulk_save_objects(recommendations_to_insert)
    db.commit()
    print("Data Ingestion & ML Pipeline Complete!")


if __name__ == "__main__":
    ingest_data()
