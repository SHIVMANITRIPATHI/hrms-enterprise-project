import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.config import settings

logger = logging.getLogger("hrms.database")

engine = create_async_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    echo=False  # Direct hardcoded False to prevent debug mismatches
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI DB Session Dependency with explicit error rollback."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            await session.rollback()
            logger.error(f"Database transaction error: {str(e)}")
            raise
        finally:
            await session.close()

async def init_db():
    """Initializes schema safely without dropping existing tables."""
    from app.models import Base
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database schema verified/created successfully.")
    except Exception as e:
        logger.warning(f"Could not automatically connect to SQL Server: {str(e)}. Application starting anyway.")
