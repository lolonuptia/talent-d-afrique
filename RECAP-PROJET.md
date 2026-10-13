# TALENT D'AFRIQUE / TIBA : récapitulatif du projet

*Mis à jour le 12/10/2026. Objectif : savoir en un coup d'oeil où on en est, ce qui manque et par quoi continuer.*

---

## 1. Décisions en attente (bloquantes pour certaines étapes)

| # | Question | Impact |
|---|---|---|
| 1 | **Nom** : TIBA (Talent Insertion Business Afrique) ou Talent d'Afrique ? | Titre de l'API, package Android `com.talentdafrique.app`, expéditeur des emails Resend, frontend |
| 2 | **Profils** : garder étudiant, école, freelance, entreprise, ou passer à « talent » + entreprise ? | L'espace école et les missions freelance existent déjà et sont testés |
| 3 | **Couleurs** : bleu, blanc, vert (TIBA) à la place de vert forêt + terracotta (mobile actuel) ? | `Color.kt` (mobile), CSS du web, logo |
| 4 | **Langues** : français, anglais, espagnol + une quatrième (arabe, portugais, wolof, autre) ? | Mise en place de l'i18n |
| 5 | « Planifier les entretiens » : bonne lecture du texte d'origine ? | Fonctionnalité entretiens |
| 6 | **Recherche de talents** : profil visible par toute entreprise, ou visibilité au choix du talent (recommandé, RGPD) ? | Un champ + une migration si option 2 |
| 7 | **Priorité client** : web ou mobile en premier ? | Ordre des écrans |

---

## 2. Architecture

| Partie | Technologie | Dossier |
|---|---|---|
| Backend | Python 3.12, FastAPI, SQLAlchemy, Alembic, PostgreSQL 16 | `backend/` |
| Frontend web | React, Vite, TypeScript, Tailwind, React Query, axios | `frontend/` |
| Mobile | Android, Kotlin, Jetpack Compose, Hilt, Retrofit | `mobile/` |
| Scripts | PowerShell | `scripts/` |

Environnement Python : **`backend\.venv`** (le dossier `backend\venv` est un ancien environnement, à ne pas utiliser). Node 24 et npm 11 installés.

---

## 3. État du backend (vérifié)

**Fait et testé (15 tests sur 15 passent) :**
- Authentification : inscription, connexion, refresh, déconnexion, `/me` (cookies httpOnly ou jeton Bearer), limitation anti-bruteforce
- Compte : modifier, supprimer (suppression logique), exporter ses données (RGPD)
- Profils : étudiant, entreprise, école, freelance (`/api/profiles/me`)
- CV : dépôt PDF et analyse automatique (OCR en secours)
- Offres : création, liste publique, « mes offres », modification, suppression, contrôle de propriété
- Candidatures : dépôt, suivi côté candidat, liste et classement par score côté entreprise, changement de statut
- Matching V1 : score pondéré avec détail par critère, recommandations (`/offres/recommandees`), TJM pour les missions
- Espace école : rattachement, suggestions, statistiques d'employabilité
- Notifications : in-app (liste, marquer comme lue) et email via Resend, pour 2 événements (candidature reçue, changement de statut)
- **Favoris** (nouveau) : `POST /api/favoris`, `GET /api/favoris`, `DELETE /api/favoris/{offre_id}`, réservés aux étudiants et freelances. Migration `cee3448cb8c3` appliquée, 2 tests
- **Admin** : liste des comptes, suspension, réactivation, suppression d'offres avec motif, journal des actions, statistiques globales (9 totaux)
- **`is_admin`** (nouveau) renvoyé dans `UserOut`, pour que web et mobile reconnaissent un admin
- **`GET /api/admin/statistiques/detail`** (nouveau) : inscriptions par mois, entreprises par secteur, candidatures par offre, taux de recrutement, offres par localisation

**Comptes de test** (mot de passe `password`) : `admin@tiba.com` (admin, profil entreprise), `etudiant@tiba.com`, `freelance@tiba.com`, `entreprise@tiba.com`, `ecole@tiba.com`. Le compte `user@example.com` est un résidu de test Swagger.

