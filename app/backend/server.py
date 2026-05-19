"from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import shutil
import logging
import bcrypt
import jwt
import secrets
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal
from fastapi import FastAPI, APIRouter, Request, Response, HTTPException, Depends, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutSessionRequest
)

# ---------- Setup ----------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

UPLOAD_DIR = ROOT_DIR / \"uploads\"
UPLOAD_DIR.mkdir(exist_ok=True)

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGO = \"HS256\"
COOKIE_SECURE = False  # behind proxy in dev

app = FastAPI()
api = APIRouter(prefix=\"/api\")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(\"local-connect\")

# ---------- Helpers ----------
def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()

def verify_password(p: str, h: str) -> bool:
    try:
        return bcrypt.checkpw(p.encode(), h.encode())
    except Exception:
        return False

def create_token(user_id: str, kind: str, minutes: int = 0, days: int = 0) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=minutes, days=days)
    return jwt.encode({\"sub\": user_id, \"type\": kind, \"exp\": exp}, JWT_SECRET, algorithm=JWT_ALGO)

def set_auth_cookies(response: Response, user_id: str):
    access = create_token(user_id, \"access\", minutes=60 * 24)  # 24h for friendlier UX
    refresh = create_token(user_id, \"refresh\", days=7)
    response.set_cookie(\"access_token\", access, httponly=True, secure=COOKIE_SECURE,
                        samesite=\"lax\", max_age=60 * 60 * 24, path=\"/\")
    response.set_cookie(\"refresh_token\", refresh, httponly=True, secure=COOKIE_SECURE,
                        samesite=\"lax\", max_age=60 * 60 * 24 * 7, path=\"/\")

def clear_auth_cookies(response: Response):
    response.delete_cookie(\"access_token\", path=\"/\")
    response.delete_cookie(\"refresh_token\", path=\"/\")

def public_user(u: dict) -> dict:
    return {
        \"id\": u[\"id\"], \"email\": u[\"email\"], \"name\": u[\"name\"], \"role\": u[\"role\"],
        \"seller_status\": u.get(\"seller_status\"), \"shop_name\": u.get(\"shop_name\"),
        \"phone\": u.get(\"phone\"), \"address\": u.get(\"address\"),
        \"shop_description\": u.get(\"shop_description\"), \"shop_image\": u.get(\"shop_image\"),
        \"created_at\": u.get(\"created_at\"),
    }

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get(\"access_token\")
    if not token:
        h = request.headers.get(\"Authorization\", \"\")
        if h.startswith(\"Bearer \"):
            token = h[7:]
    if not token:
        raise HTTPException(401, \"Not authenticated\")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        if payload.get(\"type\") != \"access\":
            raise HTTPException(401, \"Invalid token type\")
        user = await db.users.find_one({\"id\": payload[\"sub\"]}, {\"_id\": 0})
        if not user:
            raise HTTPException(401, \"User not found\")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, \"Token expired\")
    except jwt.InvalidTokenError:
        raise HTTPException(401, \"Invalid token\")

def require_role(*roles):
    async def dep(user: dict = Depends(get_current_user)):
        if user[\"role\"] not in roles:
            raise HTTPException(403, f\"Forbidden. Requires role: {roles}\")
        return user
    return dep

def require_seller_approved():
    async def dep(user: dict = Depends(get_current_user)):
        if user[\"role\"] != \"seller\" or user.get(\"seller_status\") != \"approved\":
            raise HTTPException(403, \"Seller account not approved yet\")
        return user
    return dep

# ---------- Models ----------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=2)
    phone: Optional[str] = None

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class BecomeSellerIn(BaseModel):
    shop_name: str = Field(min_length=2)
    shop_description: str = \"\"
    phone: str
    address: str

class ProductIn(BaseModel):
    model_config = ConfigDict(extra=\"ignore\")
    name: str = Field(min_length=2)
    description: str = \"\"
    price: float = Field(ge=0)
    stock: int = Field(ge=0, default=0)
    category: str
    images: List[str] = []

class ServiceIn(BaseModel):
    model_config = ConfigDict(extra=\"ignore\")
    name: str = Field(min_length=2)
    description: str = \"\"
    price: float = Field(ge=0)
    category: str
    images: List[str] = []
    duration_minutes: int = Field(ge=0, default=60)

class CartItemIn(BaseModel):
    product_id: str
    quantity: int = Field(ge=1, default=1)

class WishlistIn(BaseModel):
    item_id: str
    item_type: Literal[\"product\", \"service\"]

class CheckoutAddress(BaseModel):
    full_name: str
    phone: str
    line1: str
    line2: Optional[str] = \"\"
    city: str = \"Bhatkal\"
    pincode: str
    notes: Optional[str] = \"\"

class PlaceOrderIn(BaseModel):
    address: CheckoutAddress
    payment_method: Literal[\"cod\", \"stripe\"]

class StripeSessionIn(BaseModel):
    order_id: str
    origin_url: str

class UpdateOrderStatusIn(BaseModel):
    status: Literal[\"pending\", \"confirmed\", \"preparing\", \"out_for_delivery\", \"delivered\", \"cancelled\"]

class ApproveSellerIn(BaseModel):
    seller_status: Literal[\"approved\", \"rejected\"]

class UpdateProfileIn(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    shop_name: Optional[str] = None
    shop_description: Optional[str] = None
    shop_image: Optional[str] = None

# ---------- Auth ----------
@api.post(\"/auth/register\")
async def register(payload: RegisterIn, response: Response):
    email = payload.email.lower().strip()
    if await db.users.find_one({\"email\": email}):
        raise HTTPException(400, \"Email already registered\")
    user = {
        \"id\": str(uuid.uuid4()),
        \"email\": email,
        \"name\": payload.name,
        \"phone\": payload.phone or \"\",
        \"address\": \"\",
        \"password_hash\": hash_password(payload.password),
        \"role\": \"customer\",
        \"seller_status\": None,
        \"created_at\": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user)
    set_auth_cookies(response, user[\"id\"])
    return public_user(user)

@api.post(\"/auth/login\")
async def login(payload: LoginIn, request: Request, response: Response):
    email = payload.email.lower().strip()
    ip = request.client.host if request.client else \"unknown\"
    key = f\"{ip}:{email}\"
    rec = await db.login_attempts.find_one({\"identifier\": key})
    now = datetime.now(timezone.utc)
    if rec and rec.get(\"locked_until\"):
        lu = datetime.fromisoformat(rec[\"locked_until\"])
        if lu > now:
            raise HTTPException(429, \"Too many attempts. Try again later.\")
    user = await db.users.find_one({\"email\": email})
    if not user or not verify_password(payload.password, user[\"password_hash\"]):
        attempts = (rec.get(\"attempts\", 0) + 1) if rec else 1
        update = {\"identifier\": key, \"attempts\": attempts, \"updated_at\": now.isoformat()}
        if attempts >= 5:
            update[\"locked_until\"] = (now + timedelta(minutes=15)).isoformat()
            update[\"attempts\"] = 0
        await db.login_attempts.update_one({\"identifier\": key}, {\"$set\": update}, upsert=True)
        raise HTTPException(401, \"Invalid email or password\")
    await db.login_attempts.delete_one({\"identifier\": key})
    set_auth_cookies(response, user[\"id\"])
    return public_user(user)

@api.post(\"/auth/logout\")
async def logout(response: Response, _: dict = Depends(get_current_user)):
    clear_auth_cookies(response)
    return {\"ok\": True}

@api.get(\"/auth/me\")
async def me(user: dict = Depends(get_current_user)):
    return public_user(user)

@api.post(\"/auth/refresh\")
async def refresh(request: Request, response: Response):
    token = request.cookies.get(\"refresh_token\")
    if not token:
        raise HTTPException(401, \"No refresh token\")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        if payload.get(\"type\") != \"refresh\":
            raise HTTPException(401, \"Invalid token type\")
        set_auth_cookies(response, payload[\"sub\"])
        return {\"ok\": True}
    except jwt.PyJWTError:
        raise HTTPException(401, \"Invalid token\")

@api.put(\"/auth/me\")
async def update_profile(payload: UpdateProfileIn, user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if updates:
        await db.users.update_one({\"id\": user[\"id\"]}, {\"$set\": updates})
    fresh = await db.users.find_one({\"id\": user[\"id\"]}, {\"_id\": 0})
    return public_user(fresh)

# ---------- Become Seller ----------
@api.post(\"/sellers/apply\")
async def apply_seller(payload: BecomeSellerIn, user: dict = Depends(get_current_user)):
    if user[\"role\"] == \"admin\":
        raise HTTPException(400, \"Admin cannot apply as seller\")
    await db.users.update_one(
        {\"id\": user[\"id\"]},
        {\"$set\": {
            \"role\": \"seller\",
            \"seller_status\": \"pending\",
            \"shop_name\": payload.shop_name,
            \"shop_description\": payload.shop_description,
            \"phone\": payload.phone,
            \"address\": payload.address,
        }}
    )
    fresh = await db.users.find_one({\"id\": user[\"id\"]}, {\"_id\": 0})
    return public_user(fresh)

# ---------- Public catalog ----------
CATEGORIES = {
    \"products\": [\"Groceries\", \"Bakery\", \"Crafts\", \"Clothing\", \"Electronics\", \"Stationery\", \"Home\", \"Other\"],
    \"services\": [\"Repairs\", \"Tutoring\", \"Beauty\", \"Cleaning\", \"Tailoring\", \"Transport\", \"Health\", \"Other\"],
}

@api.get(\"/categories\")
async def get_categories():
    return CATEGORIES

async def _enrich_with_seller(items: list) -> list:
    seller_ids = list({i[\"seller_id\"] for i in items if i.get(\"seller_id\")})
    if not seller_ids:
        return items
    sellers = await db.users.find({\"id\": {\"$in\": seller_ids}}, {\"_id\": 0}).to_list(1000)
    sm = {s[\"id\"]: {\"shop_name\": s.get(\"shop_name\") or s[\"name\"], \"id\": s[\"id\"]} for s in sellers}
    for i in items:
        i[\"seller\"] = sm.get(i.get(\"seller_id\"))
    return items

@api.get(\"/products\")
async def list_products(q: Optional[str] = None, category: Optional[str] = None,
                        seller_id: Optional[str] = None, limit: int = 60):
    filt = {\"is_active\": True, \"is_approved\": True}
    if seller_id:
        filt = {\"seller_id\": seller_id}  # show all for storefront owner page
    if q:
        filt[\"name\"] = {\"$regex\": q, \"$options\": \"i\"}
    if category and category != \"All\":
        filt[\"category\"] = category
    items = await db.products.find(filt, {\"_id\": 0}).sort(\"created_at\", -1).to_list(limit)
    return await _enrich_with_seller(items)

@api.get(\"/products/{pid}\")
async def get_product(pid: str):
    p = await db.products.find_one({\"id\": pid}, {\"_id\": 0})
    if not p:
        raise HTTPException(404, \"Not found\")
    await _enrich_with_seller([p])
    return p

@api.get(\"/services\")
async def list_services(q: Optional[str] = None, category: Optional[str] = None,
                        seller_id: Optional[str] = None, limit: int = 60):
    filt = {\"is_active\": True, \"is_approved\": True}
    if seller_id:
        filt = {\"seller_id\": seller_id}
    if q:
        filt[\"name\"] = {\"$regex\": q, \"$options\": \"i\"}
    if category and category != \"All\":
        filt[\"category\"] = category
    items = await db.services.find(filt, {\"_id\": 0}).sort(\"created_at\", -1).to_list(limit)
    return await _enrich_with_seller(items)

@api.get(\"/services/{sid}\")
async def get_service(sid: str):
    s = await db.services.find_one({\"id\": sid}, {\"_id\": 0})
    if not s:
        raise HTTPException(404, \"Not found\")
    await _enrich_with_seller([s])
    return s

@api.get(\"/sellers\")
async def list_sellers(q: Optional[str] = None, limit: int = 60):
    filt = {\"role\": \"seller\", \"seller_status\": \"approved\"}
    if q:
        filt[\"shop_name\"] = {\"$regex\": q, \"$options\": \"i\"}
    sellers = await db.users.find(filt, {\"_id\": 0, \"password_hash\": 0}).to_list(limit)
    return [public_user(s) for s in sellers]

@api.get(\"/sellers/{sid}\")
async def get_seller(sid: str):
    s = await db.users.find_one({\"id\": sid, \"role\": \"seller\"}, {\"_id\": 0, \"password_hash\": 0})
    if not s:
        raise HTTPException(404, \"Seller not found\")
    return public_user(s)

# ---------- Image upload ----------
@api.post(\"/upload\")
async def upload_image(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    if not file.content_type or not file.content_type.startswith(\"image/\"):
        raise HTTPException(400, \"Only image files allowed\")
    ext = (file.filename or \"img.jpg\").rsplit(\".\", 1)[-1].lower()
    if ext not in (\"jpg\", \"jpeg\", \"png\", \"webp\", \"gif\"):
        ext = \"jpg\"
    fname = f\"{uuid.uuid4().hex}.{ext}\"
    fpath = UPLOAD_DIR / fname
    with fpath.open(\"wb\") as fh:
        shutil.copyfileobj(file.file, fh)
    return {\"url\": f\"/api/uploads/{fname}\", \"filename\": fname}

# ---------- Seller — products/services ----------
@api.post(\"/seller/products\")
async def create_product(payload: ProductIn, user: dict = Depends(require_seller_approved())):
    p = payload.model_dump()
    p.update({
        \"id\": str(uuid.uuid4()),
        \"seller_id\": user[\"id\"],
        \"is_active\": True,
        \"is_approved\": True,
        \"created_at\": datetime.now(timezone.utc).isoformat(),
    })
    await db.products.insert_one(p)
    p.pop(\"_id\", None)
    return p

@api.put(\"/seller/products/{pid}\")
async def update_product(pid: str, payload: ProductIn, user: dict = Depends(require_seller_approved())):
    res = await db.products.update_one(
        {\"id\": pid, \"seller_id\": user[\"id\"]},
        {\"$set\": payload.model_dump()},
    )
    if res.matched_count == 0:
        raise HTTPException(404, \"Not found\")
    return await db.products.find_one({\"id\": pid}, {\"_id\": 0})

@api.delete(\"/seller/products/{pid}\")
async def delete_product(pid: str, user: dict = Depends(require_seller_approved())):
    await db.products.delete_one({\"id\": pid, \"seller_id\": user[\"id\"]})
    return {\"ok\": True}

@api.get(\"/seller/products\")
async def my_products(user: dict = Depends(require_role(\"seller\"))):
    items = await db.products.find({\"seller_id\": user[\"id\"]}, {\"_id\": 0}).to_list(500)
    return items

@api.post(\"/seller/services\")
async def create_service(payload: ServiceIn, user: dict = Depends(require_seller_approved())):
    s = payload.model_dump()
    s.update({
        \"id\": str(uuid.uuid4()),
        \"seller_id\": user[\"id\"],
        \"is_active\": True,
        \"is_approved\": True,
        \"created_at\": datetime.now(timezone.utc).isoformat(),
    })
    await db.services.insert_one(s)
    s.pop(\"_id\", None)
    return s

@api.put(\"/seller/services/{sid}\")
async def update_service(sid: str, payload: ServiceIn, user: dict = Depends(require_seller_approved())):
    res = await db.services.update_one(
        {\"id\": sid, \"seller_id\": user[\"id\"]},
        {\"$set\": payload.model_dump()},
    )
    if res.matched_count == 0:
        raise HTTPException(404, \"Not found\")
    return await db.services.find_one({\"id\": sid}, {\"_id\": 0})

@api.delete(\"/seller/services/{sid}\")
async def delete_service(sid: str, user: dict = Depends(require_seller_approved())):
    await db.services.delete_one({\"id\": sid, \"seller_id\": user[\"id\"]})
    return {\"ok\": True}

@api.get(\"/seller/services\")
async def my_services(user: dict = Depends(require_role(\"seller\"))):
    items = await db.services.find({\"seller_id\": user[\"id\"]}, {\"_id\": 0}).to_list(500)
    return items

@api.get(\"/seller/orders\")
async def seller_orders(user: dict = Depends(require_role(\"seller\"))):
    items = await db.orders.find({\"seller_ids\": user[\"id\"]}, {\"_id\": 0}).sort(\"created_at\", -1).to_list(500)
    return items

@api.put(\"/seller/orders/{oid}/status\")
async def seller_update_status(oid: str, payload: UpdateOrderStatusIn,
                               user: dict = Depends(require_role(\"seller\"))):
    order = await db.orders.find_one({\"id\": oid}, {\"_id\": 0})
    if not order or user[\"id\"] not in order.get(\"seller_ids\", []):
        raise HTTPException(404, \"Order not found\")
    await db.orders.update_one({\"id\": oid}, {\"$set\": {\"status\": payload.status}})
    return await db.orders.find_one({\"id\": oid}, {\"_id\": 0})

@api.get(\"/seller/stats\")
async def seller_stats(user: dict = Depends(require_role(\"seller\"))):
    products = await db.products.count_documents({\"seller_id\": user[\"id\"]})
    services = await db.services.count_documents({\"seller_id\": user[\"id\"]})
    orders = await db.orders.count_documents({\"seller_ids\": user[\"id\"]})
    pending = await db.orders.count_documents({\"seller_ids\": user[\"id\"], \"status\": \"pending\"})
    revenue_cursor = db.orders.find(
        {\"seller_ids\": user[\"id\"], \"payment_status\": {\"$in\": [\"paid\", \"cod\"]}},
        {\"_id\": 0, \"items\": 1}
    )
    revenue = 0.0
    async for o in revenue_cursor:
        for it in o.get(\"items\", []):
            if it.get(\"seller_id\") == user[\"id\"]:
                revenue += float(it.get(\"price\", 0)) * int(it.get(\"quantity\", 1))
    return {\"products\": products, \"services\": services, \"orders\": orders,
            \"pending_orders\": pending, \"revenue\": round(revenue, 2)}

# ---------- Cart ----------
@api.get(\"/cart\")
async def get_cart(user: dict = Depends(get_current_user)):
    items = await db.cart_items.find({\"user_id\": user[\"id\"]}, {\"_id\": 0}).to_list(500)
    pids = [i[\"product_id\"] for i in items]
    products = await db.products.find({\"id\": {\"$in\": pids}}, {\"_id\": 0}).to_list(500)
    pmap = {p[\"id\"]: p for p in products}
    out = []
    for i in items:
        p = pmap.get(i[\"product_id\"])
        if p:
            out.append({**i, \"product\": p})
    return out

@api.post(\"/cart\")
async def add_to_cart(payload: CartItemIn, user: dict = Depends(get_current_user)):
    p = await db.products.find_one({\"id\": payload.product_id}, {\"_id\": 0})
    if not p:
        raise HTTPException(404, \"Product not found\")
    existing = await db.cart_items.find_one({\"user_id\": user[\"id\"], \"product_id\": payload.product_id})
    if existing:
        new_qty = existing[\"quantity\"] + payload.quantity
        await db.cart_items.update_one(
            {\"user_id\": user[\"id\"], \"product_id\": payload.product_id},
            {\"$set\": {\"quantity\": new_qty}}
        )
    else:
        await db.cart_items.insert_one({
            \"id\": str(uuid.uuid4()),
            \"user_id\": user[\"id\"],
            \"product_id\": payload.product_id,
            \"quantity\": payload.quantity,
            \"created_at\": datetime.now(timezone.utc).isoformat(),
        })
    return {\"ok\": True}

@api.put(\"/cart/{product_id}\")
async def update_cart(product_id: str, payload: CartItemIn, user: dict = Depends(get_current_user)):
    if payload.quantity <= 0:
        await db.cart_items.delete_one({\"user_id\": user[\"id\"], \"product_id\": product_id})
    else:
        await db.cart_items.update_one(
            {\"user_id\": user[\"id\"], \"product_id\": product_id},
            {\"$set\": {\"quantity\": payload.quantity}}
        )
    return {\"ok\": True}

@api.delete(\"/cart/{product_id}\")
async def remove_cart(product_id: str, user: dict = Depends(get_current_user)):
    await db.cart_items.delete_one({\"user_id\": user[\"id\"], \"product_id\": product_id})
    return {\"ok\": True}

# ---------- Wishlist ----------
@api.get(\"/wishlist\")
async def get_wishlist(user: dict = Depends(get_current_user)):
    items = await db.wishlist_items.find({\"user_id\": user[\"id\"]}, {\"_id\": 0}).to_list(500)
    pids = [i[\"item_id\"] for i in items if i[\"item_type\"] == \"product\"]
    sids = [i[\"item_id\"] for i in items if i[\"item_type\"] == \"service\"]
    products = await db.products.find({\"id\": {\"$in\": pids}}, {\"_id\": 0}).to_list(500)
    services = await db.services.find({\"id\": {\"$in\": sids}}, {\"_id\": 0}).to_list(500)
    pmap = {p[\"id\"]: p for p in products}
    smap = {s[\"id\"]: s for s in services}
    out = []
    for i in items:
        if i[\"item_type\"] == \"product\" and i[\"item_id\"] in pmap:
            out.append({**i, \"product\": pmap[i[\"item_id\"]]})
        elif i[\"item_type\"] == \"service\" and i[\"item_id\"] in smap:
            out.append({**i, \"service\": smap[i[\"item_id\"]]})
    return out

@api.post(\"/wishlist\")
async def add_wishlist(payload: WishlistIn, user: dict = Depends(get_current_user)):
    existing = await db.wishlist_items.find_one(
        {\"user_id\": user[\"id\"], \"item_id\": payload.item_id, \"item_type\": payload.item_type}
    )
    if not existing:
        await db.wishlist_items.insert_one({
            \"id\": str(uuid.uuid4()),
            \"user_id\": user[\"id\"],
            \"item_id\": payload.item_id,
            \"item_type\": payload.item_type,
            \"created_at\": datetime.now(timezone.utc).isoformat(),
        })
    return {\"ok\": True}

@api.delete(\"/wishlist/{item_id}\")
async def remove_wishlist(item_id: str, user: dict = Depends(get_current_user)):
    await db.wishlist_items.delete_one({\"user_id\": user[\"id\"], \"item_id\": item_id})
    return {\"ok\": True}

# ---------- Orders ----------
@api.post(\"/orders\")
async def place_order(payload: PlaceOrderIn, user: dict = Depends(get_current_user)):
    cart = await db.cart_items.find({\"user_id\": user[\"id\"]}, {\"_id\": 0}).to_list(500)
    if not cart:
        raise HTTPException(400, \"Cart is empty\")
    pids = [i[\"product_id\"] for i in cart]
    products = await db.products.find({\"id\": {\"$in\": pids}}, {\"_id\": 0}).to_list(500)
    pmap = {p[\"id\"]: p for p in products}
    items = []
    seller_ids = set()
    total = 0.0
    for c in cart:
        p = pmap.get(c[\"product_id\"])
        if not p:
            continue
        line = float(p[\"price\"]) * int(c[\"quantity\"])
        total += line
        seller_ids.add(p[\"seller_id\"])
        items.append({
            \"product_id\": p[\"id\"], \"name\": p[\"name\"], \"price\": float(p[\"price\"]),
            \"quantity\": int(c[\"quantity\"]), \"image\": (p.get(\"images\") or [None])[0],
            \"seller_id\": p[\"seller_id\"],
        })
    order = {
        \"id\": str(uuid.uuid4()),
        \"user_id\": user[\"id\"],
        \"items\": items,
        \"seller_ids\": list(seller_ids),
        \"address\": payload.address.model_dump(),
        \"payment_method\": payload.payment_method,
        \"payment_status\": \"cod\" if payload.payment_method == \"cod\" else \"pending\",
        \"status\": \"pending\" if payload.payment_method == \"cod\" else \"awaiting_payment\",
        \"total\": round(total, 2),
        \"created_at\": datetime.now(timezone.utc).isoformat(),
    }
    await db.orders.insert_one(order)
    if payload.payment_method == \"cod\":
        await db.cart_items.delete_many({\"user_id\": user[\"id\"]})
    order.pop(\"_id\", None)
    return order

@api.get(\"/orders\")
async def my_orders(user: dict = Depends(get_current_user)):
    items = await db.orders.find({\"user_id\": user[\"id\"]}, {\"_id\": 0}).sort(\"created_at\", -1).to_list(500)
    return items

@api.get(\"/orders/{oid}\")
async def get_order(oid: str, user: dict = Depends(get_current_user)):
    o = await db.orders.find_one({\"id\": oid}, {\"_id\": 0})
    if not o:
        raise HTTPException(404, \"Not found\")
    if user[\"role\"] != \"admin\" and o[\"user_id\"] != user[\"id\"] and user[\"id\"] not in o.get(\"seller_ids\", []):
        raise HTTPException(403, \"Forbidden\")
    return o

# ---------- Stripe ----------
@api.post(\"/payments/checkout/session\")
async def create_checkout_session(payload: StripeSessionIn, request: Request,
                                  user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({\"id\": payload.order_id, \"user_id\": user[\"id\"]}, {\"_id\": 0})
    if not order:
        raise HTTPException(404, \"Order not found\")
    amount = float(order[\"total\"])
    api_key = os.environ[\"STRIPE_API_KEY\"]
    host_url = str(request.base_url).rstrip(\"/\")
    webhook_url = f\"{host_url}/api/webhook/stripe\"
    sc = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    success_url = f\"{payload.origin_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}&order_id={order['id']}\"
    cancel_url = f\"{payload.origin_url}/checkout?canceled=1\"
    req = CheckoutSessionRequest(
        amount=round(amount, 2), currency=\"usd\",
        success_url=success_url, cancel_url=cancel_url,
        metadata={\"order_id\": order[\"id\"], \"user_id\": user[\"id\"]}
    )
    session = await sc.create_checkout_session(req)
    await db.payment_transactions.insert_one({
        \"id\": str(uuid.uuid4()),
        \"order_id\": order[\"id\"],
        \"user_id\": user[\"id\"],
        \"session_id\": session.session_id,
        \"amount\": amount, \"currency\": \"usd\",
        \"payment_status\": \"pending\",
        \"status\": \"initiated\",
        \"metadata\": {\"order_id\": order[\"id\"], \"user_id\": user[\"id\"]},
        \"created_at\": datetime.now(timezone.utc).isoformat(),
    })
    return {\"url\": session.url, \"session_id\": session.session_id}

@api.get(\"/payments/checkout/status/{session_id}\")
async def checkout_status(session_id: str, request: Request, user: dict = Depends(get_current_user)):
    api_key = os.environ[\"STRIPE_API_KEY\"]
    host_url = str(request.base_url).rstrip(\"/\")
    sc = StripeCheckout(api_key=api_key, webhook_url=f\"{host_url}/api/webhook/stripe\")
    status = await sc.get_checkout_status(session_id)
    tx = await db.payment_transactions.find_one({\"session_id\": session_id}, {\"_id\": 0})
    if not tx:
        raise HTTPException(404, \"Transaction not found\")
    if tx[\"payment_status\"] != \"paid\" and status.payment_status == \"paid\":
        await db.payment_transactions.update_one(
            {\"session_id\": session_id},
            {\"$set\": {\"payment_status\": \"paid\", \"status\": status.status}}
        )
        await db.orders.update_one(
            {\"id\": tx[\"order_id\"]},
            {\"$set\": {\"payment_status\": \"paid\", \"status\": \"confirmed\"}}
        )
        await db.cart_items.delete_many({\"user_id\": user[\"id\"]})
    elif status.status == \"expired\":
        await db.payment_transactions.update_one(
            {\"session_id\": session_id},
            {\"$set\": {\"status\": \"expired\"}}
        )
    return {
        \"status\": status.status, \"payment_status\": status.payment_status,
        \"amount_total\": status.amount_total, \"currency\": status.currency,
        \"order_id\": tx[\"order_id\"]
    }

@api.post(\"/webhook/stripe\")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get(\"Stripe-Signature\", \"\")
    api_key = os.environ[\"STRIPE_API_KEY\"]
    host_url = str(request.base_url).rstrip(\"/\")
    sc = StripeCheckout(api_key=api_key, webhook_url=f\"{host_url}/api/webhook/stripe\")
    try:
        ev = await sc.handle_webhook(body, sig)
    except Exception as e:
        logger.warning(f\"Webhook error: {e}\")
        return {\"received\": False}
    if ev.payment_status == \"paid\":
        await db.payment_transactions.update_one(
            {\"session_id\": ev.session_id},
            {\"$set\": {\"payment_status\": \"paid\", \"status\": \"complete\"}}
        )
        oid = (ev.metadata or {}).get(\"order_id\")
        if oid:
            await db.orders.update_one(
                {\"id\": oid},
                {\"$set\": {\"payment_status\": \"paid\", \"status\": \"confirmed\"}}
            )
    return {\"received\": True}

# ---------- Admin ----------
@api.get(\"/admin/stats\")
async def admin_stats(user: dict = Depends(require_role(\"admin\"))):
    return {
        \"users\": await db.users.count_documents({}),
        \"sellers\": await db.users.count_documents({\"role\": \"seller\", \"seller_status\": \"approved\"}),
        \"pending_sellers\": await db.users.count_documents({\"role\": \"seller\", \"seller_status\": \"pending\"}),
        \"products\": await db.products.count_documents({}),
        \"services\": await db.services.count_documents({}),
        \"orders\": await db.orders.count_documents({}),
    }

@api.get(\"/admin/sellers\")
async def admin_list_sellers(status: Optional[str] = None,
                             user: dict = Depends(require_role(\"admin\"))):
    filt = {\"role\": \"seller\"}
    if status:
        filt[\"seller_status\"] = status
    sellers = await db.users.find(filt, {\"_id\": 0, \"password_hash\": 0}).to_list(500)
    return [public_user(s) for s in sellers]

@api.put(\"/admin/sellers/{sid}\")
async def admin_update_seller(sid: str, payload: ApproveSellerIn,
                              user: dict = Depends(require_role(\"admin\"))):
    res = await db.users.update_one(
        {\"id\": sid, \"role\": \"seller\"},
        {\"$set\": {\"seller_status\": payload.seller_status}}
    )
    if res.matched_count == 0:
        raise HTTPException(404, \"Seller not found\")
    return {\"ok\": True}

@api.get(\"/admin/users\")
async def admin_users(user: dict = Depends(require_role(\"admin\"))):
    users = await db.users.find({}, {\"_id\": 0, \"password_hash\": 0}).to_list(1000)
    return [public_user(u) for u in users]

@api.get(\"/admin/orders\")
async def admin_orders(user: dict = Depends(require_role(\"admin\"))):
    items = await db.orders.find({}, {\"_id\": 0}).sort(\"created_at\", -1).to_list(500)
    return items

@api.get(\"/admin/products\")
async def admin_products(user: dict = Depends(require_role(\"admin\"))):
    items = await db.products.find({}, {\"_id\": 0}).to_list(500)
    return await _enrich_with_seller(items)

@api.put(\"/admin/products/{pid}\")
async def admin_update_product(pid: str, payload: dict,
                               user: dict = Depends(require_role(\"admin\"))):
    allowed = {k: v for k, v in payload.items() if k in (\"is_active\", \"is_approved\")}
    await db.products.update_one({\"id\": pid}, {\"$set\": allowed})
    return {\"ok\": True}

@api.delete(\"/admin/products/{pid}\")
async def admin_delete_product(pid: str, user: dict = Depends(require_role(\"admin\"))):
    await db.products.delete_one({\"id\": pid})
    return {\"ok\": True}

@api.get(\"/admin/services\")
async def admin_services(user: dict = Depends(require_role(\"admin\"))):
    items = await db.services.find({}, {\"_id\": 0}).to_list(500)
    return await _enrich_with_seller(items)

@api.put(\"/admin/services/{sid}\")
async def admin_update_service(sid: str, payload: dict,
                               user: dict = Depends(require_role(\"admin\"))):
    allowed = {k: v for k, v in payload.items() if k in (\"is_active\", \"is_approved\")}
    await db.services.update_one({\"id\": sid}, {\"$set\": allowed})
    return {\"ok\": True}

@api.delete(\"/admin/services/{sid}\")
async def admin_delete_service(sid: str, user: dict = Depends(require_role(\"admin\"))):
    await db.services.delete_one({\"id\": sid})
    return {\"ok\": True}

# ---------- Health ----------
@api.get(\"/\")
async def root():
    return {\"app\": \"Local Connect\", \"ok\": True}

# ---------- Startup ----------
@app.on_event(\"startup\")
async def startup():
    await db.users.create_index(\"email\", unique=True)
    await db.users.create_index(\"id\", unique=True)
    await db.products.create_index(\"id\", unique=True)
    await db.services.create_index(\"id\", unique=True)
    await db.orders.create_index(\"id\", unique=True)
    await db.cart_items.create_index([(\"user_id\", 1), (\"product_id\", 1)])
    await db.wishlist_items.create_index([(\"user_id\", 1), (\"item_id\", 1)])
    await db.login_attempts.create_index(\"identifier\")
    # Seed admin
    admin_email = os.environ[\"ADMIN_EMAIL\"].lower().strip()
    admin_pw = os.environ[\"ADMIN_PASSWORD\"]
    existing = await db.users.find_one({\"email\": admin_email})
    if not existing:
        await db.users.insert_one({
            \"id\": str(uuid.uuid4()),
            \"email\": admin_email,
            \"name\": \"Admin\",
            \"phone\": \"\",
            \"address\": \"Bhatkal\",
            \"password_hash\": hash_password(admin_pw),
            \"role\": \"admin\",
            \"seller_status\": None,
            \"created_at\": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f\"Seeded admin user: {admin_email}\")
    elif not verify_password(admin_pw, existing[\"password_hash\"]):
        await db.users.update_one(
            {\"email\": admin_email},
            {\"$set\": {\"password_hash\": hash_password(admin_pw), \"role\": \"admin\"}}
        )

@app.on_event(\"shutdown\")
async def shutdown():
    client.close()

app.include_router(api)
app.mount(\"/api/uploads\", StaticFiles(directory=str(UPLOAD_DIR)), name=\"uploads\")

# CORS — allow credentials with explicit origins
allowed_origins_env = os.environ.get(\"CORS_ORIGINS\", \"*\")
if allowed_origins_env.strip() == \"*\":
    allowed_origins = [\"*\"]
else:
    allowed_origins = [o.strip() for o in allowed_origins_env.split(\",\") if o.strip()]
frontend_url = os.environ.get(\"FRONTEND_URL\")
if frontend_url and frontend_url not in allowed_origins:
    allowed_origins = list(set(allowed_origins + [frontend_url]))

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=\".*\",
    allow_credentials=True,
    allow_methods=[\"*\"],
    allow_headers=[\"*\"],
)
"