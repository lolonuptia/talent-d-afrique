from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.checks import verifier_configuration_production
from app.core.config import settings
from app.core.database import engine
from app.core.limiter import limiter
from app.core.migrations_legeres import appliquer_migrations_legeres
from app.models import (  # noqa: F401
    candidature,
    certification,
    entretien,
    mission,
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
    missions,
    notifications,
    offres,
    talents,
    users,
)
from app.routers import password as password_router
from app.routers import verification_code as verification_code_router
from app.routers import portfolio as portfolio_router
from app.routers import profiles as profiles_router
from app.routers.admin_plus import router as admin_plus_router
from app.routers.admin_validation import router as admin_validation_router

verifier_configuration_production(settings)

if settings.environment != "test":
    try:
        appliquer_migrations_legeres(engine)
    except Exception as exc:  # noqa: BLE001
        print(f"[MIGRATION] ignoree : {exc}")

app = FastAPI(
    title="TIBA API",
    description="API du moteur de matching et de la plateforme TIBA",
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

from fastapi import Depends as _Depends
from app.core.deps import exiger_entreprise_validee, exiger_etudiant_verifie

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(password_router.router, prefix="/api/auth", tags=["auth"])
app.include_router(verification_code_router.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(profiles_router.router, prefix="/api/profiles", tags=["profiles"], dependencies=[_Depends(exiger_etudiant_verifie)])
app.include_router(cv.router, prefix="/api/profiles", tags=["cv"], dependencies=[_Depends(exiger_entreprise_validee)])
app.include_router(offres.router, prefix="/api/offres", tags=["offres"])
app.include_router(candidatures.router, prefix="/api/candidatures", tags=["candidatures"], dependencies=[_Depends(exiger_entreprise_validee)])
app.include_router(favoris.router, prefix="/api/favoris", tags=["favoris"], dependencies=[_Depends(exiger_entreprise_validee)])
app.include_router(notifications.router, prefix="/api/notifications", tags=["notifications"], dependencies=[_Depends(exiger_entreprise_validee)])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(admin_validation_router, prefix="/api/admin", tags=["admin"])
app.include_router(admin_plus_router, prefix="/api/admin", tags=["admin"])
app.include_router(talents.router, prefix="/api/talents", tags=["talents"])
app.include_router(certifications.router, prefix="/api/certifications", tags=["certifications"], dependencies=[_Depends(exiger_entreprise_validee)])
app.include_router(portfolio_router.router, prefix="/api/portfolio", tags=["portfolio"], dependencies=[_Depends(exiger_entreprise_validee)])
app.include_router(entretiens.router, prefix="/api/entretiens", tags=["entretiens"], dependencies=[_Depends(exiger_entreprise_validee)])
app.include_router(messages.router, prefix="/api/messages", tags=["messages"], dependencies=[_Depends(exiger_entreprise_validee)])
app.include_router(missions.router, prefix="/api/missions", tags=["missions"], dependencies=[_Depends(exiger_entreprise_validee)])


@app.get("/")
def root():
    return {"message": "Bienvenue sur l'API TIBA"}