---

## 4. Ce qui manque, par rapport au cahier TIBA

### Espace talent
| Fonction | Backend | Web | Mobile |
|---|---|---|---|
| Compte, connexion | Fait | Fait | Fait |
| Profil professionnel | Fait | Page vide | Fait |
| CV (dépôt, analyse) | Fait | Aucun écran | Aucun écran |
| Portfolio | Seulement `portfolio_url` (freelance) | Non | Non |
| Compétences | Texte libre + dictionnaire (~15) | Non | Non |
| Certifications | **Absent** | Non | Non |
| Trouver emploi ou stage | Fait | Aucune page | Fait |
| Candidatures et statut | Fait | Aucune page | Fait |
| Favoris | Fait | Absent | Absent |
| Recommandations | Fait | Non | À confirmer |
| Formations et événements | **Absent** | Absent | Absent |
| Messagerie | **Absente** | Absente | Absente |
| Notifications | Fait (2 événements) | Absentes | Fait |
| Paramètres du compte | Fait | Aucun écran | Aucun écran |

### Espace entreprise
| Fonction | Backend | Web | Mobile |
|---|---|---|---|
| Profil entreprise | Fait | Aucun écran | Aucun écran |
| Publier et gérer les offres | Fait | Aucun écran | Aucun écran |
| Consulter les candidatures (classées) | Fait | Aucun écran | Aucun écran |
| Rechercher des talents | **Absent** | Absent | Absent |
| Consulter CV et portfolios | **Absent** | Absent | Absent |
| Planifier les entretiens | **Absent** (seul le statut `entretien` existe) | Absent | Absent |
| Messagerie | **Absente** | Absente | Absente |

### Espace admin (statistiques)
| Indicateur | État |
|---|---|
| Inscriptions par mois | Fait (`statistiques/detail`) |
| Entreprises par secteur | Fait |
| Candidatures par offre | Fait |
| Taux de recrutement | Fait |
| Offres par pays | Partiel : par `localisation` (texte libre), pas de champ pays |
| Talents par domaine | **Absent** : aucun champ « domaine » |
| Profils complets | **Absent** : règle de « complet » à définir |
| Utilisateurs actifs | **Absent** : pas de champ dernière connexion |
| Écrans admin (web et mobile) | **Absents** : le backend seul existe |

