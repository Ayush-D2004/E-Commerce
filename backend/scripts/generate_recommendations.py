import os
import sys
import json
import argparse
import numpy as np
import faiss
from sqlalchemy.orm import Session
from sqlalchemy import text

# Add parent dir to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, engine
from app.models import ProductRecommendation, Product

def generate_recommendations(args):
    artifacts_dir = args.artifacts_dir
    index_path = os.path.join(artifacts_dir, "semantic_faiss.index")
    id_map_path = os.path.join(artifacts_dir, "semantic_id_map.npy")

    if not os.path.exists(index_path) or not os.path.exists(id_map_path):
        print(f"Error: Required artifacts not found in {artifacts_dir}")
        return

    print("Loading search artifacts...")
    index = faiss.read_index(index_path)
    id_map = np.load(id_map_path)
    num_products = index.ntotal

    print(f"Index contains {num_products} products.")
    
    # We want top K similar (usually top 10-20)
    # k=21 because the first result is usually the product itself
    k = args.top_k + 1 
    batch_size = args.batch_size
    
    db: Session = SessionLocal()
    
    try:
        print("Clearing existing recommendations...")
        db.execute(text("DELETE FROM product_recommendations"))
        db.commit()

        print("Validating products in database...")
        valid_pids = {r[0] for r in db.query(Product.id).all()}
        print(f"Verified {len(valid_pids)} valid products in database.")

        print(f"Generating recommendations in batches of {batch_size}...")
        
        # Optimization: Process in batches to handle 33k+ rows efficiently
        for start_idx in range(0, num_products, batch_size):
            end_idx = min(start_idx + batch_size, num_products)
            
            # Reconstruct vectors for this batch from the IndexFlat index
            # This avoids needing the original embedding file
            batch_vectors = np.vstack([index.reconstruct(i) for i in range(start_idx, end_idx)])
            
            # Search against the full index
            distances, indices = index.search(batch_vectors, k)
            
            recommendations_to_add = []
            
            for i in range(len(batch_vectors)):
                current_product_idx = start_idx + i
                pid = int(id_map[current_product_idx])
                
                # neighbor_indices[0] is usually the product itself if it's an exact search
                rank = 1
                for dist, neighbor_idx in zip(distances[i], indices[i]):
                    if neighbor_idx == -1:
                        continue
                        
                    neighbor_pid = int(id_map[neighbor_idx])
                    
                    # Skip self or missing products
                    if neighbor_pid == pid or neighbor_pid not in valid_pids or pid not in valid_pids:
                        continue
                        
                    recommendations_to_add.append({
                        "product_id": pid,
                        "recommended_product_id": neighbor_pid,
                        "score": float(dist),
                        "rank": rank,
                        "reason": "similar"
                    })
                    
                    rank += 1
                    if rank > args.top_k:
                        break
            
            # Bulk insert for efficiency
            if recommendations_to_add:
                db.bulk_insert_mappings(ProductRecommendation, recommendations_to_add)
                db.commit()
                
            percent = (end_idx / num_products) * 100
            print(f"Progress: {percent:.1f}% ({end_idx}/{num_products})")

        print("Successfully generated all recommendations!")

    except Exception as e:
        print(f"Error during generation: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate semantic recommendations from FAISS index")
    # Calculate default artifacts path relative to backend root
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    default_artifacts_dir = os.path.join(backend_dir, "artifacts", "search")
    
    parser.add_argument("--artifacts-dir", type=str, default=default_artifacts_dir, help="Path to search artifacts")
    parser.add_argument("--top-k", type=int, default=15, help="Number of recommendations per product")
    parser.add_argument("--batch-size", type=int, default=500, help="Batch size for vector search and DB insert")
    
    args = parser.parse_args()
    generate_recommendations(args)
