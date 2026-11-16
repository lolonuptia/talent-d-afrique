"""Gabarit d'e-mail TIBA (charte bleu/orange). Tableaux + couleurs explicites partout.
Le preheader est un simple texte masque, ferme immediatement : aucune imbrication."""

import re
from datetime import datetime
from html import escape, unescape

from app.core.config import settings

BLEU = "#1565D8"
BLEU_FONCE = "#0A3D8F"
ORANGE = "#F7941D"
ENCRE = "#0E1A2E"
GRIS = "#5F7090"
FOND = "#EEF3FB"
BORD = "#D9E2EF"
CLAIR = "#EAF1FD"
BLANC = "#FFFFFF"
APP = "https://app.tiba.help"
LOGO = APP + "/icons/icon-192.png"
POLICE = "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
MONO = "Consolas,Menlo,Courier,monospace"

STYLE = (
    "<style>@media only screen and (max-width:620px){"
    ".px{padding-left:20px!important;padding-right:20px!important}"
    ".tag{display:none!important}"
    ".digit{width:40px!important;height:52px!important;font-size:26px!important}}</style>"
)


def _site() -> str:
    return settings.frontend_url.rstrip("/")


def titre(texte: str, sous: str = "") -> str:
    suite = (
        f'<p style="margin:0 0 18px;font-size:15px;color:{GRIS}">{escape(sous)}</p>' if sous else ""
    )
    return (
        f'<h2 style="margin:0 0 6px;font-size:22px;line-height:1.3;color:{ENCRE}">{escape(texte)}</h2>'
        f"{suite}"
    )


def badge(texte: str, couleur: str = "") -> str:
    return (
        f'<span style="display:inline-block;padding:3px 10px;border-radius:12px;background:{CLAIR};'
        f'color:{BLEU};font-size:12px;font-weight:bold">{escape(texte)}</span>'
    )


def bouton(url: str, texte: str) -> str:
    u = escape(url)
    return (
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 12px">'
        f'<tr><td bgcolor="{BLEU}" style="background:{BLEU};border-radius:10px">'
        f'<a href="{u}" style="display:inline-block;padding:14px 30px;font-size:16px;font-weight:bold;'
        f'color:{BLANC};text-decoration:none">{escape(texte)}</a></td></tr></table>'
        f'<p style="margin:0 0 6px;font-size:12px;color:{GRIS}">Si le bouton ne fonctionne pas, '
        f'copiez ce lien dans votre navigateur :<br><a href="{u}" style="color:{BLEU};'
        f'word-break:break-all">{u}</a></p>'
    )


def bloc_code(code: str) -> str:
    cellules = [
        f'<td class="digit" align="center" width="48" height="60" bgcolor="{CLAIR}" '
        f'style="width:48px;height:60px;background:{CLAIR};border:2px solid {BLEU};border-radius:10px;'
        f'font-family:{MONO};font-size:30px;font-weight:bold;color:{BLEU_FONCE}">{escape(c)}</td>'
        for c in code
    ]
    sep = '<td width="6" style="width:6px;font-size:0;line-height:0">&nbsp;</td>'
    return (
        '<table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" '
        f'style="margin:24px auto"><tr>{sep.join(cellules)}</tr></table>'
    )


def infos(lignes) -> str:
    rows = ""
    for label, valeur in lignes:
        if valeur:
            rows += (
                f'<tr><td style="padding:6px 14px 6px 0;font-size:14px;color:{GRIS};vertical-align:top">'
                f"{escape(label)}</td>"
                f'<td style="padding:6px 0;font-size:14px;font-weight:bold;color:{ENCRE};'
                f'vertical-align:top">{escape(str(valeur))}</td></tr>'
            )
    if not rows:
        return ""
    return (
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" '
        f'style="margin:12px 0">{rows}</table>'
    )


def alerte(texte_html: str, couleur: str = "") -> str:
    return (
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" '
        'style="margin:18px 0"><tr>'
        f'<td bgcolor="#FFF4E0" style="background:#FFF4E0;border-left:4px solid {ORANGE};'
        f'border-radius:6px;padding:12px 14px;font-size:14px;line-height:1.5;color:#5A3A00">'
        f"{texte_html}</td></tr></table>"
    )


def _normaliser(html: str) -> str:
    html = re.sub(r"<p style=([\"'])", lambda m: f"<p style={m.group(1)}color:{ENCRE};", html)
    html = re.sub(r"<p>", f'<p style="margin:0 0 14px;color:{ENCRE}">', html)
    html = re.sub(r"<a (?![^>]*style=)", f'<a style="color:{BLEU};font-weight:bold" ', html)
    return html


