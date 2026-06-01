from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends, status as http_status, Query
from fastapi.responses import JSONResponse, Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import os
import logging
import bcrypt
import jwt
import uuid
import storage_client

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="kamera.kch API")
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# JWT Configuration
JWT_SECRET = os.environ.get("JWT_SECRET", "")
JWT_ALGORITHM = "HS256"
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@kamera.kch")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")

# Business Configuration
ADMIN_PHONE = "+60 12-879 7715"
BANK_ACCOUNT = "0143 0136 5022"
BANK_NAME = "Maybank"
COD_FEE = 15.0

# Password Hashing
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=12),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        user["id"] = str(user["_id"])
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Camera(BaseModel):
    id: str
    name: str
    brand: str
    model: str
    daily_rate: float
    specs: str
    image_url: str
    status: str = "available"

class CustomerInfo(BaseModel):
    full_name: str
    ic_number: str
    phone: str
    emergency_contact: str
    social_media: str
    address: str
    ic_photo_front: str  # base64 data URL
    ic_photo_back: str  # base64 data URL

class BookingCreate(BaseModel):
    camera_id: str
    start_date: str
    end_date: str
    customer_info: CustomerInfo
    delivery_method: str = Field(..., pattern="^(self_pickup|cod)$")
    pickup_location: Optional[str] = None
    delivery_address: Optional[str] = None
    terms_accepted: bool

class PaymentReceiptUpload(BaseModel):
    receipt_image: str  # base64 data URL
    payment_reference: Optional[str] = None

class BlockDatesRequest(BaseModel):
    dates: List[str]

class BookingStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(pending_payment|payment_review|confirmed|active|completed|cancelled)$")

# Authentication Endpoints
@api_router.post("/auth/register", status_code=http_status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    email = user_data.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed = hash_password(user_data.password)
    user_doc = {
        "email": email,
        "password_hash": hashed,
        "name": user_data.name,
        "role": "customer",
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    access_token = create_access_token(user_id, email, "customer")
    
    response = JSONResponse(content={
        "id": user_id,
        "email": email,
        "name": user_data.name,
        "role": "customer"
    }, status_code=http_status.HTTP_201_CREATED)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=43200, path="/")
    return response

@api_router.post("/auth/login")
async def login(user_data: UserLogin):
    email = user_data.email.lower()
    user = await db.users.find_one({"email": email})
    
    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email, user["role"])
    
    response = JSONResponse(content={
        "id": user_id,
        "email": user["email"],
        "name": user["name"],
        "role": user["role"]
    })
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=43200, path="/")
    return response

@api_router.post("/auth/logout")
async def logout():
    response = JSONResponse(content={"message": "Logged out successfully"})
    response.delete_cookie(key="access_token", path="/")
    return response

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "name": current_user["name"],
        "role": current_user["role"]
    }

# Business Info
@api_router.get("/business/info")
async def get_business_info():
    return {
        "name": "kamera.kch",
        "phone": ADMIN_PHONE,
        "bank_name": BANK_NAME,
        "bank_account": BANK_ACCOUNT,
        "cod_fee": COD_FEE,
        "pickup_locations": [
            "SK Jalan Muara Tuang",
            "Federal Park Matang"
        ]
    }

# Camera Endpoints
@api_router.get("/cameras", response_model=List[Camera])
async def get_cameras():
    cameras = await db.cameras.find({}, {"_id": 0}).to_list(100)
    return cameras

@api_router.get("/cameras/{camera_id}", response_model=Camera)
async def get_camera(camera_id: str):
    camera = await db.cameras.find_one({"id": camera_id}, {"_id": 0})
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    return camera

@api_router.get("/cameras/{camera_id}/availability")
async def get_camera_availability(camera_id: str):
    camera = await db.cameras.find_one({"id": camera_id})
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    bookings = await db.bookings.find({
        "camera_id": camera_id,
        "status": {"$in": ["confirmed", "pending_payment", "payment_review", "active"]}
    }).to_list(1000)
    
    blocked_dates_data = await db.blocked_dates.find({"camera_id": camera_id}).to_list(1000)
    
    blocked_dates = []
    for booking in bookings:
        start = datetime.fromisoformat(booking["start_date"])
        end = datetime.fromisoformat(booking["end_date"])
        current = start
        while current <= end:
            blocked_dates.append(current.strftime("%Y-%m-%d"))
            current += timedelta(days=1)
    
    for blocked in blocked_dates_data:
        for date_str in blocked.get("dates", []):
            if date_str not in blocked_dates:
                blocked_dates.append(date_str)
    
    return {"camera_id": camera_id, "blocked_dates": list(set(blocked_dates))}

