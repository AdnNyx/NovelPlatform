from fastapi import APIRouter, Depends
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import require_novelis
from app.core.database import get_db
from app.models.interaction import Bookmark
from app.models.novel import Novel
from app.models.user import User
from app.schemas.base import StandardResponse
from app.schemas.novel import NovelisDashboardData, NovelisDashboardStats

router = APIRouter(prefix="/novelis", tags=["Novelis"])


@router.get(
    "/dashboard",
    response_model=StandardResponse[NovelisDashboardData],
    summary="Get author dashboard metrics and list of owned novels",
)
async def get_novelis_dashboard(
    current_user: User = Depends(require_novelis),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns aggregate metrics (views, novels, chapters, bookmarks)
    and all novels owned by current author.
    """
    stmt = (
        select(Novel)
        .where(Novel.author_id == current_user.id)
        .order_by(desc(Novel.created_at))
        .options(selectinload(Novel.author))
    )
    novels = (await db.execute(stmt)).scalars().all()

    total_views = sum(n.total_views for n in novels)
    total_novels = len(novels)
    total_chapters = sum(n.total_chapters for n in novels)

    novel_ids = [n.id for n in novels]
    total_bookmarks = 0
    if novel_ids:
        b_stmt = select(func.count(Bookmark.id)).where(Bookmark.novel_id.in_(novel_ids))
        total_bookmarks = (await db.execute(b_stmt)).scalar() or 0

    stats = NovelisDashboardStats(
        total_views=total_views,
        total_novels=total_novels,
        total_chapters=total_chapters,
        total_bookmarks=total_bookmarks,
    )

    return StandardResponse(
        data=NovelisDashboardData(stats=stats, novels=novels)
    )
