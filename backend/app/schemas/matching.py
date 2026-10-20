from app.schemas.candidature import CandidatureOut
from app.schemas.offre import OffreOut


class OffreAvecScore(OffreOut):
    score_global: float
    recommandee: bool
    detail_score: dict


class CandidatureAvecScore(CandidatureOut):
    score_global: float
    recommandee: bool
    detail_score: dict
    candidat_nom: str | None = None
