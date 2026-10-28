import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.candidature import Candidature
from app.models.mission import Mission, MissionJalon, MissionNote
from app.models.offre import Offre
from app.models.user import User
from app.routers.entretiens import _notifier, _profil_entreprise, _verifier_propriete
from app.schemas.mission import (
    JalonCreate,
    JalonOut,
    JalonUpdate,
    MissionCreate,
    MissionOut,
    MissionUpdate,
    NoteCreate,
    NoteOut,
)

router = APIRouter()

LIBELLES = {
    "en_pause": "a ete mise en pause",
    "terminee": "est terminee",
    "annulee": "a ete annulee",
    "en_cours": "a repris",
}


def _out(m: Mission) -> MissionOut:
    c = m.candidature
    return MissionOut(
        id=m.id,
        candidature_id=m.candidature_id,
        titre=m.titre,
        description=m.description,
        date_debut=m.date_debut,
        date_fin=m.date_fin,
        avancement=m.avancement,
        statut=m.statut,
        created_at=m.created_at,
        updated_at=m.updated_at,
        candidat_nom=c.candidat.nom,
        offre_titre=c.offre.titre,
        jalons=[JalonOut.model_validate(j) for j in m.jalons],
        notes=[NoteOut.model_validate(n) for n in m.notes],
    )


def _verifier_dates(debut: date | None, fin: date | None) -> None:
    if debut and fin and fin < debut:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La date de fin doit suivre la date de debut.",
        )


def _charger(db: Session, mission_id: uuid.UUID, current_user: User) -> Mission:
    profil = _profil_entreprise(current_user, db)
    m = db.query(Mission).filter(Mission.id == mission_id).first()
    if m is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mission introuvable.")
    _verifier_propriete(m.candidature, profil)
    return m


def _recalculer(db: Session, m: Mission) -> None:
    """Avancement = part de jalons termines (seulement s'il y a des jalons)."""
    db.refresh(m)
    total = len(m.jalons)
    if total:
        m.avancement = round(100 * sum(1 for j in m.jalons if j.fait) / total)
    db.commit()
    db.refresh(m)


@router.post("", response_model=MissionOut, status_code=status.HTTP_201_CREATED)
def creer_mission(
    payload: MissionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profil = _profil_entreprise(current_user, db)
    cand = db.query(Candidature).filter(Candidature.id == payload.candidature_id).first()
    if cand is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidature introuvable.")
    _verifier_propriete(cand, profil)
    if cand.statut != "acceptee":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La candidature doit etre acceptee pour creer une mission.",
        )
    _verifier_dates(payload.date_debut, payload.date_fin)

    m = Mission(
        id=uuid.uuid4(),
        candidature_id=cand.id,
        titre=payload.titre.strip(),
        description=payload.description,
        date_debut=payload.date_debut,
        date_fin=payload.date_fin,
        avancement=0,
        statut="en_cours",
    )
    db.add(m)
    db.flush()
    titres = [t.strip()[:200] for t in payload.jalons if t and t.strip()]
    for i, t in enumerate(titres):
        db.add(MissionJalon(id=uuid.uuid4(), mission_id=m.id, titre=t, position=i, fait=False))
    db.commit()
    db.refresh(m)

    _notifier(
        db,
        cand.candidat,
        "Nouvelle mission",
        f"Une mission « {m.titre} » a ete creee pour l'offre {cand.offre.titre}.",
        "statut_change",
    )
    return _out(m)


@router.get("", response_model=list[MissionOut])
def lister_missions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Entreprise : missions de ses offres. Talent : ses propres missions (lecture)."""
    q = db.query(Mission).join(Candidature, Candidature.id == Mission.candidature_id)
    if current_user.type_profil == "entreprise":
        profil = _profil_entreprise(current_user, db)
        q = q.join(Offre, Offre.id == Candidature.offre_id).filter(
            Offre.entreprise_id == profil.id
        )
    elif current_user.type_profil in ("etudiant", "freelance"):
        q = q.filter(Candidature.candidat_id == current_user.id)
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Reserve aux entreprises, etudiants et freelances.",
        )
    return [_out(m) for m in q.order_by(Mission.created_at.desc()).all()]


@router.patch("/{mission_id}", response_model=MissionOut)
def modifier_mission(
    mission_id: uuid.UUID,
    payload: MissionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    m = _charger(db, mission_id, current_user)
    data = payload.model_dump(exclude_unset=True)
    for k in ("titre", "statut", "avancement"):
        if k in data and data[k] is None:
            data.pop(k)
    if "titre" in data:
        data["titre"] = data["titre"].strip()
        if len(data["titre"]) < 2:
            raise HTTPException(status_code=400, detail="Titre trop court.")
    _verifier_dates(data.get("date_debut", m.date_debut), data.get("date_fin", m.date_fin))
    if data.get("statut") == "terminee" and "avancement" not in data:
        data["avancement"] = 100

    ancien = m.statut
    for k, v in data.items():
        setattr(m, k, v)
    db.commit()
    db.refresh(m)

    if m.statut != ancien:
        _notifier(
            db,
            m.candidature.candidat,
            "Mission mise a jour",
            f"La mission « {m.titre} » {LIBELLES.get(m.statut, m.statut)}.",
            "statut_change",
        )
    return _out(m)


@router.delete("/{mission_id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer_mission(
    mission_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    m = _charger(db, mission_id, current_user)
    db.delete(m)
    db.commit()


@router.post("/{mission_id}/jalons", response_model=MissionOut, status_code=status.HTTP_201_CREATED)
def ajouter_jalon(
    mission_id: uuid.UUID,
    payload: JalonCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    m = _charger(db, mission_id, current_user)
    db.add(
        MissionJalon(
            id=uuid.uuid4(),
            mission_id=m.id,
            titre=payload.titre.strip(),
            date_prevue=payload.date_prevue,
            position=len(m.jalons),
            fait=False,
        )
    )
    db.commit()
    _recalculer(db, m)
    return _out(m)


def _charger_jalon(db: Session, jalon_id: uuid.UUID, current_user: User) -> MissionJalon:
    profil = _profil_entreprise(current_user, db)
    j = db.query(MissionJalon).filter(MissionJalon.id == jalon_id).first()
    if j is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Jalon introuvable.")
    _verifier_propriete(j.mission.candidature, profil)
    return j


@router.patch("/jalons/{jalon_id}", response_model=MissionOut)
def modifier_jalon(
    jalon_id: uuid.UUID,
    payload: JalonUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    j = _charger_jalon(db, jalon_id, current_user)
    for k, v in payload.model_dump(exclude_unset=True).items():
        if v is None and k != "date_prevue":
            continue
        setattr(j, k, v)
    db.commit()
    m = j.mission
    _recalculer(db, m)
    return _out(m)


@router.delete("/jalons/{jalon_id}", response_model=MissionOut)
def supprimer_jalon(
    jalon_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    j = _charger_jalon(db, jalon_id, current_user)
    m = j.mission
    db.delete(j)
    db.commit()
    _recalculer(db, m)
    return _out(m)


@router.post("/{mission_id}/notes", response_model=MissionOut, status_code=status.HTTP_201_CREATED)
def ajouter_note(
    mission_id: uuid.UUID,
    payload: NoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    m = _charger(db, mission_id, current_user)
    db.add(
        MissionNote(
            id=uuid.uuid4(),
            mission_id=m.id,
            contenu=payload.contenu.strip(),
            avancement=m.avancement,
        )
    )
    db.commit()
    db.refresh(m)
    return _out(m)