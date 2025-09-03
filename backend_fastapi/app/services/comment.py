from fastapi import HTTPException
from sqlalchemy import select, update, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.comment import Comment
from app.models.post import Post
from app.schemas.comment import CommentOut, CommentBrief
from app.schemas.user import UserOut
from app.services.notification import create_notification
from app.models.notification import Notification
from app.models.reel import Reel


async def create_comment(post_id: int, user_id: int, content: str, parent_id: int = None, db: AsyncSession = None):
    """Create a new comment or reply to a comment."""
    if db is None:
        raise ValueError("Database session is required")

    # Check if post exists
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalars().first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # If it's a reply, check if parent comment exists
    if parent_id:
        result = await db.execute(select(Comment).where(Comment.id == parent_id))
        parent_comment = result.scalars().first()
        if not parent_comment:
            raise HTTPException(status_code=404, detail="Parent comment not found")

    # Create new comment
    new_comment = Comment(
        content=content,
        user_id=user_id,
        post_id=post_id,
        parent_id=parent_id
    )

    db.add(new_comment)
    await db.flush()
    await db.refresh(new_comment)


    # Increment comment_count on the post
    # Only increment for top-level comments (not replies)
    if parent_id is None:
        await db.execute(
            update(Post)
            .where(Post.id == post_id)
            .values(comment_count=Post.comment_count + 1)
        )

    await db.commit()
    await db.refresh(new_comment)

    if post.owner_id != user_id:
        await create_notification(
            user_id=post.owner_id,
            sender_id=user_id,
            notification_type="comment",
            post_id=post_id,
            comment_id=new_comment.id,
            db=db
        )
    # Optionally, notify parent comment owner if it's a reply and not self
    if parent_id and parent_comment.user_id != user_id:
        await create_notification(
            user_id=parent_comment.user_id,
            sender_id=user_id,
            notification_type="comment",
            post_id=post_id,
            comment_id=new_comment.id,
            db=db
        )

    return new_comment


