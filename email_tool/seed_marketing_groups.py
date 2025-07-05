#!/usr/bin/env python3
"""
Script to seed the database with predefined marketing group types.
Run this script from the email_tool directory.
"""

import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.data_access.seed_marketing_group_types import seed_marketing_group_types

async def main():
    """Main function to run the seeding script"""
    try:
        await seed_marketing_group_types()
        print("\n✅ Marketing group types seeding completed successfully!")
    except Exception as e:
        print(f"\n❌ Error seeding marketing group types: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main()) 