# Dictionnaire de correspondances competence -> variantes/synonymes.
# Approche V1 (manuelle) en attendant le matching semantique de la V2.
# A enrichir au fur et a mesure des retours utilisateurs.

SKILLS_DICTIONARY: dict[str, list[str]] = {
    "Python": ["python", "py"],
    "JavaScript": ["javascript", "js", "ecmascript"],
    "TypeScript": ["typescript", "ts"],
    "React": ["react", "reactjs", "react.js"],
    "Node.js": ["node.js", "nodejs", "node"],
    "SQL": ["sql", "mysql", "postgresql", "postgres"],
    "FastAPI": ["fastapi"],
    "Django": ["django"],
    "Java": ["java"],
    "C++": ["c++", "cpp"],
    "Excel": ["excel", "tableur"],
    "Gestion de projet": ["gestion de projet", "chef de projet", "project management"],
    "Communication": ["communication", "relationnel"],
    "Marketing digital": ["marketing digital", "marketing numerique", "seo", "sea"],
    "Comptabilite": ["comptabilite", "comptable"],
    "Anglais": ["anglais", "english", "bilingue anglais"],
}


def extract_skills_from_text(text: str) -> list[str]:
    """Detecte les competences connues dans un texte, en tenant compte des synonymes."""
    text_lower = text.lower()
    found_skills = []

    for canonical_name, variants in SKILLS_DICTIONARY.items():
        if any(variant in text_lower for variant in variants):
            found_skills.append(canonical_name)

    return found_skills


def expand_skill(term: str) -> list[str]:
    """Renvoie toutes les variantes connues d'une competence ("js" -> javascript, js, ecmascript).

    Si le terme est inconnu du dictionnaire, il est renvoye tel quel.
    """
    t = term.strip().lower()
    for canonical, variants in SKILLS_DICTIONARY.items():
        if t == canonical.lower() or t in variants:
            return sorted({canonical.lower(), *variants})
    return [t]
