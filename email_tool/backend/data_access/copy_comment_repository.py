from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from ..models.copy_comment import CopyComment

class CopyCommentRepository:
    async def get_by_copy(self, db: AsyncSession, copy_id: int):
        result = await db.execute(select(CopyComment).where(CopyComment.copy_id == copy_id))
        return result.scalars().all()

    async def get(self, db: AsyncSession, comment_id: int):
        result = await db.execute(select(CopyComment).where(CopyComment.id == comment_id))
        return result.scalar_one_or_none()

    async def create(self, db: AsyncSession, comment: CopyComment):
        db.add(comment)
        await db.commit()
        await db.refresh(comment)
        return comment

    async def delete(self, db: AsyncSession, comment_id: int):
        await db.execute(delete(CopyComment).where(CopyComment.id == comment_id))
        await db.commit() 