from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

class ProductSchemaBase(BaseModel):
    id: int
    name: str
    slug: str
    price: float
    rating: float
    review_count: int
    in_stock: bool
    image_url: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class CategorySchema(BaseModel):
    id: int
    name: str
    slug: str
    model_config = ConfigDict(from_attributes=True)

class ProductImageSchema(BaseModel):
    url: str
    alt_text: Optional[str]
    model_config = ConfigDict(from_attributes=True)

class ProductSpecSchema(BaseModel):
    key: str
    value: str
    model_config = ConfigDict(from_attributes=True)

class ProductDetailSchema(ProductSchemaBase):
    description: str
    brand: Optional[str]
    stock_qty: int
    images: List[ProductImageSchema]
    specs: List[ProductSpecSchema]
    category: CategorySchema
    model_config = ConfigDict(from_attributes=True)

class ProductListResponse(BaseModel):
    items: List[ProductSchemaBase]
    page: int
    page_size: int
    total: int

class CartItemSchema(BaseModel):
    id: int
    product_id: int
    name: str
    image_url: str
    quantity: int
    unit_price: float
    line_total: float
    in_stock: bool

class CartResponse(BaseModel):
    cart_id: int
    items: List[CartItemSchema]
    subtotal: float
    item_count: int

class CartItemAddRequest(BaseModel):
    product_id: int
    quantity: int

class AddressSchema(BaseModel):
    id: int
    line1: str
    line2: Optional[str] = None
    city: str
    state: str
    postal_code: str
    country: str
    is_default: bool
    model_config = ConfigDict(from_attributes=True)

class AddressCreateRequest(BaseModel):
    line1: str
    line2: Optional[str] = None
    city: str
    state: str
    postal_code: str
    country: str = "India"
    is_default: bool = False

class CheckoutItem(BaseModel):
    product_id: str
    name: str
    quantity: int
    price: float

class CheckoutRequest(BaseModel):
    address_id: int
    payment_method: str
    items: Optional[List[CheckoutItem]] = None

class OrderSchema(BaseModel):
    order_id: int
    order_number: str
    status: str
    total_amount: float
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class OrderListResponse(BaseModel):
    items: List[OrderSchema]

class WishlistResponse(BaseModel):
    items: List[ProductSchemaBase]
