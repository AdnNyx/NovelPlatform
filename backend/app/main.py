from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.admin import router as admin_router
from app.api.routes.auth import router as auth_router
from app.api.routes.chapters import router as chapters_router
from app.api.routes.novelis import router as novelis_router
from app.api.routes.novels import router as novels_router
from app.api.routes.personal import router as personal_router
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup tasks
    yield
    # Shutdown tasks


app = FastAPI(
    title=settings.APP_NAME,
    description="Backend REST API for Web Baca Novel Publik",
    version="1.0.0",
    docs_url="/docs" if not settings.IS_PRODUCTION else None,
    redoc_url="/redoc" if not settings.IS_PRODUCTION else None,
    openapi_url="/openapi.json" if not settings.IS_PRODUCTION else None,
    lifespan=lifespan,
)

# Cross-Origin Resource Sharing (CORS) Configuration
# Contract: Never use ["*"] when credentials are enabled.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# Register API Routers under /api
app.include_router(auth_router, prefix="/api")
app.include_router(novels_router, prefix="/api")
app.include_router(chapters_router, prefix="/api")
app.include_router(personal_router, prefix="/api")
app.include_router(novelis_router, prefix="/api")
app.include_router(admin_router, prefix="/api")


@app.get("/api/health", tags=["Health"])
async def health_check():
    """Health check endpoint to verify backend operational status."""
    return {"status": "healthy", "app": settings.APP_NAME}
