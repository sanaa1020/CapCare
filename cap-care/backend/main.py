"""
main.py
-------
This is the entry point of the whole backend. Running:

    uvicorn backend.main:app --reload

tells Uvicorn (the web server) to load the `app` object from this file
and start serving it.

What happens here, in order:
1. Import the database engine + Base, and every model, so SQLAlchemy
   knows about all tables.
2. Create the FastAPI `app` instance.
3. Configure CORS so the Flet frontend can call this API.
4. Create all database tables (if they don't already exist).
5. Register routers (currently just Users; more are added in later stages).
6. Define a simple root endpoint so you can quickly check the server is alive.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database.database import engine, Base
from backend.database import models  # noqa: F401  (import ensures models are registered with Base)
from backend.routers import users, profile, timeline, scanner, patterns, news

# Create the FastAPI application instance.
app = FastAPI(
    title="Cap Care API",
    description="Personalized health-awareness and health-record platform backend.",
    version="0.1.0",
)

# CORS (Cross-Origin Resource Sharing): by default, browsers/HTTP clients
# block requests from a different origin (e.g. your Flet app) than the
# server. For a hackathon, we keep this wide open so the frontend can
# talk to the backend without friction. In a production app you'd
# restrict `allow_origins` to specific known addresses.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# This line looks at every model class that inherits from Base
# (currently just User) and creates the matching table in cap_care.db
# if it doesn't already exist. This is what makes the database
# "automatic" -- you never have to run manual SQL to set it up.
Base.metadata.create_all(bind=engine)

# Register the users router. Every endpoint defined in routers/users.py
# (POST /users, GET /users, GET /users/{user_id}) becomes part of this app.
app.include_router(users.router)
app.include_router(profile.router)
app.include_router(timeline.router)
app.include_router(scanner.router)
app.include_router(patterns.router)
app.include_router(news.router)


@app.get("/", tags=["Root"])
def read_root():
    """Simple health check endpoint to confirm the API is running."""
    return {"message": "Cap Care API is running"}
