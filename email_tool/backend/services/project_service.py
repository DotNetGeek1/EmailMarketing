from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from ..models import Project, Template, LocalizedCopy, MarketingGroup
from typing import Optional, List, Dict, Any

class ProjectService:
    async def create_project(self, db: AsyncSession, name: str, customer_id: Optional[int] = None) -> Project:
        """Create a new project"""
        project = Project(
            name=name,
            customer_id=customer_id
        )
        db.add(project)
        await db.commit()
        await db.refresh(project)
        return project

    async def update_project(self, db: AsyncSession, project_id: int, name: str) -> Project | None:
        """Update project name"""
        project = await db.get(Project, project_id)
        if project:
            project.name = name
            await db.commit()
            await db.refresh(project)
        return project

    async def update_project_status(self, db: AsyncSession, project_id: int, status: str) -> Project | None:
        """Update project status"""
        project = await db.get(Project, project_id)
        if project:
            project.status = status
            await db.commit()
            await db.refresh(project)
        return project

    async def get_project(self, db: AsyncSession, project_id: int) -> Project | None:
        """Get a project by ID"""
        return await db.get(Project, project_id)

    async def get_projects(self, db: AsyncSession, customer_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get all projects with template and copy counts using explicit joins"""
        # Build the base query
        query = select(Project)
        if customer_id is not None:
            query = query.filter(Project.customer_id == customer_id)
        
        # Execute the query to get projects
        result = await db.execute(query)
        projects = result.unique().scalars().all()
        
        # Get counts for each project using separate queries
        project_data = []
        for project in projects:
            # Get template count
            template_count_query = select(func.count(Template.id)).filter(Template.project_id == project.id)
            template_result = await db.execute(template_count_query)
            templates_count = template_result.scalar() or 0
            
            # Get unique locale count
            locale_count_query = select(func.count(func.distinct(LocalizedCopy.locale))).filter(LocalizedCopy.project_id == project.id)
            locale_result = await db.execute(locale_count_query)
            copies_count = locale_result.scalar() or 0
            
            project_data.append({
                'id': project.id,
                'name': project.name,
                'created_at': project.created_at.isoformat(),
                'status': project.status,
                'customer_id': project.customer_id,
                'templates_count': templates_count,
                'languages_count': copies_count
            })
        
        return project_data 