### Transversal
- **Langues** : aucune infrastructure de traduction (web, mobile, API)
- **Identité** : pas de logo (seulement `favicon.svg` et l'icône Android par défaut), nom et couleurs à trancher
- Notification « nouvelle offre qui correspond à votre profil » : non codée
- **Frontend web** : 11 pages dont 4 dashboards de 15 lignes (coquilles vides) ; seuls Connexion et Inscription appellent l'API
- **Mobile** : application étudiant uniquement (accueil, offres, détail, candidatures, notifications, profil)

---

## 5. Dette technique et risques

1. `RECAP` et scripts : `dev.ps1` et `check.ps1` pointent maintenant vers `.venv` ; `test-matching.ps1`, `test-filtres.ps1`, `test-ecole.ps1`, `test-freelance.ps1` cités auparavant n'existent plus dans `scripts/`
2. Tesseract et Poppler non installés : les CV scannés échoueront (les PDF avec texte passent)
3. `pgvector` dans `requirements.txt` mais pas dans PostgreSQL (inutile avant le matching V2)
4. `react-email` côté frontend fait doublon avec Resend côté backend
5. L'expéditeur des emails est codé en dur (`notifications@talentdafrique.com`) ; l'envoi réel n'est pas vérifié
6. Le refresh token ne peut pas être révoqué ; le limiteur anti-spam est en mémoire (Redis nécessaire en production)
7. La purge définitive des comptes supprimés après 30 jours n'est pas automatisée
8. Stockage des CV en local (`backend/storage/`, ignoré par git) : à migrer vers un stockage cloud avant la production
9. `COMMANDES.txt` contient le mot de passe PostgreSQL local : ignoré par git, ne pas le publier
10. Warnings `datetime.utcnow()` et `class Config` (Pydantic) à moderniser
11. Fichiers modifiés non commités : le dépôt n'a pas de commit depuis les lots de cette session

---

## 6. Plan proposé, du plus simple au plus long

**Étape A : décisions** (section 1) et mise à jour de ce récap.

**Étape B : backend**, dans cet ordre
1. Recherche de talents (`GET /api/talents`, filtres compétence, disponibilité, TJM max ; entreprises seulement ; sans email)
2. Visibilité du profil au choix du talent (si option 2) + consultation CV et portfolio
3. Certifications et portfolio (modèles et routes)
4. Entretiens (planification liée à une candidature, notification)
5. Messagerie (candidat et entreprise, par candidature)
6. Formations et événements (catalogue géré par l'admin)
7. Statistiques admin manquantes (domaine, utilisateurs actifs, profils complets)
8. Notification « nouvelle offre correspondante »

**Étape C : un client à la fois** (web ou mobile) : écrans talent, entreprise, admin.

**Étape D : identité et langues** : nom, logo, couleurs, i18n.

**Étape E : avant la production** : points 6 à 8 de la section 5, tests supplémentaires, commits propres.

---

## 7. Reprendre rapidement

```powershell
# Base PostgreSQL (si besoin)
Start-Service postgresql-x64-16

# Backend
cd C:\BLTN\Lolo\talent-afrique\backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# Docs : http://localhost:8000/docs

# Frontend
cd C:\BLTN\Lolo\talent-afrique\frontend
npm run dev
# http://localhost:5173

# Tests et qualité
cd C:\BLTN\Lolo\talent-afrique\backend
.\.venv\Scripts\python.exe -m pytest -q -W ignore
.\.venv\Scripts\python.exe -m ruff check app
```

**Méthode pour chaque nouveau modèle** : (1) créer le modèle dans `app/models/`, (2) l'ajouter à l'import de `app/main.py` **et** de `alembic/env.py`, (3) créer le schéma, (4) créer les routes et les brancher dans `main.py`, (5) générer la migration, corriger l'import de `GUID` à la main (`from app.core.types import GUID`, retirer le préfixe `app.core.types.`), relire avant `alembic upgrade head`, (6) ajouter des tests.

**Pièges connus** : ajouter une valeur à un Enum PostgreSQL n'est pas détecté par Alembic (ajouter `op.execute("ALTER TYPE ... ADD VALUE ...")`) ; `EmailStr` refuse les domaines réservés comme `.test` ; dans PowerShell, `H` est un alias de `Get-History` ; les tests avec deux utilisateurs doivent vider les cookies (`client.cookies.clear()`) car le cookie prime sur l'en-tête Authorization.

# TALENT D'AFRIQUE / TIBA : récapitulatif du projet

*Mis à jour le 13/10/2026. Objectif : savoir en un coup d'oeil où on en est, ce qui manque et par quoi continuer.*

---

## 1. Décisions

### Tranchée
| # | Question | Décision |
|---|---|---|
| 6 | Recherche de talents : visibilité | **Option 2 retenue** : le talent choisit (`visible_aux_entreprises`, `false` par défaut). RGPD respecté. |

### En attente
| # | Question | Impact |
|---|---|---|
| 1 | **Nom** : TIBA ou Talent d'Afrique ? | Titre de l'API, package Android, expéditeur Resend, frontend |
| 2 | **Profils** : garder étudiant, école, freelance, entreprise, ou « talent » + entreprise ? | Espace école et missions freelance existent déjà et sont testés |
| 3 | **Couleurs** : bleu, blanc, vert (TIBA) ou vert forêt + terracotta (mobile actuel) ? | `Color.kt`, CSS web, logo |
| 4 | **Langues** : français, anglais, espagnol + une quatrième ? | Mise en place de l'i18n |
| 5 | « Planifier les entretiens » : bonne lecture du texte d'origine ? | Implémenté côté backend (voir 3), à valider |
| 7 | **Priorité client** : web ou mobile en premier ? | Ordre des écrans |

---

## 2. Architecture

| Partie | Technologie | Dossier |
|---|---|---|
| Backend | Python 3.12, FastAPI, SQLAlchemy, Alembic, PostgreSQL 16 | `backend/` |
| Frontend web | React, Vite, TypeScript, Tailwind, React Query, axios | `frontend/` |
| Mobile | Android, Kotlin, Jetpack Compose, Hilt, Retrofit | `mobile/` |
| Scripts | PowerShell | `scripts/` |

Environnement Python : **`backend\.venv`** (`backend\venv` est un ancien environnement : ne pas l'utiliser, même si l'ancien récap backend le mentionne).

---

## 3. État du backend (36 tests sur 36 passent, Ruff propre)

**Déjà en place avant le 13/10** : authentification (cookies httpOnly ou Bearer, anti-bruteforce), compte (modifier, supprimer logiquement, export RGPD), 4 profils, CV (PDF + OCR de secours), offres, candidatures, matching V1 (TJM pour les missions), espace école, notifications in-app et email Resend (candidature reçue, changement de statut), favoris, admin (comptes, offres, journal, statistiques, `statistiques/detail`), `is_admin` dans `UserOut`.

**Ajouté le 13/10/2026**

| Fonction | Routes | Remarques |
|---|---|---|
| Recherche de talents | `GET /api/talents` | Entreprises seulement. Filtres : `competence` (répétable, toutes requises), `disponibilite`, `tjm_max`, `type_profil`, `limit`, `offset`. Jamais d'email. |
| Visibilité du profil | champ `visible_aux_entreprises` via `PUT /api/profiles/me` | Étudiant et freelance. Migration `94a857098fc1`. |
| Synonymes de compétences | `expand_skill()` dans `skills_dictionary.py` | « js » trouve « JavaScript », mais « java » ne trouve pas « JavaScript » (mot entier, regex PostgreSQL `~*`). |
| Détail d'un talent | `GET /api/talents/{profile_id}` | Profil + certifications + portfolio, uniquement si visible (sinon 404). |
| Certifications | `POST/GET/DELETE /api/certifications` | Étudiants et freelances. Lien de vérification optionnel, pas de PDF. |
| Portfolio | `POST/GET/DELETE /api/portfolio` | Étudiants et freelances. |
| Entretiens | `POST/GET/PATCH /api/entretiens` | Entreprise propriétaire planifie, modifie, annule. Talent : lecture de ses entretiens. La candidature passe à `entretien`. Notifications `entretien_planifie`, `entretien_modifie`, `entretien_annule`. Dates en UTC, refusées si passées. Filtre `statut`. |

**Nouveaux fichiers** : `models/{certification,portfolio,entretien}.py`, `schemas/{talent,certification,portfolio,entretien}.py`, `routers/{talents,certifications,portfolio,entretiens}.py`, tests `test_talents.py`, `test_certifications_portfolio.py`, `test_entretiens.py`, script `scripts/test-talents.ps1`.

**Comptes de test** (mot de passe `password`) : `admin@tiba.com`, `etudiant@tiba.com`, `freelance@tiba.com`, `entreprise@tiba.com`, `ecole@tiba.com`. `user@example.com` est un résidu de test Swagger.

**À vérifier** : `alembic current` doit afficher un identifiant postérieur à `a142428defbb` (migration `entretiens`). Si c'est encore `a142428defbb`, la table n'existe pas dans la vraie base (pytest crée ses propres tables et ne le prouve pas).

---

## 4. Ce qui manque, par rapport au cahier TIBA

### Espace talent
| Fonction | Backend | Web | Mobile |
|---|---|---|---|
| Compte, connexion | Fait | Fait | Fait |
| Profil professionnel | Fait | Page vide | Fait |
| CV (dépôt, analyse) | Fait | Aucun écran | Aucun écran |
| Portfolio | **Fait** | Non | Non |
| Compétences | Texte libre + dictionnaire (~15) | Non | Non |
| Certifications | **Fait** | Non | Non |
| Visibilité du profil | **Fait** | Non | Non |
| Trouver emploi ou stage | Fait | Aucune page | Fait |
| Candidatures et statut | Fait | Aucune page | Fait |
| Entretiens (lecture) | **Fait** | Non | Non |
| Favoris | Fait | Absent | Absent |
| Recommandations | Fait | Non | À confirmer |
| Formations et événements | **Absent** | Absent | Absent |
| Messagerie | **Absente** | Absente | Absente |
| Notifications | Fait (candidature, statut, entretiens) | Absentes | Fait |
| Paramètres du compte | Fait | Aucun écran | Aucun écran |

### Espace entreprise
| Fonction | Backend | Web | Mobile |
|---|---|---|---|
| Profil entreprise | Fait | Aucun écran | Aucun écran |
| Publier et gérer les offres | Fait | Aucun écran | Aucun écran |
| Consulter les candidatures (classées) | Fait | Aucun écran | Aucun écran |
| Rechercher des talents | **Fait** | Absent | Absent |
| Consulter portfolios et certifications | **Fait** | Absent | Absent |
| Consulter le CV d'un talent | **Absent** (le CV n'est pas dans le détail talent) | Absent | Absent |
| Planifier les entretiens | **Fait** | Absent | Absent |
| Messagerie | **Absente** | Absente | Absente |

### Espace admin
Statistiques : inscriptions par mois, entreprises par secteur, candidatures par offre, taux de recrutement faits. Manquent : offres par pays (pas de champ pays), talents par domaine (pas de champ domaine), profils complets (règle à définir), utilisateurs actifs (pas de dernière connexion). **Écrans admin web et mobile : absents.**

### Transversal
- **Langues** : aucune infrastructure de traduction.
- **Identité** : pas de logo, nom et couleurs à trancher.
- Notification « nouvelle offre qui correspond à votre profil » : non codée.
- **Frontend web** : 11 pages dont 4 coquilles vides ; seuls Connexion et Inscription appellent l'API.
- **Mobile** : application étudiant uniquement.

---

## 5. Dette technique et risques

1. Les scripts `test-matching.ps1`, `test-filtres.ps1`, `test-ecole.ps1`, `test-freelance.ps1` n'existent plus dans `scripts/`. Seul `test-talents.ps1` a été ajouté.
2. Tesseract et Poppler non installés : les CV scannés échoueront.
3. `pgvector` dans `requirements.txt` mais pas dans PostgreSQL (inutile avant le matching V2).
4. `react-email` côté frontend fait doublon avec Resend.
5. Expéditeur des emails codé en dur ; envoi réel non vérifié.
6. Refresh token non révocable ; limiteur anti-spam en mémoire (Redis en production).
7. Purge définitive des comptes supprimés après 30 jours non automatisée.
8. CV en stockage local (`backend/storage/`) : à migrer vers le cloud avant la production.
9. `COMMANDES.txt` contient le mot de passe PostgreSQL local : ne pas le publier.
10. Warnings `datetime.utcnow()` et `class Config` (Pydantic) à moderniser.
11. **Aucun commit depuis plusieurs lots, dont tout le travail du 13/10.** Git n'a pas d'identité : `git config user.name "..."` et `git config user.email "..."` (dans le dépôt), puis commit.
12. **`PUT /api/profiles/me` accepte une union de 4 schémas** : Pydantic choisit le meilleur, ce qui marche aujourd'hui mais peut se tromper si les champs sont ambigus. À fiabiliser en choisissant le schéma selon `current_user.type_profil`.
13. Recherche de compétences sur texte libre séparé par virgules : limitée au dictionnaire d'une quinzaine de compétences pour les synonymes.
14. `services/notifications.py` : les accents s'affichent cassés (`Ã©`) dans PowerShell. À contrôler avec `Get-Content ... -Encoding UTF8` : si c'est aussi cassé dans le fichier, les notifications existantes contiennent du texte corrompu.
15. Certifications sans fichier joint (lien seulement) ; les entretiens n'ont pas de rappel automatique ni de détection de conflit d'horaire.

---

## 6. Plan, du plus simple au plus long

**Étape A : commit** (point 11) et décisions de la section 1.

**Étape B : backend**
1. ~~Recherche de talents~~ fait
2. ~~Visibilité du profil~~ fait ; reste : consultation du **CV** par les entreprises
3. ~~Certifications et portfolio~~ fait
4. ~~Entretiens~~ fait
5. **Messagerie** (par candidature, avec notification) : prochaine étape
6. Formations et événements (catalogue géré par l'admin)
7. Statistiques admin manquantes (domaine, utilisateurs actifs, profils complets)
8. Notification « nouvelle offre correspondante »

**Étape C : un client à la fois** (web ou mobile) : écrans talent, entreprise, admin.

**Étape D : identité et langues** : nom, logo, couleurs, i18n.

**Étape E : avant la production** : points 6 à 8 et 12 de la section 5, commits propres.

---

## 7. Reprendre rapidement

```powershell
# Base PostgreSQL (si besoin)
Start-Service postgresql-x64-16

# Backend
cd C:\BLTN\Lolo\talent-afrique\backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# Docs : http://localhost:8000/docs

# Frontend
cd C:\BLTN\Lolo\talent-afrique\frontend
npm run dev
# http://localhost:5173

# Tests et qualité
cd C:\BLTN\Lolo\talent-afrique\backend
python -m pytest -q -W ignore
python -m ruff check app tests
alembic current
```

**Méthode pour chaque nouveau modèle** : (1) créer le modèle dans `app/models/`, (2) l'ajouter à l'import de `app/main.py` **et** de `alembic/env.py`, (3) créer le schéma, (4) créer les routes et les brancher dans `main.py`, (5) générer la migration, corriger l'import de `GUID` (`from app.core.types import GUID`, retirer le préfixe `app.core.types.`), **relire avant `alembic upgrade head`**, (6) ajouter des tests.

---

## 8. Pièges connus

- **Login** : `POST /api/auth/login` attend `email` et `mot_de_passe` (pas `password`). L'inscription demande aussi `consentement` et `consent_version`.
- **PowerShell et chemins** : `[IO.File]::ReadAllText` résout les chemins relatifs depuis `C:\BLTN` et non depuis le dossier courant. Utiliser `Resolve-Path`, ou fixer `[Environment]::CurrentDirectory = (Get-Location).Path`. Une fonction d'édition qui n'échoue pas bruyamment peut afficher « OK » sans rien modifier : toujours vérifier avec `Select-String`.
- **Fins de ligne Windows** : une ancre de remplacement avec `\n` ne trouve rien dans un fichier en `\r\n`. Normaliser l'ancre avant de chercher.
- **Migration vide** : Alembic génère `pass` si le modèle n'est pas importé dans `alembic/env.py`, et l'applique sans erreur. Si cela arrive : `alembic downgrade -1`, supprimer le fichier, corriger l'import, régénérer.
- **Import `GUID`** manquant dans chaque migration auto-générée avec UUID (voir méthode).
- **Enum PostgreSQL** : ajouter une valeur n'est pas détecté par Alembic (`op.execute("ALTER TYPE ... ADD VALUE ...")`).
- **Conflit de noms dans `main.py`** : un modèle et un routeur portant le même nom (`portfolio`) s'écrasent. Importer le routeur sous un alias (`portfolio_router`).
- **Tests avec plusieurs utilisateurs** : vider les cookies (`client.cookies.clear()`) car le cookie prime sur l'en-tête Authorization. Les tests se connectent chacun avec leur `_login` local, sans fixture partagée pour freelance.
- **`conftest.py`** : crée et détruit toutes les tables à chaque test (`settings.test_database_url`), donc pytest ne prouve pas qu'une migration est appliquée sur la vraie base.
- `EmailStr` refuse les domaines réservés comme `.test` ; dans PowerShell, `H` est un alias de `Get-History`.
- **Ruff** : limite de 100 caractères (E501) ; la règle `B008` est désactivée volontairement (faux positif FastAPI) ; ne pas réinstaller `passlib`.



