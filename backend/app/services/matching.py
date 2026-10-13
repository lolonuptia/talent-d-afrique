from app.core.matching_config import (
    POIDS_COMPETENCES_OBLIGATOIRES,
    POIDS_COMPETENCES_SOUHAITEES,
    POIDS_DISPONIBILITE,
    POIDS_EXPERIENCE,
    POIDS_SOFT_SKILLS,
    SEUIL_RECOMMANDATION,
)
from app.core.skills_dictionary import extract_skills_from_text


def _texte_vers_ensemble_competences(texte: str | None) -> set[str]:
    """Convertit un texte libre (ex: 'Python, React, SQL') en un ensemble de
    competences normalisees, en reutilisant le dictionnaire de synonymes."""
    if not texte:
        return set()
    detectees = set(extract_skills_from_text(texte))
    termes_bruts = {t.strip() for t in texte.split(",") if t.strip()}
    return detectees | termes_bruts


def _score_couverture(requis: set[str], possede: set[str]) -> float:
    """Retourne le pourcentage (0-100) de l'ensemble 'requis' couvert par 'possede'.
    Renvoie 100 si rien n'est requis (rien a satisfaire)."""
    if not requis:
        return 100.0
    intersection = {r for r in requis if any(r.lower() == p.lower() for p in possede)}
    return (len(intersection) / len(requis)) * 100


def _score_disponibilite(candidat_dispo: str | None, offre_dispo: str | None) -> float:
    if not offre_dispo:
        return 100.0
    if not candidat_dispo:
        return 0.0
    return 100.0 if candidat_dispo.strip().lower() == offre_dispo.strip().lower() else 0.0


def _score_experience(candidat_annees: int | None, offre_niveau: str | None) -> float:
    """Heuristique simple pour la V1 : compare un nombre d'annees d'experience
    a un niveau demande exprime en texte libre. A affiner en V2 avec le NLP."""
    if not offre_niveau:
        return 100.0
    if candidat_annees is None:
        return 50.0

    niveau = offre_niveau.lower()
    if "debutant" in niveau or "junior" in niveau:
        return 100.0 if candidat_annees <= 2 else 70.0
    if "senior" in niveau:
        return 100.0 if candidat_annees >= 5 else 40.0
    return 80.0


def _score_tjm(candidat_tjm: float | None, offre_budget_tjm: float | None) -> float:
    """Compare le TJM du freelance au budget de la mission.
    Score maximal si le TJM du freelance rentre dans le budget, decroissant au-dela."""
    if not offre_budget_tjm:
        return 100.0
    if candidat_tjm is None:
        return 50.0
    if candidat_tjm <= offre_budget_tjm:
        return 100.0
    depassement = (candidat_tjm - offre_budget_tjm) / offre_budget_tjm
    return max(0.0, 100.0 - depassement * 100)


def calculer_score_matching(
    *,
    candidat_competences: str | None,
    candidat_disponibilite: str | None,
    candidat_annees_experience: int | None,
    candidat_tjm: float | None = None,
    offre_competences_obligatoires: str | None,
    offre_competences_souhaitees: str | None,
    offre_soft_skills: str | None,
    offre_disponibilite: str | None,
    offre_niveau_experience: str | None,
    offre_type_contrat: str | None = None,
    offre_budget_tjm: float | None = None,
) -> dict:
    """Calcule le score de compatibilite candidat/offre selon la ponderation V1.
    Retourne le score global (0-100) et le detail par critere, pour la
    transparence demandee dans le cahier des charges (section 3 : 'pourquoi ce score').

    Si un critere n'a aucun signal fiable (ex : un etudiant n'a pas de nombre
    d'annees d'experience saisi), il est exclu du calcul du score global plutot
    que de peser avec une valeur neutre par defaut - cela evite de diluer le
    score avec un critere non mesure. Le detail reste toutefois affiche pour
    la transparence, avec le score neutre qu'il aurait eu."""

    competences_candidat = _texte_vers_ensemble_competences(candidat_competences)

    est_mission = offre_type_contrat == "mission"
    experience_score = (
        _score_tjm(candidat_tjm, offre_budget_tjm)
        if est_mission
        else _score_experience(candidat_annees_experience, offre_niveau_experience)
    )
    # Signal fiable si : mission (le TJM est toujours renseigne ou neutre a 100),
    # ou si le candidat a bien un nombre d'annees d'experience saisi.
    experience_fiable = est_mission or candidat_annees_experience is not None

    detail = {
        "competences_obligatoires": _score_couverture(
            _texte_vers_ensemble_competences(offre_competences_obligatoires),
            competences_candidat,
        ),
        "competences_souhaitees": _score_couverture(
            _texte_vers_ensemble_competences(offre_competences_souhaitees),
            competences_candidat,
        ),
        "experience": experience_score,
        "disponibilite": _score_disponibilite(candidat_disponibilite, offre_disponibilite),
        "soft_skills": _score_couverture(
            _texte_vers_ensemble_competences(offre_soft_skills), competences_candidat
        ),
    }

    poids = {
        "competences_obligatoires": POIDS_COMPETENCES_OBLIGATOIRES,
        "competences_souhaitees": POIDS_COMPETENCES_SOUHAITEES,
        "experience": POIDS_EXPERIENCE if experience_fiable else 0,
        "disponibilite": POIDS_DISPONIBILITE,
        "soft_skills": POIDS_SOFT_SKILLS,
    }
    poids_total = sum(poids.values()) or 1  # evite une division par zero (cas limite improbable)

    # Moyenne ponderee : diviser par poids_total (et non 100 en dur) permet de
    # renormaliser automatiquement quand un critere est exclu du calcul.
    score_global = sum(detail[k] * poids[k] for k in detail) / poids_total

    return {
        "score_global": round(score_global, 1),
        "detail": {k: round(v, 1) for k, v in detail.items()},
        "recommandee": score_global >= SEUIL_RECOMMANDATION,
    }
