from app.models.user import User, OtpCode
from app.models.novel import Genre, Tag, Novel, Chapter
from app.models.interaction import (
    Bookmark,
    History,
    Follow,
    Notification,
    Comment,
    Rating,
)

__all__ = [
    "User",
    "OtpCode",
    "Genre",
    "Tag",
    "Novel",
    "Chapter",
    "Bookmark",
    "History",
    "Follow",
    "Notification",
    "Comment",
    "Rating",
]
