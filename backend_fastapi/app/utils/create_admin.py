from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.user import User
from app.config import settings
from app.database import async_session_maker
from passlib.context import CryptContext
import asyncio

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin_user():
    retries = 5
    delay = 2 
    
    for attempt in range(retries):
        try:
            async with async_session_maker() as session:
                result = await session.execute(
                    select(User).where(User.email == settings.FIRST_ADMIN_EMAIL)
                )
                admin = result.scalars().first()
                
                if admin:
                    print("Admin user already exists")
                    return
                
                admin_user = User(
                    username=settings.FIRST_ADMIN_USERNAME,
                    email=settings.FIRST_ADMIN_EMAIL,
                    full_name="Admin",
                    hashed_password=pwd_context.hash(settings.FIRST_ADMIN_PASSWORD),
                    is_admin=True,
                    is_active=True
                )
                session.add(admin_user)
                await session.commit()
                print("Admin user created successfully!")
                return
                
        except Exception as e:
            print(f"Attempt {attempt + 1} failed: {e}")
            if attempt < retries - 1:
                await asyncio.sleep(delay)
            else:
                print("Failed to create admin user after several attempts")