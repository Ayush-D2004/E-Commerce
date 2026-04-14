import sys
import os

# Add the 'backend' directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models import (
    User, Category, Product, ProductImage, ProductSpec, Inventory
)

def seed():
    # Make sure tables are created (Alembic handled this, but Base.metadata.create_all is safe)
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    
    try:
        # Check if already seeded
        if db.query(User).first():
            print("Database already seeded.")
            return

        print("Seeding database...")

        # Create Default User (ID=1)
        default_user = User(
            name="Default User",
            email="user@example.com",
            password_hash="secret",
            is_active=True
        )
        db.add(default_user)
        db.commit()

        # Create Categories
        electronics = Category(name="Electronics", slug="electronics")
        fashion = Category(name="Fashion", slug="fashion")
        home = Category(name="Home & Kitchen", slug="home-kitchen")
        db.add_all([electronics, fashion, home])
        db.commit()

        # Seed Products - Electronics
        p1 = Product(
            category_id=electronics.id,
            name="Asus ROG Strix G16 Gaming Laptop",
            slug="asus-rog-strix-g16",
            description="16 inch FHD+ 165Hz Display, NVIDIA GeForce RTX 4060, Intel Core i7 13th Gen, 16GB DDR5, 1TB SSD",
            brand="Asus",
            base_price=130287.27,
            currency="INR",
            rating=4.5,
            review_count=120,
            is_active=True
        )
        db.add(p1)
        db.commit()

        # Images & Specs for p1
        db.add(ProductImage(product_id=p1.id, image_url="https://m.media-amazon.com/images/I/71zHk7w1O+L._AC_SL1500_.jpg", alt_text="Front View", sort_order=1))
        db.add(ProductSpec(product_id=p1.id, spec_key="Processor", spec_value="Intel Core i7 13th Gen"))
        db.add(ProductSpec(product_id=p1.id, spec_key="RAM", spec_value="16GB DDR5"))
        db.add(Inventory(product_id=p1.id, stock_qty=50, reserved_qty=0))

        # Seed Products - Fashion
        p2 = Product(
            category_id=fashion.id,
            name="Men's Casual Athletic Sneakers",
            slug="mens-casual-athletic-sneakers",
            description="Comfortable, breathable mesh sneakers perfect for everyday wear.",
            brand="RunFit",
            base_price=2499.00,
            currency="INR",
            rating=4.2,
            review_count=350,
            is_active=True
        )
        db.add(p2)
        db.commit()

        db.add(ProductImage(product_id=p2.id, image_url="https://m.media-amazon.com/images/I/61bK6PMOC3L._AC_UY695_.jpg", alt_text="Side View", sort_order=1))
        db.add(Inventory(product_id=p2.id, stock_qty=200, reserved_qty=0))

        # Seed Products - Home
        p3 = Product(
            category_id=home.id,
            name="Instant Pot Duo 7-in-1",
            slug="instant-pot-duo",
            description="Electric Pressure Cooker, Slow Cooker, Rice Cooker, Steamer, Sauté, Yogurt Maker, Warmer & Sterilizer",
            brand="Instant Pot",
            base_price=7999.00,
            currency="INR",
            rating=4.8,
            review_count=5000,
            is_active=True
        )
        db.add(p3)
        db.commit()

        db.add(ProductImage(product_id=p3.id, image_url="https://m.media-amazon.com/images/I/71WtwEvYG1L._AC_SL1500_.jpg", alt_text="Main Product", sort_order=1))
        db.add(Inventory(product_id=p3.id, stock_qty=15, reserved_qty=0))

        db.commit()
        print("Seeding complete!")

    finally:
        db.close()

if __name__ == "__main__":
    seed()
