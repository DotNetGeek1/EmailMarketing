from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from ..models.customer import Customer

class CustomerRepository:
    async def get_all(self, db: AsyncSession):
        result = await db.execute(select(Customer))
        return result.scalars().all()

    async def get(self, db: AsyncSession, customer_id: int):
        result = await db.execute(select(Customer).where(Customer.id == customer_id))
        return result.scalar_one_or_none()

    async def create(self, db: AsyncSession, customer: Customer):
        db.add(customer)
        await db.commit()
        await db.refresh(customer)
        return customer

    async def delete(self, db: AsyncSession, customer_id: int):
        await db.execute(delete(Customer).where(Customer.id == customer_id))
        await db.commit() 