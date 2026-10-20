from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.database import engine  # noqa: F401
from app.core.limiter import limiter
from app.models import (  # noqa: F401
    candidature,
    certification,
    entretien,
    favori,
    message,
    notification,
    offre,
    portfolio,
    profiles,
    user,
)
from app.routers import (
    admin,
    auth,
    candidatures,
    certifications,
    cv,
    entretiens,
    favoris,
    health,
    messages,
    notifications,
    offres,
    talents,
    users,
)
from app.routers import password as password_router
from app.routers import portfolio as portfolio_router
from app.routers import profiles as profiles_router

app = FastAPI(
    title="Talent d'Afrique API",
    description="API du moteur de matching et de la plateforme Talent d'Afrique",
    version="0.1.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(password_router.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(profiles_router.router, prefix="/api/profiles", tags=["profiles"])
app.include_router(cv.router, prefix="/api/profiles", tags=["cv"])
app.include_router(offres.router, prefix="/api/offres", tags=["offres"])
app.include_router(candidatures.router, prefix="/api/candidatures", tags=["candidatures"])
app.include_router(favoris.router, prefix="/api/favoris", tags=["favoris"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["notifications"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(talents.router, prefix="/api/talents", tags=["talents"])
app.include_router(certifications.router, prefix="/api/certifications", tags=["certifications"])
app.include_router(portfolio_router.router, prefix="/api/portfolio", tags=["portfolio"])
app.include_router(entretiens.router, prefix="/api/entretiens", tags=["entretiens"])
app.include_router(messages.router, prefix="/api/messages", tags=["messages"])


@app.get("/")
def root():
    return {"message": "Bienvenue sur l'API Talent d'Afrique"}
