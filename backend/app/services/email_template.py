"""Gabarit commun des e-mails TIBA : logo, couleurs de la marque, composants."""

from datetime import datetime
from html import escape

from app.core.config import settings

BLEU = "#1565D8"
MARINE = "#0A3D8F"
OR = "#F7941D"
TEXTE = "#0E1A2E"
MUET = "#5F7090"
FOND = "#EEF3FB"
LIGNE = "#D9E2EF"
POLICE = "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
TAGLINE = "Talents africains &middot; Recrutement"

STYLE = (
    "@media only screen and (max-width:620px){"
    ".px{padding-left:20px!important;padding-right:20px!important}"
    ".tag{display:none!important}"
    ".digit{width:40px!important;height:52px!important;font-size:26px!important}"
    "}"
)


def _site() -> str:
    return settings.frontend_url.rstrip("/")


def logo_url() -> str:
    return f"{_site()}/icons/icon-192.png"


def titre(texte: str, sous: str = "") -> str:
    suite = (
        f'<p style="margin:8px 0 0;color:{MUET};font-size:15px">{escape(sous)}</p>' if sous else ""
    )
    return (
        f'<h1 style="margin:0;font-size:25px;line-height:1.25;color:{MARINE};font-weight:800;'
        f'font-family:{POLICE}">{escape(texte)}</h1>{suite}'
        '<div style="height:20px;line-height:20px;font-size:0">&nbsp;</div>'
    )


def badge(texte: str, couleur: str = OR) -> str:
    return (
        f'<span style="display:inline-block;background:{couleur};color:#ffffff;font-size:11px;'
        "font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:5px 12px;"
        f'border-radius:999px;font-family:{POLICE}">{escape(texte)}</span>'
    )


def bouton(url: str, texte: str) -> str:
    return (
        '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0"><tr>'
        f'<td bgcolor="{BLEU}" style="border-radius:12px;background:linear-gradient(135deg,{MARINE},{BLEU})">'
        f'<a href="{url}" style="display:inline-block;padding:15px 30px;color:#ffffff;'
        f'font-weight:700;font-size:15px;text-decoration:none;font-family:{POLICE}">{escape(texte)} &rarr;</a>'
        "</td></tr></table>"
    )


def bloc_code(code: str) -> str:
    cases = []
    for i, c in enumerate(code):
        if i:
            cases.append('<td width="8" style="width:8px;font-size:0">&nbsp;</td>')
        cases.append(
            f'<td class="digit" align="center" width="48" height="60" bgcolor="{FOND}" '
            f'style="width:48px;height:60px;background:{FOND};border:2px solid {BLEU};border-radius:12px;'
            f"font-size:30px;font-weight:800;color:{MARINE};font-family:Consolas,Menlo,monospace\">{escape(c)}</td>"
        )
    return (
        '<table role="presentation" cellpadding="0" cellspacing="0" align="center" '
        f'style="margin:22px auto"><tr>{"".join(cases)}</tr></table>'
    )


def infos(lignes) -> str:
    """Fiche d'informations : liste de (libelle, valeur) ; les valeurs vides sont ignorees."""
    rows = ""
    for label, valeur in lignes:
        if not valeur:
            continue
        rows += (
            f'<tr><td style="padding:9px 16px 9px 0;color:{MUET};font-size:13px;vertical-align:top;'
            f'white-space:nowrap;font-family:{POLICE}">{escape(label)}</td>'
            f'<td style="padding:9px 0;color:{TEXTE};font-size:15px;font-weight:700;'
            f'font-family:{POLICE}">{escape(str(valeur))}</td></tr>'
        )
    return (
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" '
        f'style="margin:6px 0 4px"><tr><td bgcolor="{OR}" width="4" style="width:4px;background:{OR};'
        'border-radius:4px">&nbsp;</td>'
        f'<td bgcolor="{FOND}" style="background:{FOND};border-radius:0 12px 12px 0;padding:10px 20px">'
        f'<table role="presentation" cellpadding="0" cellspacing="0">{rows}</table></td></tr></table>'
    )


