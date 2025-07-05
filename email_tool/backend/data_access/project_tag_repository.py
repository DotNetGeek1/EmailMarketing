from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from ..models.project_tag import project_tags

class ProjectTagRepository:
    async def add_tag_to_project(self, db: AsyncSession, project_id: int, tag_id: int) -> bool:
        """Add a tag to a project"""
        try:
            await db.execute(
                project_tags.insert().values(project_id=project_id, tag_id=tag_id)
            )
            await db.commit()
            return True
        except Exception:
            await db.rollback()
            return False

    async def remove_tag_from_project(self, db: AsyncSession, project_id: int, tag_id: int) -> bool:
        """Remove a tag from a project"""
        try:
            await db.execute(
                project_tags.delete().where(
                    project_tags.c.project_id == project_id,
                    project_tags.c.tag_id == tag_id
                )
            )
            await db.commit()
            return True
        except Exception:
            await db.rollback()
            return False

    async def get_project_tags(self, db: AsyncSession, project_id: int):
        """Get all tags for a project"""
        result = await db.execute(
            select(project_tags.c.tag_id).where(project_tags.c.project_id == project_id)
        )
        return result.scalars().all()

    async def get_tag_projects(self, db: AsyncSession, tag_id: int):
        """Get all projects for a tag"""
        result = await db.execute(
            select(project_tags.c.project_id).where(project_tags.c.tag_id == tag_id)
        )
        return result.scalars().all() 