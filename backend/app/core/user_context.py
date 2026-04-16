from sqlalchemy.orm import Session

from app.models import User


def ensure_default_user(db: Session) -> User:
    user = db.query(User).order_by(User.id.asc()).first()
    if user:
        return user

    user = User(
        name="Demo User",
        email="demo@scalercart.local",
        phone=None,
        password_hash="",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
