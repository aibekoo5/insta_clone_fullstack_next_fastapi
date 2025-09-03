from pydantic import BaseModel, EmailStr, Field, HttpUrl, ConfigDict
from typing import Optional
from datetime import datetime
from pydantic import field_validator

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: Optional[str] = Field(None, max_length=100)

    model_config = ConfigDict(from_attributes=True)  # For SQLAlchemy compatibility

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    bio: Optional[str] = None
    profile_picture: Optional[str] = None

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    profile_picture: Optional[str] = None
    full_name: Optional[str] = None
    bio: Optional[str] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None
    created_at: Optional[datetime] = None
    followers_count: Optional[int] = None
    following_count: Optional[int] = None
    is_followed_by_current_user: Optional[bool] = None

    model_config = ConfigDict(from_attributes=True)  # Correct for Pydantic v2

# Only for internal use (not API responses)
class UserInDB(UserOut):
    hashed_password: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)

    @field_validator('new_password')
    def validate_password(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        special_chars = set("@$!%*?&")
        if not any(c in special_chars for c in v):
            raise ValueError("Password must contain at least one special character (@$!%*?&)")
        return v

class Token(BaseModel):
    access_token: str
    token_type: str