def alerte(texte_html: str, couleur: str = BLEU) -> str:
    return (
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0">'
        f'<tr><td style="border-left:4px solid {couleur};background:{FOND};border-radius:0 10px 10px 0;'
        f'padding:12px 16px;color:{TEXTE};font-size:14px;line-height:1.55;font-family:{POLICE}">'
        f"{texte_html}</td></tr></table>"
    )


def habiller_email(contenu: str, sujet: str = "", preheader: str = "") -> str:
    site = _site()
    pre = escape(preheader or sujet)
    return (
        '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        '<meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only">'
        f"<title>{escape(sujet)}</title><style>{STYLE}</style></head>"
        f'<body style="margin:0;padding:0;background:{FOND};font-family:{POLICE}">'
        f'<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:{FOND}">{pre}'
        "&zwnj;&nbsp;" * 40 + "</div>"
        f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="{FOND}">'
        '<tr><td align="center" style="padding:30px 14px">'
        '<table role="presentation" width="600" cellpadding="0" cellspacing="0" '
        'style="width:100%;max-width:600px">'
        # en-tete
        f'<tr><td class="px" bgcolor="{MARINE}" style="background:linear-gradient(135deg,{MARINE} 0%,{BLEU} 100%);'
        'border-radius:20px 20px 0 0;padding:26px 32px">'
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>'
        '<td width="68" style="width:68px"><table role="presentation" cellpadding="0" cellspacing="0"><tr>'
        '<td style="background:#ffffff;border-radius:16px;padding:7px">'
        f'<img src="{logo_url()}" width="50" height="50" alt="TIBA" '
        'style="display:block;border:0;border-radius:10px"></td></tr></table></td>'
        f'<td style="padding-left:6px;color:#ffffff;font-size:27px;font-weight:800;letter-spacing:2px;'
        f'font-family:{POLICE}">TIBA</td>'
        f'<td class="tag" align="right" style="color:#cfe0ff;font-size:12px;letter-spacing:.4px;'
        f'font-family:{POLICE}">{TAGLINE}</td>'
        "</tr></table></td></tr>"
        f'<tr><td bgcolor="{OR}" height="5" style="height:5px;line-height:5px;font-size:0">&nbsp;</td></tr>'
        # contenu
        f'<tr><td class="px" bgcolor="#ffffff" style="background:#ffffff;padding:36px 32px 30px;color:{TEXTE};'
        f"font-size:15px;line-height:1.7;font-family:{POLICE};border-left:1px solid {LIGNE};"
        f'border-right:1px solid {LIGNE}">{contenu}</td></tr>'
        # pied de la carte
        f'<tr><td class="px" bgcolor="#ffffff" style="background:#ffffff;border:1px solid {LIGNE};border-top:0;'
        f'border-radius:0 0 20px 20px;padding:0 32px 24px;font-family:{POLICE}">'
        f'<div style="border-top:1px solid {LIGNE};padding-top:18px;color:{MUET};font-size:12px;line-height:1.6">'
        "Message automatique envoy&eacute; par TIBA, merci de ne pas y r&eacute;pondre.<br>"
        f'<a href="{site}/cgu" style="color:{BLEU};text-decoration:none">Conditions</a> &nbsp;&middot;&nbsp; '
        f'<a href="{site}/confidentialite" style="color:{BLEU};text-decoration:none">Confidentialit&eacute;</a>'
        f" &nbsp;&middot;&nbsp; "
        f'<a href="{site}" style="color:{BLEU};text-decoration:none">{escape(site.replace("https://", ""))}</a>'
        "</div></td></tr>"
        f'<tr><td align="center" style="padding:18px 0 0;color:#8a99b3;font-size:11px;font-family:{POLICE}">'
        f"&copy; {datetime.now().year} TIBA &mdash; Tous droits r&eacute;serv&eacute;s</td></tr>"
        "</table></td></tr></table></body></html>"
    )