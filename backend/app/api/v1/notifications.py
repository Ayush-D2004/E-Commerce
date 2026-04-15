from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Notification

router = APIRouter(tags=["Notifications"])

@router.get("/notifications")
def get_notifications(db: Session = Depends(get_db)):
    user_id = 1
    notes = db.query(Notification).filter(
        Notification.user_id == user_id
    ).order_by(Notification.created_at.desc()).limit(50).all()
    return {
        "unread_count": sum(1 for n in notes if not n.is_read),
        "items": [
            {
                "id": n.id,
                "type": n.type,
                "title": n.title,
                "body": n.body,
                "is_read": n.is_read,
                "order_id": n.order_id,
                "created_at": n.created_at.isoformat(),
            }
            for n in notes
        ]
    }

@router.put("/notifications/{notification_id}/read")
def mark_read(notification_id: int, db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == notification_id).first()
    if n:
        n.is_read = True
        db.commit()
    return {"status": "ok"}

@router.put("/notifications/read-all")
def mark_all_read(db: Session = Depends(get_db)):
    user_id = 1
    db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"status": "ok"}
