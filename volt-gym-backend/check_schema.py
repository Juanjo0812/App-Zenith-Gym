import asyncio
from sqlalchemy import text
from src.infrastructure.database.base import engine

async def check():
    async with engine.connect() as conn:
        print("--- meals_logged schema ---")
        res = await conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'meals_logged';"))
        for row in res:
            print(f"{row[0]}: {row[1]}")
            
        print("\n--- meal_plans schema ---")
        res2 = await conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'meal_plans';"))
        for row in res2:
            print(f"{row[0]}: {row[1]}")

        print("\n--- water_logs exists? ---")
        res3 = await conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_name = 'water_logs';"))
        print(f"water_logs rows: {list(res3)}")

asyncio.run(check())
