from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.schemas.user import UserOut


class CommentBase(BaseModel):
    content: str = Field(..., max_length=1000)


class CommentCreate(CommentBase):
    pass


class CommentBrief(BaseModel):
    id: int
    content: str
    user_id: int
    post_id: Optional[int] = None
    reel_id: Optional[int] = None
    parent_id: Optional[int] = None
    created_at: datetime
    user: UserOut  # Matches the relationship name 'user'

    model_config = ConfigDict(from_attributes=True)

class CommentOut(CommentBrief):
    replies: List[CommentBrief] = Field(default_factory=list)