async def get_comments_for_post(post_id: int, skip: int = 0, limit: int = 10, db: AsyncSession = None):
    """Get all top-level comments for a post with pagination."""
    if db is None:
        raise ValueError("Database session is required")

    # Get top-level comments with user relationship loaded
    result = await db.execute(
        select(Comment)
        .where(Comment.post_id == post_id, Comment.parent_id == None)
        .options(selectinload(Comment.user))
        .order_by(Comment.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    comments = result.scalars().all()

    # Get comment IDs
    comment_ids = [comment.id for comment in comments]

    # Get all replies with user relationship loaded
    replies = []
    if comment_ids:
        result = await db.execute(
            select(Comment)
            .where(Comment.parent_id.in_(comment_ids))
            .options(selectinload(Comment.user))
            .order_by(Comment.created_at.asc())
        )
        replies = result.scalars().all()

    # Group replies by parent_id
    replies_by_parent = {}
    for reply in replies:
        if reply.parent_id not in replies_by_parent:
            replies_by_parent[reply.parent_id] = []
        replies_by_parent[reply.parent_id].append(reply)

    # Convert to Pydantic models - EXPLICIT VERSION (recommended)
    comments_out = [
        CommentOut(
            id=comment.id,
            content=comment.content,
            user_id=comment.user_id,
            post_id=comment.post_id,
            reel_id=comment.reel_id,
            parent_id=comment.parent_id,
            created_at=comment.created_at,
            user=UserOut.model_validate(comment.user.__dict__),
            replies=[
                CommentBrief(
                    id=reply.id,
                    content=reply.content,
                    user_id=reply.user_id,
                    post_id=reply.post_id,
                    reel_id=reply.reel_id,
                    parent_id=reply.parent_id,
                    created_at=reply.created_at,
                    user=UserOut.model_validate(reply.user.__dict__)
                )
                for reply in replies_by_parent.get(comment.id, [])
            ]
        )
        for comment in comments
    ]

    return comments_out


async def get_comment_replies(comment_id: int, skip: int = 0, limit: int = 10, db: AsyncSession = None):
    """Get all replies to a specific comment with pagination."""
    if db is None:
        raise ValueError("Database session is required")

    # Get replies for the specific comment
    result = await db.execute(
        select(Comment)
        .where(Comment.parent_id == comment_id)
        .order_by(Comment.created_at.asc())
        .offset(skip)
        .limit(limit)
    )
    replies = result.scalars().all()

    # Get total count
    result = await db.execute(
        select(func.count())
        .where(Comment.parent_id == comment_id)
    )
    total_count = result.scalar()

    return {
        "replies": replies,
        "total": total_count,
        "skip": skip,
        "limit": limit
    }


async def delete_comment(comment_id: int, user_id: int, db: AsyncSession = None):
    """Delete a comment if it belongs to the user or if user_id is None (admin)."""
    if db is None:
        raise ValueError("Database session is required")

    if user_id is None:
        result = await db.execute(select(Comment).where(Comment.id == comment_id))
    else:
        result = await db.execute(select(Comment).where(Comment.id == comment_id, Comment.user_id == user_id))
    comment = result.scalars().first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found or you don't have permission to delete it")

    # Decrement comment_count on the post if it's a top-level comment
    if comment.parent_id is None:
        await db.execute(
            update(Post)
            .where(Post.id == comment.post_id)
            .values(comment_count=Post.comment_count - 1)
        )
    await db.execute(
        delete(Notification).where(Notification.comment_id == comment_id)
    )

    await db.delete(comment)
    await db.commit()
    return {"message": "Comment deleted successfully"}

async def create_reel_comment(reel_id: int, user_id: int, content: str, parent_id: int = None, db: AsyncSession = None):
    if db is None:
        raise ValueError("Database session is required")
    result = await db.execute(select(Reel).where(Reel.id == reel_id))
    reel = result.scalars().first()
    if not reel:
        raise HTTPException(status_code=404, detail="Reel not found")
    if parent_id:
        result = await db.execute(select(Comment).where(Comment.id == parent_id))
        parent_comment = result.scalars().first()
        if not parent_comment:
            raise HTTPException(status_code=404, detail="Parent comment not found")
    new_comment = Comment(content=content, user_id=user_id, reel_id=reel_id, parent_id=parent_id)
    db.add(new_comment)
    reel.comment_count = (reel.comment_count or 0) + 1
    await db.commit()
    await db.refresh(new_comment)

    if reel.owner_id != user_id:
        await create_notification(
            user_id=reel.owner_id,
            sender_id=user_id,
            notification_type="comment",
            reel_id=reel_id,
            comment_id=new_comment.id,
            db=db
        )

    return new_comment


async def reply_to_reel_comment(reel_id: int, parent_id: int, user_id: int, content: str, db: AsyncSession = None):
    if db is None:
        raise ValueError("Database session is required")
    result = await db.execute(select(Reel).where(Reel.id == reel_id))
    reel = result.scalars().first()
    if not reel:
        raise HTTPException(status_code=404, detail="Reel not found")
    result = await db.execute(select(Comment).where(Comment.id == parent_id, Comment.reel_id == reel_id))
    parent_comment = result.scalars().first()
    if not parent_comment:
        raise HTTPException(status_code=404, detail="Parent comment not found")
    new_comment = Comment(content=content, user_id=user_id, reel_id=reel_id, parent_id=parent_id)
    db.add(new_comment)
    await db.commit()
    await db.refresh(new_comment)
        # Optionally, notify parent comment owner if it's a reply and not self
    if parent_id and parent_comment.user_id != user_id:
        await create_notification(
            user_id=parent_comment.user_id,
            sender_id=user_id,
            notification_type="comment",
            reel_id=reel_id,
            comment_id=new_comment.id,
            db=db
        )
    return new_comment

async def get_comments_for_reel(reel_id: int, skip: int = 0, limit: int = 10, db: AsyncSession = None):
    if db is None:
        raise ValueError("Database session is required")
    result = await db.execute(
        select(Comment)
        .where(Comment.reel_id == reel_id, Comment.parent_id == None)
        .order_by(Comment.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    comments = result.scalars().all()
    comment_ids = [comment.id for comment in comments]
    replies = []
    if comment_ids:
        result = await db.execute(
            select(Comment)
            .where(Comment.parent_id.in_(comment_ids))
            .order_by(Comment.created_at.asc())
        )
        replies = result.scalars().all()
    replies_by_parent = {}
    for reply in replies:
        if reply.parent_id not in replies_by_parent:
            replies_by_parent[reply.parent_id] = []
        replies_by_parent[reply.parent_id].append(reply)
    return {
        "comments": comments,
        "replies_by_parent": replies_by_parent
    }

async def get_reel_comment_replies(comment_id: int, skip: int = 0, limit: int = 10, db: AsyncSession = None):
    if db is None:
        raise ValueError("Database session is required")
    result = await db.execute(
        select(Comment)
        .where(Comment.parent_id == comment_id)
        .order_by(Comment.created_at.asc())
        .offset(skip)
        .limit(limit)
    )
    replies = result.scalars().all()
    result = await db.execute(
        select(func.count())
        .where(Comment.parent_id == comment_id)
    )
    total_count = result.scalar()
    return {
        "replies": replies,
        "total": total_count,
        "skip": skip,
        "limit": limit
    }

async def delete_reel_comment(comment_id: int, user_id: int, db: AsyncSession = None):
    if db is None:
        raise ValueError("Database session is required")
    if user_id is None:
        result = await db.execute(select(Comment).where(Comment.id == comment_id))
    else:
        result = await db.execute(select(Comment).where(Comment.id == comment_id, Comment.user_id == user_id))
    comment = result.scalars().first()
    if not comment or not comment.reel_id:
        raise HTTPException(status_code=404, detail="Comment not found or you don't have permission to delete it")
    # Decrement comment_count on the reel if it's a top-level comment
    if comment.parent_id is None:
        result = await db.execute(select(Reel).where(Reel.id == comment.reel_id))
        reel = result.scalars().first()
        if reel:
            reel.comment_count = max((reel.comment_count or 1) - 1, 0)
    await db.execute(delete(Notification).where(Notification.comment_id == comment_id))
    await db.delete(comment)
    await db.commit()
    return {"message": "Comment deleted successfully"}