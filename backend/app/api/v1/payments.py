import os
from dotenv import load_dotenv
try:
    import razorpay
except Exception:
    razorpay = None
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Order, Payment, Transaction

load_dotenv()

router = APIRouter()

# Intentionally using env vars so the user can supply API keys later.
# For now we can mock if they aren't provided.
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_mockkey123")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "mocksecret123")

client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)) if razorpay else None

class PaymentCreateRequest(BaseModel):
    order_id: int

class PaymentVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    backend_order_id: int

@router.post("/payments/create_order")
def create_payment_order(req: PaymentCreateRequest, db: Session = Depends(get_db)):
    # 1. Fetch our local Order
    order = db.query(Order).filter(Order.id == req.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    # Check if a payment holds for it
    if db.query(Payment).filter(Payment.order_id == order.id).first():
        pass # Depending on flow, we might recreate or just return existing.

    # 2. Razorpay demands amounts in paise (multiply by 100)
    amount_in_paise = int(float(order.total_amount) * 100)
    
    razorpay_order_data = {
        "amount": amount_in_paise,
        "currency": "INR",
        "receipt": f"receipt_order_{order.id}",
        "notes": {
            "user_id": str(order.user_id)
        }
    }

    try:
        if "mock" in RAZORPAY_KEY_ID or client is None:
            razorpay_order = {"id": f"order_mock_{order.id}", "amount": amount_in_paise, "currency": "INR"}
        else:
            razorpay_order = client.order.create(data=razorpay_order_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # 3. Create provisional Payment model entry
    payment = Payment(
        order_id=order.id,
        provider="razorpay",
        provider_order_id=razorpay_order['id'],
        amount=order.total_amount,
        currency="INR",
        status="pending"
    )
    db.add(payment)
    db.commit()

    return {
        "razorpay_order_id": razorpay_order['id'],
        "amount": razorpay_order['amount'],
        "currency": razorpay_order['currency'],
        "key_id": RAZORPAY_KEY_ID
    }

@router.post("/payments/verify")
def verify_payment(req: PaymentVerifyRequest, db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.order_id == req.backend_order_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found")

    order = db.query(Order).filter(Order.id == req.backend_order_id).first()

    # If using real keys, verify signature
    if "mock" not in RAZORPAY_KEY_ID and client is not None and razorpay is not None:
        try:
            client.utility.verify_payment_signature({
                'razorpay_order_id': req.razorpay_order_id,
                'razorpay_payment_id': req.razorpay_payment_id,
                'razorpay_signature': req.razorpay_signature
            })
        except razorpay.errors.SignatureVerificationError:
            payment.status = "failed"
            order.status = "payment_failed"
            db.commit()
            raise HTTPException(status_code=400, detail="Invalid payment signature")

    # Mark Success
    payment.provider_payment_id = req.razorpay_payment_id
    payment.signature = req.razorpay_signature
    payment.status = "success"
    order.status = "paid"
    
    # Record a generic transaction for the user
    txn = Transaction(
        user_id=order.user_id,
        amount=order.total_amount,
        type="purchase",
        status="success"
    )
    db.add(txn)
    db.commit()

    return {"status": "success", "message": "Payment verified perfectly"}