def html_vers_texte(html: str) -> str:
    """Version texte brut (secours). Ignore le preheader masque."""
    t = re.sub(r'(?is)<div style="display:none[^"]*">.*?</div>', "", html)
    t = re.sub(r"(?is)<(script|style|head).*?</\1>", "", t)
    t = re.sub(
        r'(?is)<a [^>]*href="([^"]*)"[^>]*>(.*?)</a>',
        lambda m: f"{re.sub('<[^>]+>', '', m.group(2)).strip()} : {unescape(m.group(1))}",
        t,
    )
    t = re.sub(r"(?i)<br\s*/?>|</p>|</h2>|</tr>|</div>", "\n", t)
    t = re.sub(r"(?i)</td>", " ", t)
    t = re.sub(r"<[^>]+>", "", t)
    t = unescape(t)
    t = re.sub(r"[ \t]+\n", "\n", t)
    t = re.sub(r"\n{3,}", "\n\n", t)
    return t.strip()


def habiller_email(contenu: str, sujet: str = "", preheader: str = "") -> str:
    # deja un document complet : on ne l'enveloppe pas une seconde fois
    if contenu.lstrip()[:15].upper().startswith("<!DOCTYPE"):
        return contenu

    f = POLICE
    pre_texte = escape((preheader or sujet).strip())
    pre = (
        f'<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:{FOND}">'
        f"{pre_texte}&zwnj;&nbsp;</div>"
    )
    annee = datetime.now().year
    return (
        '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        '<meta name="color-scheme" content="light only">'
        '<meta name="supported-color-schemes" content="light only">'
        f"<title>{escape(sujet)}</title>{STYLE}</head>"
        f'<body bgcolor="{FOND}" style="margin:0;padding:0;background:{FOND};font-family:{f}">'
        f"{pre}"
        f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="{FOND}">'
        '<tr><td align="center" style="padding:30px 14px">'
        '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" '
        'style="width:100%;max-width:600px">'
        # en-tete
        f'<tr><td class="px" bgcolor="{BLEU_FONCE}" style="background:{BLEU_FONCE};'
        f"background:linear-gradient(135deg,{BLEU_FONCE} 0%,{BLEU} 100%);"
        'border-radius:20px 20px 0 0;padding:26px 32px">'
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>'
        '<td width="68" style="width:68px"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>'
        '<td style="background:#ffffff;border-radius:16px;padding:7px">'
        f'<img src="{LOGO}" width="50" height="50" alt="TIBA" style="display:block;border:0;border-radius:10px">'
        "</td></tr></table></td>"
        f'<td style="padding-left:6px;color:#ffffff;font-size:27px;font-weight:800;letter-spacing:2px;font-family:{f}">TIBA</td>'
        f'<td class="tag" align="right" style="color:#cfe0ff;font-size:12px;letter-spacing:.4px;font-family:{f}">'
        "Talents africains &middot; Recrutement</td>"
        "</tr></table></td></tr>"
        # bande orange
        f'<tr><td bgcolor="{ORANGE}" height="5" style="height:5px;line-height:5px;font-size:0">&nbsp;</td></tr>'
        # contenu
        f'<tr><td class="px" bgcolor="{BLANC}" style="background:{BLANC};padding:36px 32px 30px;color:{ENCRE};'
        f"font-size:15px;line-height:1.7;font-family:{f};border-left:1px solid {BORD};border-right:1px solid {BORD}\">"
        f"{_normaliser(contenu)}</td></tr>"
        # pied
        f'<tr><td class="px" bgcolor="{BLANC}" style="background:{BLANC};border:1px solid {BORD};border-top:0;'
        f'border-radius:0 0 20px 20px;padding:0 32px 24px;font-family:{f}">'
        f'<div style="border-top:1px solid {BORD};padding-top:18px;color:{GRIS};font-size:12px;line-height:1.6">'
        "Message automatique envoy&eacute; par TIBA, merci de ne pas y r&eacute;pondre.<br>"
        f'<a href="{APP}/cgu" style="color:{BLEU};text-decoration:none">Conditions</a> &nbsp;&middot;&nbsp; '
        f'<a href="{APP}/confidentialite" style="color:{BLEU};text-decoration:none">Confidentialit&eacute;</a> &nbsp;&middot;&nbsp; '
        f'<a href="{APP}" style="color:{BLEU};text-decoration:none">app.tiba.help</a></div></td></tr>'
        f'<tr><td align="center" style="padding:18px 0 0;color:#8a99b3;font-size:11px;font-family:{f}">'
        f"&copy; {annee} TIBA &mdash; Tous droits r&eacute;serv&eacute;s</td></tr>"
        "</table></td></tr></table></body></html>"
    )