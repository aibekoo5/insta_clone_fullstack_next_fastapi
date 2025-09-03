import os
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Body
from sqlalchemy.ext.asyncio import AsyncSession
from passlib.context import CryptContext
from sqlalchemy import select
from app.models.user import User
from app.schemas.user import UserOut
from app.services.auth import get_current_active_user
from app.database import get_async_session
from sqlalchemy import func
from app.models.follow import Follow

router = APIRouter(prefix="/profile", tags=["Profile"])

# Configure file storage
PROFILE_PICTURES_PATH = Path("static/uploads/profile_pictures")
PROFILE_PICTURES_PATH.mkdir(parents=True, exist_ok=True)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def save_profile_picture(file: UploadFile) -> str:
    """Save profile picture to local storage and return the file path"""
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail="Uploaded file must be an image"
            )

        # Generate unique filename
        file_ext = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = PROFILE_PICTURES_PATH / unique_filename

        # Save the file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        return str(file_path)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Could not save profile picture: {e}"
        )


@router.get("/me", response_model=UserOut)
async def get_my_profile(current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_async_session)):
    followers_count = await db.scalar(select(func.count()).select_from(Follow).where(Follow.following_id == current_user.id))
    following_count = await db.scalar(select(func.count()).select_from(Follow).where(Follow.follower_id == current_user.id))
    user_out = UserOut.from_orm(current_user)
    user_out.followers_count = followers_count
    user_out.following_count = following_count
    user_out.is_followed_by_current_user = True # For /me endpoint, user is always "followed" by themselves (or this logic might mean something else)
    # Ensure profile_picture is a web path if it exists
    if current_user.profile_picture and not current_user.profile_picture.startswith(("/", "http://", "https://")):
        parts = Path(current_user.profile_picture).parts
        if len(parts) >= 3:
            user_out.profile_picture = "/" + "/".join(parts[-3:])
        else:
            user_out.profile_picture = None # Or handle as an error/default
    elif current_user.profile_picture:
        user_out.profile_picture = current_user.profile_picture.replace("\\", "/")

    return user_out


@router.get("/{username}", response_model=UserOut)
async def get_user_by_username(
    username: str,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(
        select(User).where(User.username == username)
    )
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    followers_count = await db.scalar(select(func.count()).select_from(Follow).where(Follow.following_id == user.id))
    following_count = await db.scalar(select(func.count()).select_from(Follow).where(Follow.follower_id == user.id))
    is_followed_by_current_user = False
    if current_user:
        is_followed_by_current_user = await db.scalar(
            select(func.count()).select_from(Follow).where(
                Follow.follower_id == current_user.id,
                Follow.following_id == user.id
            )
        ) > 0
    user_out = UserOut.from_orm(user)
    user_out.followers_count = followers_count
    user_out.following_count = following_count
    user_out.is_followed_by_current_user = is_followed_by_current_user
    # Ensure profile_picture is a web path if it exists
    if user.profile_picture and not user.profile_picture.startswith(("/", "http://", "https://")):
        parts = Path(user.profile_picture).parts
        if len(parts) >= 3:
            user_out.profile_picture = "/" + "/".join(parts[-3:])
        else:
            user_out.profile_picture = None
    elif user.profile_picture:
        user_out.profile_picture = user.profile_picture.replace("\\", "/")

    return user_out

@router.put("/{user_id}", response_model=UserOut)
async def edit_my_profile(
        username: str = Form(None),
        email: str = Form(None),
        full_name: str = Form(None),
        bio: str = Form(None),
        profile_picture: UploadFile = File(None),
        current_user: User = Depends(get_current_active_user),
        db: AsyncSession = Depends(get_async_session)
):
    # Handle profile picture upload
    if profile_picture is not None and profile_picture.filename:
        # Delete old profile picture if exists
        # Important: os.path.exists expects a file system path, not a URL
        old_picture_system_path = None
        if current_user.profile_picture:
            if current_user.profile_picture.startswith("/static/"):
                old_picture_system_path = Path(current_user.profile_picture[1:]) # Remove leading '/' to make it relative to project root
            else:
                # If it's an old system path, use it directly (less likely with new changes)
                old_picture_system_path = Path(current_user.profile_picture)
        
        if old_picture_system_path and old_picture_system_path.exists():
            try:
                os.remove(old_picture_system_path)
            except OSError as e:
                print(f"Error deleting old profile picture: {e}") # Log error
                pass

        # Save new profile picture (this now returns a web path)
        picture_web_path = await save_profile_picture(profile_picture)
        current_user.profile_picture = picture_web_path # Store the web path

    await db.commit()
    await db.refresh(current_user)
    
    # Construct UserOut ensuring the profile_picture is a web path
    user_response = UserOut.from_orm(current_user)
    if current_user.profile_picture and not current_user.profile_picture.startswith(("/", "http://", "https://")):
        parts = Path(current_user.profile_picture).parts
        if len(parts) >= 3:
            user_response.profile_picture = "/" + "/".join(parts[-3:])
        else:
            user_response.profile_picture = None
    elif current_user.profile_picture:
        user_response.profile_picture = current_user.profile_picture.replace("\\", "/")

    # Recalculate counts for the response as they might not be on current_user directly after refresh
    followers_count = await db.scalar(select(func.count()).select_from(Follow).where(Follow.following_id == current_user.id))
    following_count = await db.scalar(select(func.count()).select_from(Follow).where(Follow.follower_id == current_user.id))
    user_response.followers_count = followers_count
    user_response.following_count = following_count
    user_response.is_followed_by_current_user = True # For /me endpoint

    return user_response


@router.put("/change-password")
async def change_password(
        old_password: str = Body(...),
        new_password: str = Body(...),
        current_user: User = Depends(get_current_active_user),
        db: AsyncSession = Depends(get_async_session)
):
    # Verify old password
    if not pwd_context.verify(old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Old password is incorrect")

    # Hash new password and update
    current_user.hashed_password = pwd_context.hash(new_password)
    await db.commit()
    await db.refresh(current_user)
    return {"detail": "Password changed successfully"}