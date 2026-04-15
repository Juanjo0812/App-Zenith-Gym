import asyncio
from sqlalchemy import text
from src.infrastructure.database.base import engine

async def check():
    async with engine.connect() as conn:
        # Check all public tables
        res = await conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"))
        print("=== PUBLIC TABLES ===")
        for row in res:
            print(row[0])

        # Check set_logs columns (for PRs / strength tracking)
        res2 = await conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'set_logs' ORDER BY ordinal_position"))
        print("\n=== set_logs columns ===")
        for row in res2:
            print(f"{row[0]}: {row[1]}")

        # Check workout_sessions columns
        res3 = await conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'workout_sessions' ORDER BY ordinal_position"))
        print("\n=== workout_sessions columns ===")
        for row in res3:
            print(f"{row[0]}: {row[1]}")

        # Check users columns
        res4 = await conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position"))
        print("\n=== users columns ===")
        for row in res4:
            print(f"{row[0]}: {row[1]}")

        # Check if gamification/tracking tables exist
        res5 = await conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_name IN ('weight_logs','body_measurements','badges','challenges','user_badges','user_challenges') AND table_schema = 'public'"))
        rows = list(res5)
        print(f"\n=== gamification/tracking tables ===")
        print(f"Found: {[r[0] for r in rows]}" if rows else "None of these tables exist yet")

asyncio.run(check())
