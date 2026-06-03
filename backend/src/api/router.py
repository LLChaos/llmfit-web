"""Main API router - aggregates all sub-routers."""

from fastapi import APIRouter

from src.api.recommend import router as recommend_router
from src.api.models import router as models_router
from src.api.gpus import router as gpus_router
from src.api.news import admin_router as news_admin_router, router as news_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(recommend_router)
api_router.include_router(models_router)
api_router.include_router(gpus_router)
api_router.include_router(news_router)
api_router.include_router(news_admin_router)
