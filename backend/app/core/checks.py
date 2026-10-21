"""Verifications de configuration au demarrage : bloque une mise en production mal reglee."""


def verifier_configuration_production(cfg) -> None:
    if cfg.environment != "production":
        return
    cle = cfg.secret_key
    cle = cle.get_secret_value() if hasattr(cle, "get_secret_value") else str(cle or "")
    problemes = []
    if len(cle) < 32:
        problemes.append("SECRET_KEY trop courte (32 caracteres minimum)")
    if "password123" in cfg.database_url:
        problemes.append("DATABASE_URL utilise le mot de passe par defaut")
    if "localhost" in cfg.frontend_url:
        problemes.append("FRONTEND_URL pointe encore vers localhost (CORS)")
    if problemes:
        raise RuntimeError("Configuration de production invalide : " + " ; ".join(problemes))
