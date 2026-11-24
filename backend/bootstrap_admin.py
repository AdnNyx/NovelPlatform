"""
Bootstrap script to create or promote the initial Admin user.
Usage:
    python backend/bootstrap_admin.py --email admin@example.com --username admin --name "Super Admin" --password StrongPassword123!
"""

import argparse
import asyncio
import sys
import uuid

sys.path.insert(0, "backend")

from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from sqlalchemy import select


async def create_or_promote_admin(email: str, username: str, name: str, password: str):
    async with AsyncSessionLocal() as db:
        stmt = select(User).where((User.email == email) | (User.username == username))
        existing_user = (await db.execute(stmt)).scalar_one_or_none()

        if existing_user:
            print(f"User found ({existing_user.email}). Promoting to admin...")
            existing_user.role = "admin"
            existing_user.is_active = True
            existing_user.failed_login_attempts = 0
            existing_user.locked_until = None
            if password:
                existing_user.password_hash = get_password_hash(password)
            await db.commit()
            print(f"SUCCESS: User '{existing_user.username}' is now an active 'admin'.")
        else:
            print(f"Creating new admin user: {email}...")
            admin_user = User(
                id=uuid.uuid4(),
                username=username,
                email=email,
                display_name=name,
                password_hash=get_password_hash(password),
                role="admin",
                is_active=True,
                failed_login_attempts=0,
            )
            db.add(admin_user)
            await db.commit()
            print(f"SUCCESS: Created admin user '{username}' ({email}).")


def main():
    parser = argparse.ArgumentParser(description="Create or promote initial Admin user")
    parser.add_argument("--email", required=True, help="Admin email address")
    parser.add_argument("--username", required=True, help="Admin username")
    parser.add_argument("--name", default="Super Admin", help="Admin display name")
    parser.add_argument("--password", required=True, help="Admin password (min 8 chars)")

    args = parser.parse_args()

    if len(args.password) < 8:
        print("Error: Password must be at least 8 characters long.")
        sys.exit(1)

    asyncio.run(
        create_or_promote_admin(
            email=args.email.strip().lower(),
            username=args.username.strip().lower(),
            name=args.name.strip(),
            password=args.password,
        )
    )


if __name__ == "__main__":
    main()
