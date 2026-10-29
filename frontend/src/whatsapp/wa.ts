// @ts-nocheck
export const DEFAULT_CC = "221";

/** Numero au format international sans "+" (ex: 221771234567), ou "" si invalide. */
export function normPhone(raw, cc = DEFAULT_CC) {
  const s = String(raw || "").trim();
  if (!s) return "";
  let d = s.replace(/\D/g, "");
  const intl = s.startsWith("+") || d.startsWith("00");
  if (d.startsWith("00")) d = d.slice(2);
  if (!intl) {
    d = d.replace(/^0+/, "");
    if (d.length <= 9) d = cc + d;
  }
  return d.length >= 9 && d.length <= 15 ? d : "";
}

/** Lien officiel Click to Chat. Sans numero : le contact est choisi dans WhatsApp. */
export const waLink = (phone, text) =>
  "https://wa.me/" + (phone || "") + (text ? "?text=" + encodeURIComponent(text) : "");

export const fill = (tpl, vars = {}) =>
  String(tpl || "").replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? "").toString());

const SIGN = "\n\nCordialement,\n{expediteur}\nTIBA";

export const ADMIN_TEMPLATES = [
  { id: "info", label: "Information", text: "Bonjour {nom},\n\nJe vous contacte de la part de l'équipe TIBA." + SIGN },
  { id: "verif", label: "Vérification du compte", text: "Bonjour {nom},\n\nL'équipe TIBA vous contacte pour vérifier votre compte. Pouvez-vous nous confirmer le nom légal de votre structure, votre site web et votre adresse professionnelle ? Merci." + SIGN },
  { id: "warn", label: "Avertissement", text: "Bonjour {nom},\n\nNous avons constaté sur votre compte TIBA un contenu qui ne respecte pas nos conditions d'utilisation. Merci de le corriger rapidement afin d'éviter une suspension." + SIGN },
  { id: "react", label: "Compte réactivé", text: "Bonjour {nom},\n\nVotre compte TIBA a été réactivé. Vous pouvez vous reconnecter dès maintenant." + SIGN },
];

export const CANDIDAT_TEMPLATES = [
  { id: "inv", label: "Invitation à un entretien", text: "Bonjour {nom},\n\nMerci pour votre candidature au poste « {offre} » chez {entreprise}. Nous aimerions vous rencontrer le {date}.\n{lien}\n\nPouvez-vous confirmer votre disponibilité ?" + SIGN },
  { id: "relance", label: "Relance", text: "Bonjour {nom},\n\nNous revenons vers vous au sujet de votre candidature « {offre} » chez {entreprise}. Êtes-vous toujours disponible ?" + SIGN },
  { id: "ok", label: "Acceptation", text: "Bonjour {nom},\n\nBonne nouvelle : votre candidature « {offre} » chez {entreprise} est retenue. Nous vous contactons pour la suite." + SIGN },
  { id: "ko", label: "Refus courtois", text: "Bonjour {nom},\n\nMerci de l'intérêt porté au poste « {offre} » chez {entreprise}. Nous ne pouvons malheureusement pas donner suite, mais nous gardons votre profil et vous souhaitons une belle réussite." + SIGN },
];

export const OFFRE_TEMPLATES = [
  { id: "share", label: "Partager l'offre", text: "{entreprise} recrute sur TIBA : {offre}\n{details}\n\nPostulez ici : {lien}" },
];