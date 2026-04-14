import os
import sys
import struct
from sqlalchemy import text

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.database import SessionLocal

def fix_binary_ids():
    db = SessionLocal()
    print("Fetching recommendation IDs...")
    # Use raw SQL to handle potential binary vs integer confusion in SQLAlchemy models
    results = db.execute(text("SELECT id, recommended_product_id FROM product_recommendations")).fetchall()
    
    fixed_count = 0
    for row_id, rec_id in results:
        if isinstance(rec_id, bytes):
            # binary b'\xaa\x00\x00\x00\x00\x00\x00\x00' -> 170
            # Assuming little-endian 8-byte integer
            try:
                fixed_id = struct.unpack('<Q', rec_id)[0]
                db.execute(
                    text("UPDATE product_recommendations SET recommended_product_id = :fixed_id WHERE id = :id"),
                    {"fixed_id": fixed_id, "id": row_id}
                )
                fixed_count += 1
            except Exception as e:
                print(f"Failed to fix row {row_id}: {e}")
        
    db.commit()
    print(f"Finished! Fixed {fixed_count} recommendation IDs.")
    db.close()

if __name__ == "__main__":
    fix_binary_ids()