@api_router.post("/cameras/{camera_id}/block-dates", status_code=http_status.HTTP_201_CREATED)
async def block_dates(camera_id: str, dates_data: BlockDatesRequest, admin: dict = Depends(require_admin)):
    camera = await db.cameras.find_one({"id": camera_id})
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    existing = await db.blocked_dates.find_one({"camera_id": camera_id})
    if existing:
        await db.blocked_dates.update_one(
            {"camera_id": camera_id},
            {"$addToSet": {"dates": {"$each": dates_data.dates}}}
        )
    else:
        await db.blocked_dates.insert_one({
            "camera_id": camera_id,
            "dates": dates_data.dates
        })
    
    return {"message": "Dates blocked successfully"}

# Booking Endpoints
@api_router.post("/bookings", status_code=http_status.HTTP_201_CREATED)
async def create_booking(booking_data: BookingCreate, current_user: dict = Depends(get_current_user)):
    if not booking_data.terms_accepted:
        raise HTTPException(status_code=400, detail="Terms and conditions must be accepted")
    
    camera = await db.cameras.find_one({"id": booking_data.camera_id})
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    start_date = datetime.fromisoformat(booking_data.start_date)
    end_date = datetime.fromisoformat(booking_data.end_date)
    
    if start_date > end_date:
        raise HTTPException(status_code=400, detail="End date must be after or equal to start date")
    
    days = (end_date - start_date).days + 1
    rental_amount = camera["daily_rate"] * days
    delivery_fee = COD_FEE if booking_data.delivery_method == "cod" else 0.0
    total_amount = rental_amount + delivery_fee
    deposit_amount = round(rental_amount * 0.5, 2)
    
    # Upload IC photos to object storage
    customer_info_dict = booking_data.customer_info.dict()
    try:
        ic_front_result = storage_client.upload_data_url(
            current_user["id"], "ic-front", customer_info_dict["ic_photo_front"]
        )
        ic_back_result = storage_client.upload_data_url(
            current_user["id"], "ic-back", customer_info_dict["ic_photo_back"]
        )
    except Exception as e:
        logger.error(f"Failed to upload IC photos: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload IC photos")
    
    # Replace inline base64 with storage path references
    customer_info_dict["ic_photo_front"] = ic_front_result["storage_path"]
    customer_info_dict["ic_photo_back"] = ic_back_result["storage_path"]
    customer_info_dict["ic_photo_front_content_type"] = ic_front_result["content_type"]
    customer_info_dict["ic_photo_back_content_type"] = ic_back_result["content_type"]
    
    booking_id = str(uuid.uuid4())
    booking_doc = {
        "id": booking_id,
        "user_id": current_user["id"],
        "user_email": current_user["email"],
        "camera_id": booking_data.camera_id,
        "camera_name": camera["name"],
        "camera_daily_rate": camera["daily_rate"],
        "start_date": booking_data.start_date,
        "end_date": booking_data.end_date,
        "days": days,
        "rental_amount": rental_amount,
        "delivery_fee": delivery_fee,
        "total_amount": total_amount,
        "deposit_amount": deposit_amount,
        "balance_amount": total_amount - deposit_amount,
        "currency": "MYR",
        "status": "pending_payment",
        "payment_status": "pending",
        "delivery_method": booking_data.delivery_method,
        "pickup_location": booking_data.pickup_location,
        "delivery_address": booking_data.delivery_address,
        "customer_info": customer_info_dict,
        "terms_accepted": booking_data.terms_accepted,
        "terms_accepted_at": datetime.now(timezone.utc).isoformat(),
        "payment_receipt": None,
        "payment_receipt_content_type": None,
        "payment_reference": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Track files for audit/cleanup
    await db.files.insert_many([
        {
            "id": str(uuid.uuid4()),
            "storage_path": ic_front_result["storage_path"],
            "content_type": ic_front_result["content_type"],
            "size": ic_front_result["size"],
            "user_id": current_user["id"],
            "booking_id": booking_id,
            "kind": "ic-front",
            "is_deleted": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        },
        {
            "id": str(uuid.uuid4()),
            "storage_path": ic_back_result["storage_path"],
            "content_type": ic_back_result["content_type"],
            "size": ic_back_result["size"],
            "user_id": current_user["id"],
            "booking_id": booking_id,
            "kind": "ic-back",
            "is_deleted": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        },
    ])
    
    await db.bookings.insert_one(booking_doc)
    booking_doc.pop("_id", None)
    return booking_doc

@api_router.get("/bookings")
async def get_bookings(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "admin":
        bookings = await db.bookings.find({}, {"_id": 0}).to_list(1000)
    else:
        bookings = await db.bookings.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(1000)
    
    return bookings

@api_router.get("/bookings/{booking_id}")
async def get_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if current_user["role"] != "admin" and booking["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return booking

@api_router.post("/bookings/{booking_id}/upload-receipt")
async def upload_payment_receipt(booking_id: str, receipt_data: PaymentReceiptUpload, current_user: dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking["user_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Upload receipt to object storage
    try:
        receipt_result = storage_client.upload_data_url(
            current_user["id"], "receipt", receipt_data.receipt_image
        )
    except Exception as e:
        logger.error(f"Failed to upload receipt: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload receipt")
    
    # Track file
    await db.files.insert_one({
        "id": str(uuid.uuid4()),
        "storage_path": receipt_result["storage_path"],
        "content_type": receipt_result["content_type"],
        "size": receipt_result["size"],
        "user_id": current_user["id"],
        "booking_id": booking_id,
        "kind": "receipt",
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    
    await db.bookings.update_one(
        {"id": booking_id},
        {
            "$set": {
                "payment_receipt": receipt_result["storage_path"],
                "payment_receipt_content_type": receipt_result["content_type"],
                "payment_reference": receipt_data.payment_reference,
                "payment_status": "receipt_uploaded",
                "status": "payment_review",
                "receipt_uploaded_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {"message": "Receipt uploaded successfully. Awaiting admin verification."}

@api_router.get("/files/{file_path:path}")
async def serve_file(file_path: str, request: Request, auth: Optional[str] = Query(None)):
    """Serve files from object storage with authentication.
    
    Supports auth via cookie, Bearer header, or ?auth=<token> query param
    (the latter is needed because <img src=""> cannot send custom headers).
    """
    # Authenticate via cookie/header OR query param
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token and auth:
        token = auth
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user_id = payload["sub"]
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    # Look up file record - file must exist and either belong to user or user is admin
    file_record = await db.files.find_one({"storage_path": file_path, "is_deleted": False})
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
    
    if user.get("role") != "admin" and file_record["user_id"] != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        data, content_type = storage_client.get_object(file_path)
    except Exception as e:
        logger.error(f"Failed to retrieve file {file_path}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve file") from e
    
    return Response(
        content=data,
        media_type=file_record.get("content_type") or content_type,
        headers={"Cache-Control": "private, max-age=3600"},
    )

@api_router.put("/bookings/{booking_id}/status")
async def update_booking_status(booking_id: str, status_data: BookingStatusUpdate, admin: dict = Depends(require_admin)):
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    update_data = {"status": status_data.status}
    if status_data.status == "confirmed":
        update_data["payment_status"] = "deposit_paid"
        update_data["confirmed_at"] = datetime.now(timezone.utc).isoformat()
    elif status_data.status == "cancelled":
        update_data["cancelled_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.bookings.update_one({"id": booking_id}, {"$set": update_data})
    
    return {"message": f"Booking status updated to {status_data.status}"}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await db.users.create_index("email", unique=True)
    await db.cameras.create_index("id", unique=True)
    await db.bookings.create_index("id", unique=True)
    await db.files.create_index("storage_path")
    await db.files.create_index("booking_id")
    
    # Initialize object storage session
    try:
        storage_client.init_storage()
        logger.info("Object storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed (uploads will fail until retried): {e}")
    
    admin_email = ADMIN_EMAIL
    admin_password = ADMIN_PASSWORD
    
    existing_admin = await db.users.find_one({"email": admin_email})
    if not existing_admin:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hashed,
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc)
        })
        logger.info(f"Admin user created: {admin_email}")
    elif not verify_password(admin_password, existing_admin["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}}
        )
    
    # Remove old cameras and re-seed
    await db.cameras.delete_many({})
    cameras_data = [
        {
            "id": "canon-r10",
            "name": "Canon R10",
            "brand": "Canon",
            "model": "EOS R10",
            "daily_rate": 75.0,
            "specs": "24.2MP APS-C sensor, 4K 60fps video, Dual Pixel CMOS AF II",
            "image_url": "https://static.prod-images.emergentagent.com/jobs/e25e9fd6-30a2-4568-9ae4-14f962ee8dd4/images/749eab4d246ce96ec2a1ef722a080695f10fe46900b11be94af3bed2c963a649.png",
            "status": "available"
        },
        {
            "id": "canon-r50",
            "name": "Canon R50",
            "brand": "Canon",
            "model": "EOS R50",
            "daily_rate": 65.0,
            "specs": "24.2MP APS-C sensor, 4K 30fps video, DIGIC X processor",
            "image_url": "https://static.prod-images.emergentagent.com/jobs/e25e9fd6-30a2-4568-9ae4-14f962ee8dd4/images/d77175412341dadbe8bf3fbec4b61e5e38b5d0e82ac7b5e721dc7085aa7c1d9f.png",
            "status": "available"
        },
        {
            "id": "canon-m200",
            "name": "Canon M200",
            "brand": "Canon",
            "model": "EOS M200",
            "daily_rate": 60.0,
            "specs": "24.1MP APS-C sensor, 4K 24fps video, Dual Pixel CMOS AF",
            "image_url": "https://static.prod-images.emergentagent.com/jobs/e25e9fd6-30a2-4568-9ae4-14f962ee8dd4/images/221442e145f8d645def41f5feb30e5c0dfa643db52bf71c1a3b9e6d30d481b55.png",
            "status": "available"
        },
        {
            "id": "canon-m10",
            "name": "Canon M10",
            "brand": "Canon",
            "model": "EOS M10",
            "daily_rate": 55.0,
            "specs": "18MP APS-C sensor, Full HD video, Self Portrait mode",
            "image_url": "https://static.prod-images.emergentagent.com/jobs/e25e9fd6-30a2-4568-9ae4-14f962ee8dd4/images/99c259a56d4da5e275d79d55896a8ab6b8b6a6c9819596b54e1f1bc9cff78196.png",
            "status": "available"
        },
        {
            "id": "canon-sx740",
            "name": "Canon SX740",
            "brand": "Canon",
            "model": "PowerShot SX740 HS",
            "daily_rate": 55.0,
            "specs": "20.3MP CMOS sensor, 40x optical zoom, 4K 30fps video",
            "image_url": "https://static.prod-images.emergentagent.com/jobs/e25e9fd6-30a2-4568-9ae4-14f962ee8dd4/images/ea9d5ed6df9c7d5ec1bc793ba0e2a6fe2c6ec574f7bd46e9080a07700e385cb4.png",
            "status": "available"
        },
        {
            "id": "dji-action-4",
            "name": "DJI Action 4",
            "brand": "DJI",
            "model": "Osmo Action 4",
            "daily_rate": 45.0,
            "specs": "4K 120fps, 1/1.3-inch sensor, 10-bit color, waterproof to 18m",
            "image_url": "https://images.unsplash.com/photo-1614632537190-23e4146777db?w=800&q=80",
            "status": "available"
        },
        {
            "id": "dji-osmo-pocket-2",
            "name": "DJI Osmo Pocket 2 Combo",
            "brand": "DJI",
            "model": "Osmo Pocket 2 Combo",
            "daily_rate": 40.0,
            "specs": "4K 60fps, 3-axis gimbal, 64MP photo, ActiveTrack 3.0",
            "image_url": "https://images.unsplash.com/photo-1606987655311-7d10a73dbb8c?w=800&q=80",
            "status": "available"
        }
    ]
    await db.cameras.insert_many(cameras_data)
    logger.info("Camera data seeded")
    
    test_customer = await db.users.find_one({"email": "customer@test.com"})
    if not test_customer:
        hashed = hash_password("customer123")
        await db.users.insert_one({
            "email": "customer@test.com",
            "password_hash": hashed,
            "name": "Test Customer",
            "role": "customer",
            "created_at": datetime.now(timezone.utc)
        })

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
