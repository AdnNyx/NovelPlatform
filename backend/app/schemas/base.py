from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class PaginationMeta(BaseModel):
    page: int
    limit: int
    total: int

    model_config = ConfigDict(from_attributes=True)


class StandardResponse(BaseModel, Generic[T]):
    status: str = "success"
    data: T

    model_config = ConfigDict(from_attributes=True)


class PaginatedResponse(BaseModel, Generic[T]):
    status: str = "success"
    data: List[T]
    meta: PaginationMeta

    model_config = ConfigDict(from_attributes=True)


class MessageData(BaseModel):
    message: str

    model_config = ConfigDict(from_attributes=True)
