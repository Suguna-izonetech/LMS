from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from app.db.database import Base, engine
from app.routers import auth, teacher, institute_admin, student

app = FastAPI(title="iZone LMS Multi-Role Portal API", version="1.0.0")

# Compress responses larger than 500 bytes
app.add_middleware(GZipMiddleware, minimum_size=500)

# Create tables if they don't exist
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning: Could not create database tables on startup: {e}")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    # Expose Content-Disposition header so browser downloads preserve custom filename
    expose_headers=["Content-Disposition"]
)

# Serve uploads directory static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include Routers
app.include_router(auth.router, prefix="/api")
app.include_router(teacher.router)
app.include_router(institute_admin.router, prefix="/api")
app.include_router(student.router)

@app.get("/")
def root():
    return {
        "message": "iZone LMS API is running!",
        "version": "1.0.0"
    }

