"""
database.py
------------
This file sets up the connection between our FastAPI app and the SQLite
database file (cap_care.db).

Three important pieces live here:

1. `engine`   -> the actual connection to the SQLite file on disk.
2. `SessionLocal` -> a factory that creates a new "conversation" (session)
                     with the database each time we need one (e.g. per request).
3. `Base`     -> the class that all our SQLAlchemy models (tables) will
                     inherit from, so SQLAlchemy knows about them.

Nothing in this file talks about users, allergies, or events -- it is
purely plumbing. That's intentional: it keeps database *connection* logic
separate from database *table definitions* (models.py) and business logic
(services/).
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# The database file will be created in the project's working directory
# (wherever you run `uvicorn` from) as cap_care.db.
SQLALCHEMY_DATABASE_URL = "sqlite:///./cap_care.db"

# `connect_args={"check_same_thread": False}` is required for SQLite
# specifically, because SQLite by default only allows one thread to talk
# to it. FastAPI can handle multiple requests concurrently, so we relax
# this restriction. SQLAlchemy's session management still keeps things safe.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

# SessionLocal is a "session factory". Every time we call SessionLocal(),
# we get a brand new database session (a temporary workspace for
# queries/inserts/updates that we can commit or roll back).
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base is the parent class every SQLAlchemy model must inherit from.
# When we call Base.metadata.create_all(bind=engine) in main.py, SQLAlchemy
# looks at every class that inherits from Base and creates a matching
# table in the database if it doesn't already exist.
Base = declarative_base()


def get_db():
    """
    This is a FastAPI "dependency". Any router function that needs
    database access will declare a parameter like:

        def some_endpoint(db: Session = Depends(get_db)):

    FastAPI will call this generator function, hand the router the
    `db` session, and then -- no matter what happens (success or error)
    -- make sure the session is closed afterward. This prevents
    connection leaks.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
