import os

os.environ["ENVIRONMENT"] = "test"
os.environ["REQUIRE_EMAIL_VERIFICATION"] = "false"
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.database import Base, get_db
from app.main import app

engine = create_engine(settings.test_database_url)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def etudiant_data():
    return {
        "nom": "Etudiant Test",
        "email": "etudiant.test@example.com",
        "mot_de_passe": "motdepasse123",
        "type_profil": "etudiant",
        "consentement": True,
        "consent_version": "2026-09-06",
    }


@pytest.fixture
def entreprise_data():
    return {
        "nom": "Entreprise Test",
        "email": "entreprise.test@example.com",
        "mot_de_passe": "motdepasse123",
        "type_profil": "entreprise",
        "consentement": True,
        "consent_version": "2026-09-06",
    }
