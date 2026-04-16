import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Load from environment variable — falls back to local SQLite for development
database_url = os.getenv("DATABASE_URL", "")

if not database_url:
    # Local development fallback — absolute path to the SQLite db
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    database_url = f"sqlite:///{os.path.join(BASE_DIR, 'scaler_ecommerce.db')}"

# Neon / Render provides postgres:// but SQLAlchemy requires postgresql://
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

# Use connection pooling args only for Postgres (SQLite doesn't support them)
is_sqlite = database_url.startswith("sqlite")
engine_kwargs = {"connect_args": {"check_same_thread": False}} if is_sqlite else {}

engine = create_engine(database_url, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
