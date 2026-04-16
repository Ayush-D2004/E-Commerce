import os
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import products, cart, orders, recommendations, payments, users, wishlist, notifications
from app.core.search_artifacts import load_search_artifacts


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load heavy ML artifacts in a background thread so the event loop isn't blocked."""
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, load_search_artifacts)
    yield


app = FastAPI(title="Scaler Ecommerce API", version="1.0.0", lifespan=lifespan)

# In production set FRONTEND_URL=https://your-app.vercel.app on Render.
# Locally this defaults to "*" so localhost:5173 works without any config.
_frontend_url = os.getenv("FRONTEND_URL", "*")
_allow_origins = ["*"] if _frontend_url == "*" else [_frontend_url, "http://localhost:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router, prefix="/api/v1")
app.include_router(cart.router, prefix="/api/v1")
app.include_router(orders.router, prefix="/api/v1")
app.include_router(recommendations.router, prefix="/api/v1")
app.include_router(payments.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(wishlist.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")


@app.get("/api/v1/health")
async def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
