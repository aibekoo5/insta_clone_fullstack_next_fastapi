from app.models.comment import Comment
from app.schemas.notification import NotificationOut
from app.schemas.reel import ReelOut
from app.schemas.comment import CommentOut, CommentBrief
from app.schemas.user import UserOut
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from sqlalchemy.orm import selectinload
from typing import Optional
from app.models.notification import Notification
from app.models.post import Post
from app.models.reel import Reel
from app.schemas.post import PostOut



async def create_notification(
    user_id: int,
    sender_id: int,
    notification_type: str,
    post_id: Optional[int] = None,
    reel_id: Optional[int] = None,
    comment_id: Optional[int] = None,
    db: AsyncSession = None
):
    valid_types = ['like', 'comment', 'follow']
    if notification_type not in valid_types:
        raise HTTPException(status_code=400, detail="Invalid notification type")

    new_notification = Notification(
        user_id=user_id,
        sender_id=sender_id,
        notification_type=notification_type,
        post_id=post_id,
        reel_id=reel_id,
        comment_id=comment_id
    )

    db.add(new_notification)
    await db.commit()
    await db.refresh(new_notification)
    return new_notification


async def get_user_notifications(
    user_id: int, skip: int, limit: int, db: AsyncSession
) -> list[NotificationOut]:
    result = await db.execute(
        select(Notification)
        .options(
            selectinload(Notification.sender),
            selectinload(Notification.post).selectinload(Post.owner),
            selectinload(Notification.reel).selectinload(Reel.owner),
            selectinload(Notification.comment).selectinload(Comment.user)  # Matches SQLAlchemy
        )
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    notifications = result.scalars().all()

    notifications_out = []
    for notification in notifications:
        comment_out = None
        if notification.comment:
            comment_out = CommentBrief.model_validate({
                **notification.comment.__dict__,
                "user": UserOut.model_validate(notification.comment.user.__dict__)
            })
        # Convert sender
        sender_out = UserOut.model_validate(notification.sender.__dict__)

        # Convert post with owner
        post_out = None
        if notification.post:
            post_out = PostOut.model_validate({
                **notification.post.__dict__,
                "owner": UserOut.model_validate(notification.post.owner.__dict__)
            })

        # Convert reel with owner
        reel_out = None
        if notification.reel:
            reel_out = ReelOut.model_validate({
                **notification.reel.__dict__,
                "owner": UserOut.model_validate(notification.reel.owner.__dict__)
            })

        # Convert comment with user
        comment_out = None
        if notification.comment:
            comment_out = CommentOut.model_validate({
                **notification.comment.__dict__,
                "owner": UserOut.model_validate(notification.comment.user.__dict__)
            })

        notifications_out.append(NotificationOut(
            id=notification.id,
            user_id=notification.user_id,
            sender_id=notification.sender_id,
            notification_type=notification.notification_type,
            is_read=notification.is_read,
            created_at=notification.created_at,
            sender=sender_out,
            post=post_out,
            reel=reel_out,
            comment=comment_out,
            post_id=notification.post_id,
            reel_id=notification.reel_id,
            comment_id=notification.comment_id
        ))

    return notifications_out
    

async def mark_notification_as_read(notification_id: int, user_id: int, db: AsyncSession = None):
    result = await db.execute(
        select(Notification).where(Notification.id == notification_id, Notification.user_id == user_id)
    )
    notification = result.scalars().first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    notification.is_read = True
    await db.commit()
    await db.refresh(notification)
    return notification


async def mark_all_notifications_as_read(user_id: int, db: AsyncSession = None):
    result = await db.execute(
        update(Notification)
        .where(Notification.user_id == user_id, Notification.is_read == False)
        .values(is_read=True)
        .execution_options(synchronize_session="fetch")
    )
    await db.commit()
    return {"message": f"Marked {result.rowcount} notifications as read"}

async def get_unread_notification_count(user_id: int, db: AsyncSession = None):
    result = await db.execute(
        select(func.count()).select_from(Notification).where(
            Notification.user_id == user_id,
            Notification.is_read == False
        )
    )
    count = result.scalar()
    return {"unread_count": count}