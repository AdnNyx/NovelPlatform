import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import novel, chapter, genre
from fastapi.staticfiles import StaticFiles

app = FastAPI(
    title="Light Novel API",
    description="API Headless untuk Platform Membaca Light Novel",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Folder Static
os.makedirs("static/illustrations", exist_ok=True)
os.makedirs("static/covers", exist_ok=True)

# Melayani rute "/static" yang mengarah ke folder "static" lokal
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(novel.router, prefix="/api/v1/novels", tags=["Novels"])
app.include_router(chapter.router, prefix="/api/v1/chapters", tags=["Chapters"])
app.include_router(genre.router, prefix="/api/v1/genres", tags=["Genres"])

@app.get("/", tags=["Health Check"])
async def root():
    return {
        "message": "Welcome to Light Novel API!",
        "status": "Server is running smoothly."
    }