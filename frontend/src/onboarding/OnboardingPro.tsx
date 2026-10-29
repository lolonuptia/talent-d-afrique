// @ts-nocheck
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowRight, Bell, BookOpen, Briefcase, Building2, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronLeft,
  ChevronRight, ClipboardList, Clock, Compass, HelpCircle, Keyboard, LayoutDashboard, Lightbulb, LifeBuoy,
  MessageSquare, PartyPopper, RotateCcw, Rocket, Search, Settings, ShieldCheck, Sparkles, Target, Users, X,
} from "lucide-react";
import { api, list } from "../api";
import { useAuth } from "../auth";
import "../forms-pro/forms-pro.css";
import "./onboarding.css";

/* À adapter : adresse affichée dans l'onglet Aide */
const SUPPORT_EMAIL = "support@talentdafrique.com";

/* ================= STOCKAGE (par utilisateur, dans le navigateur) ================= */
const DEFAULT = { welcomed: false, tour: false, dismissed: false, celebrated: false, goals: [], team: "", seen: {} };
const key = (u) => "ob:" + (u?.id ?? "anon");
const read = (u) => { try { return { ...DEFAULT, ...JSON.parse(localStorage.getItem(key(u)) || "{}") }; } catch { return { ...DEFAULT }; } };

function useStore(user) {
  const [s, setS] = useState(() => read(user));
  useEffect(() => { setS(read(user)); }, [user?.id]);
  useEffect(() => {
    const h = () => setS(read(user));
    window.addEventListener("ob-change", h);
    return () => window.removeEventListener("ob-change", h);
  }, [user?.id]);
  const patch = useCallback((p) => {
    const cur = read(user);
    const next = { ...cur, ...(typeof p === "function" ? p(cur) : p) };
    try { localStorage.setItem(key(user), JSON.stringify(next)); } catch {}
    setS(next);
    window.dispatchEvent(new Event("ob-change"));
  }, [user?.id]);
  return [s, patch];
}

/* ================= DONNÉES RÉELLES (API) ================= */
function useData(tick) {
  const [d, setD] = useState(null);
  useEffect(() => {
    let off = false;
    (async () => {
      const [profil, offres, cands, entretiens, missions] = await Promise.all([
        api("/profiles/me").catch(() => null),
        list("/offres/mine").catch(() => []),
        list("/candidatures/recues").catch(() => []),
        list("/entretiens").catch(() => []),
        list("/missions").catch(() => []),
      ]);
      if (!off) setD({ profil, offres, cands, entretiens, missions });
    })();
    return () => { off = true; };
  }, [tick]);
  return d;
}

/* ================= ÉTAPES ================= */
const PHASES = [
  { t: "Configurer votre espace", s: "Les bases pour inspirer confiance" },
  { t: "Publier votre première offre", s: "Une annonce claire attire les bons profils" },
  { t: "Recruter", s: "Trouvez, évaluez et rencontrez vos candidats" },
  { t: "Suivre vos recrues", s: "De l'acceptation à la livraison" },
];
const filled = (p, ks) => ks.filter((k) => String(p?.[k] ?? "").trim()).length;
const TRACK = ["/talents", "/candidats", "/messages"];

const STEPS = [
  { id: "email", phase: 0, icon: ShieldCheck, min: 1, to: "/compte", cta: "Ouvrir mon compte",
    title: "Confirmer votre adresse email",
    why: "Sans email confirmé, vous ne pouvez ni publier d'offre ni chercher des talents.",
    done: (d, u) => u.email_verifie !== false },
  { id: "profil", phase: 0, icon: Building2, min: 3, to: "/profil", cta: "Compléter le profil",
    title: "Compléter le profil de l'entreprise",
    why: "Les talents lisent votre profil avant de postuler. Secteur, localisation et description sont indispensables.",
    done: (d) => !!d.profil && ["secteur", "localisation", "description"].every((k) => String(d.profil[k] ?? "").trim()) },
  { id: "marque", phase: 0, icon: Sparkles, min: 3, to: "/profil", cta: "Soigner ma marque",
    title: "Soigner votre marque employeur",
    why: "Un logo, une taille d'équipe et une culture d'entreprise claire rassurent les candidats.",
    done: (d) => filled(d.profil, ["logo_url", "culture", "taille"]) >= 3 },
  { id: "tour", phase: 0, icon: Compass, min: 2, action: "tour", cta: "Lancer la visite",
    title: "Faire la visite guidée",
    why: "Deux minutes pour savoir où se trouve chaque outil.",
    done: (d, u, s) => !!s.tour },

  { id: "offre", phase: 1, icon: Briefcase, min: 5, to: "/offres/nouvelle", cta: "Publier une offre",
    title: "Publier votre première offre",
    why: "C'est elle qui déclenche les candidatures. L'assistant en 4 étapes vous guide.",
    done: (d) => d.offres.length > 0 },
  { id: "riche", phase: 1, icon: Target, min: 3, to: "/offres", cta: "Voir mes offres",
    title: "Rédiger une offre complète",
    why: "Compétences obligatoires, localisation et description détaillée (100 caractères minimum) améliorent la précision du classement.",
    done: (d) => d.offres.some((o) => String(o.competences_obligatoires || "").trim() && String(o.localisation || "").trim() && String(o.description || "").trim().length >= 100) },

  { id: "talents", phase: 2, icon: Search, min: 3, to: "/talents", cta: "Explorer les talents",
    title: "Explorer la base de talents",
    why: "Filtrez par compétences, disponibilité et TJM, et gardez vos favoris.",
    done: (d, u, s) => !!s.seen["/talents"] },
  { id: "candidature", phase: 2, icon: Users, min: 0, to: "/candidats", cta: "Voir les candidats",
    title: "Recevoir votre première candidature",
    why: "Pas encore de candidature ? Vérifiez que l'offre est active et complète, puis parcourez les talents.",
    done: (d) => d.cands.length > 0 },
  { id: "classement", phase: 2, icon: Target, min: 3, to: "/candidats", cta: "Ouvrir le classement",
    title: "Consulter le classement par score",
    why: "Les candidats sont classés par compatibilité avec votre offre. Ouvrez « Score » pour le détail par critère.",
    done: (d, u, s) => !!s.seen["/candidats"] },
  { id: "message", phase: 2, icon: MessageSquare, min: 2, to: "/messages", cta: "Ouvrir la messagerie",
    title: "Découvrir la messagerie",
    why: "Chaque conversation est liée à une candidature. Ctrl+Entrée envoie le message.",
    done: (d, u, s) => !!s.seen["/messages"] },
  { id: "entretien", phase: 2, icon: CalendarDays, min: 3, to: "/entretiens", cta: "Planifier un entretien",
    title: "Planifier votre premier entretien",
    why: "Choisissez un créneau libre : le candidat est prévenu par notification et par email.",
    done: (d) => d.entretiens.length > 0 },

  { id: "accepte", phase: 3, icon: CheckCircle2, min: 1, to: "/candidats", cta: "Gérer les statuts",
    title: "Accepter un candidat",
    why: "Passez la candidature au statut « acceptée » (menu de statut ou glisser-déposer en Kanban).",
    done: (d) => d.cands.some((c) => c.statut === "acceptee") },
  { id: "mission", phase: 3, icon: ClipboardList, min: 4, to: "/missions", cta: "Créer une mission",
    title: "Lancer le suivi d'une mission",
    why: "Définissez des jalons : l'avancement se calcule tout seul et le talent est prévenu.",
    done: (d) => d.missions.length > 0 },
];

function useSteps(d, u, s) {
  return useMemo(() => STEPS.map((st) => ({ ...st, ok: d && u ? !!st.done(d, u, s) : false })), [d, u?.email_verifie, s]);
}

/* ================= CONTENUS ================= */
const GOALS = [
  ["dev", "Recruter un développeur"], ["stage", "Accueillir un stagiaire"], ["mission", "Confier une mission freelance"],
  ["equipe", "Constituer une équipe"], ["decouvrir", "Je découvre la plateforme"],
];
const TEAMS = ["Juste moi", "2 à 5", "6 à 20", "20 et +"];
const TIPS = {
  dev: "Listez 3 à 5 compétences obligatoires et rangez le reste en « souhaitées ».",
  stage: "Choisissez le contrat « stage » et précisez la disponibilité attendue.",
  mission: "Choisissez le contrat « mission » pour renseigner un budget TJM maximum.",
  equipe: "Publiez une offre par poste : le classement se fait offre par offre.",
  decouvrir: "Parcourez la base de Talents pour voir les profils avant de publier.",
};
const CRITERES = [
  ["Compétences obligatoires", "Celles que vous jugez indispensables. Ce sont les plus déterminantes."],
  ["Compétences souhaitées", "Un plus qui départage les profils proches."],
  ["Expérience et TJM", "Niveau d'expérience attendu et budget pour les missions."],
  ["Disponibilité", "Le candidat peut-il commencer quand vous en avez besoin ?"],
  ["Soft skills", "Autonomie, communication, esprit d'équipe…"],
];
const FLOW = [
  [Briefcase, "Publier", "Créez une offre claire avec ses compétences."],
  [Users, "Recevoir et classer", "Les candidatures arrivent déjà classées par score."],
  [CalendarDays, "Échanger et interviewer", "Messagerie et entretiens planifiés en un clic."],
  [ClipboardList, "Suivre la mission", "Jalons, avancement et mises à jour."],
];
const SECTIONS = [
  { to: "/", icon: LayoutDashboard, title: "Vue d'ensemble", what: "Votre tableau de bord : compteurs, courbe des candidatures, entretiens à venir et activité récente.",
    tips: ["Changez la période du graphique : 7, 30 ou 90 jours.", "Cliquez sur une offre pour ouvrir son classement.", "Les chiffres se rafraîchissent chaque minute."] },
  { to: "/offres", icon: Briefcase, title: "Mes offres", what: "Créez, modifiez, prolongez, archivez et dupliquez vos annonces.",
    tips: ["La barre colorée montre où en sont les candidatures de chaque offre.", "Dupliquez une offre pour en créer une proche en quelques secondes.", "Une offre qui a des candidatures ne se supprime pas : archivez-la."] },
  { to: "/candidats", icon: Users, title: "Candidats", what: "Les candidatures d'une offre classées par score, en liste ou en Kanban.",
    tips: ["Glissez-déposez une carte dans le Kanban pour changer son statut.", "Ouvrez « Score » pour voir le détail par critère.", "Le badge « Recommandé » signale les meilleurs profils."] },
  { to: "/entretiens", icon: CalendarDays, title: "Entretiens", what: "Planifiez par créneaux, suivez l'agenda, reportez ou annulez.",
    tips: ["Les créneaux déjà pris sont grisés.", "Le candidat est prévenu par notification et par email.", "Reportez depuis la liste : la nouvelle date doit être dans le futur."] },
  { to: "/missions", icon: ClipboardList, title: "Missions", what: "Suivez le travail d'un candidat accepté : avancement en %, jalons et mises à jour.",
    tips: ["Une mission se crée à partir d'un candidat accepté.", "Ajoutez des jalons : l'avancement se calcule tout seul.", "Postez des points d'avancement pour garder une trace."] },
  { to: "/messages", icon: MessageSquare, title: "Messages", what: "Échangez avec vos candidats, une conversation par candidature.",
    tips: ["Ctrl+Entrée envoie le message.", "Un badge indique les messages non lus.", "Écrivez aussi depuis la page Candidats avec « Écrire »."] },
  { to: "/talents", icon: Search, title: "Talents", what: "La base des profils : étudiants et freelances, avec filtres.",
    tips: ["Séparez les compétences par des virgules.", "Filtrez par disponibilité, type de profil et TJM maximum.", "Mettez un profil en favori pour le retrouver."] },
  { to: "/notifications", icon: Bell, title: "Notifications", what: "Nouvelles candidatures, messages, mises à jour.",
    tips: ["Le filtre « Non lues » va à l'essentiel.", "« Tout marquer comme lu » vide le compteur.", "Le badge du menu se met à jour automatiquement."] },
  { to: "/profil", icon: Building2, title: "Profil entreprise", what: "Votre vitrine auprès des talents : secteur, taille, logo, culture.",
    tips: ["La jauge indique le niveau de complétion.", "Le logo se renseigne par une adresse d'image (URL).", "Le bouton Enregistrer s'active dès qu'un champ change."] },
  { to: "/compte", icon: Settings, title: "Mon compte", what: "Email, mot de passe, export de vos données et suppression du compte.",
    tips: ["Changer l'email demande votre mot de passe actuel.", "L'export télécharge toutes vos données en JSON.", "La suppression est effective après 30 jours."] },
];
const PRATIQUES = [
  [Briefcase, "Rédiger de bonnes offres", ["Un titre précis : poste et niveau (« Développeur React confirmé »).", "3 à 5 compétences obligatoires, le reste en souhaitées.", "Indiquer une rémunération ou un TJM rassure les candidats.", "Décrire les missions concrètes, l'équipe et le contexte."]],
  [Users, "Traiter les candidatures", ["Répondez rapidement : un candidat sans nouvelle se désengage.", "Le score aide à décider, il ne remplace pas votre jugement.", "Passez les statuts à jour : le candidat est informé.", "Refusez poliment plutôt que de ne pas répondre."]],
  [CalendarDays, "Réussir un entretien", ["Vérifiez le lien de visio ou l'adresse avant l'envoi.", "Prévoyez 30 à 45 minutes pour un premier échange.", "Utilisez le message pour préciser le déroulé et les documents.", "Préparez vos questions à partir du détail du score."]],
  [ClipboardList, "Piloter une mission", ["Découpez en jalons courts et vérifiables.", "Faites un point régulier et notez-le dans les mises à jour.", "Mettez la mission en pause plutôt que de la supprimer.", "Marquez-la terminée pour passer l'avancement à 100 %."]],
  [ShieldCheck, "Sécurité et données", ["Ne partagez jamais votre mot de passe.", "Utilisez un mot de passe long et unique.", "Exportez vos données depuis Mon compte quand vous le souhaitez.", "Les données de candidats sont à traiter conformément à la confidentialité."]],
];
const FAQ = [
  ["Pourquoi ne puis-je pas publier d'offre ?", "Deux causes fréquentes : votre email n'est pas confirmé, ou votre profil entreprise n'est pas complété. Confirmez l'email depuis le bandeau en haut de page, puis remplissez le profil."],
  ["Comment le score est-il calculé ?", "Chaque candidature est comparée à l'offre sur cinq critères : compétences obligatoires, compétences souhaitées, expérience et TJM, disponibilité, soft skills. Le détail est visible via le bouton « Score » de chaque candidat."],
  ["Que se passe-t-il quand je planifie un entretien ?", "La candidature passe au statut « entretien » et le candidat reçoit une notification et un email avec la date et l'heure."],
  ["Puis-je modifier ou annuler un entretien ?", "Oui. Vous pouvez le reporter (la nouvelle date doit être dans le futur) ou passer son statut à « annulé ». S'il n'y a plus d'entretien planifié, la candidature repasse « en cours »."],
  ["Pourquoi ne puis-je pas supprimer une offre ?", "Une offre qui a des candidatures ne peut pas être supprimée, pour préserver l'historique. Archivez-la : elle disparaît des offres actives."],
  ["À quoi sert « Prolonger » ?", "Cette action prolonge la durée de publication d'une offre active, avant son expiration."],
  ["Comment créer une mission ?", "Passez d'abord une candidature au statut « acceptée ». Ensuite, depuis la page Missions, cliquez sur « Nouvelle mission »."],
  ["Je ne reçois pas l'email de confirmation.", "Regardez dans les courriers indésirables, puis utilisez « Renvoyer le lien » dans le bandeau en haut de page. Le lien est valable pour une durée limitée."],
  ["Que deviennent mes données si je supprime mon compte ?", "Le compte est désactivé immédiatement, puis les données sont effacées après 30 jours. Vous pouvez les exporter avant, depuis Mon compte."],
];
const GLOSSAIRE = [
  ["Reçue", "Candidature arrivée, pas encore examinée."], ["En cours", "Candidature en cours d'examen."],
  ["Entretien", "Un entretien est planifié avec le candidat."], ["Acceptée", "Candidat retenu : vous pouvez créer une mission."],
  ["Refusée", "Candidature clôturée sans suite."], ["Active / Expirée / Archivée", "États d'une offre : visible, arrivée à échéance, ou retirée."],
  ["Stage, CDD, CDI, Mission", "Types de contrat. « Mission » ouvre le champ budget TJM."],
  ["TJM", "Taux journalier moyen, le tarif d'un freelance par jour travaillé."],
  ["Jalon", "Étape d'une mission. L'avancement se calcule à partir des jalons terminés."],
  ["Score de matching", "Note de 0 à 100 : vert à partir de 75, orange de 50 à 74, rouge en dessous."],
];
const RACCOURCIS = [
  ["Ctrl + Entrée", "Envoyer un message dans la messagerie"], ["Échap", "Fermer une fenêtre ou un panneau"],
  ["Entrée ou virgule", "Ajouter une compétence dans un champ d'étiquettes"], ["Aller à… (barre du haut)", "Taper le nom d'une page puis Entrée"],
  ["Glisser-déposer", "Changer le statut d'un candidat dans le Kanban"], ["Bouton lune", "Basculer entre thème clair et sombre"],
];

/* ================= PETITS COMPOSANTS ================= */
function Ring({ v, size = 64, stroke = 7, color = "#0f9d73" }) {
  const R = (size - stroke) / 2, C = 2 * Math.PI * R, h = size / 2;
  return (
    <svg width={size} height={size} viewBox={"0 0 " + size + " " + size} style={{ flex: "none" }} role="img" aria-label={v + " pour cent"}>
      <circle cx={h} cy={h} r={R} fill="none" stroke="currentColor" opacity=".18" strokeWidth={stroke} />
      <circle cx={h} cy={h} r={R} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={(v / 100) * C + " " + C} transform={"rotate(-90 " + h + " " + h + ")"} style={{ transition: "stroke-dasharray .6s" }} />
      <text x={h} y={h + size / 11} textAnchor="middle" fontSize={size / 4.2} fontWeight="800" fill="currentColor">{v}%</text>
    </svg>
  );
}

function Welcome({ user, init, onClose }) {
  const nav = useNavigate();
  const [i, setI] = useState(0);
  const [goals, setGoals] = useState(init.goals || []);
  const [team, setTeam] = useState(init.team || "");
  const N = 5;
  const finish = (to) => { onClose({ welcomed: true, goals, team }); if (to) nav(to); };
  useEffect(() => {
    const k = (e) => { if (e.key === "Escape") finish(); };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [goals, team]);
  const toggle = (id) => setGoals((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));

  return (
    <div className="ob-overlay" onClick={() => finish()}>
      <div className="ob-modal fp-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="ob-close" onClick={() => finish()} aria-label="Passer"><X size={18} /></button>
        <div className="ob-slide" key={i}>
          {i === 0 && (<>
            <div className="ob-art"><Rocket size={34} /></div>
            <h2>Bienvenue, {user?.nom} 👋</h2>
            <p className="ob-lead">TIBA vous aide à recruter les meilleurs talents du continent. En une dizaine de minutes, votre espace sera prêt à recevoir ses premières candidatures.</p>
            <ul className="ob-points">
              <li><Check size={16} />Un guide pas à pas avec votre progression</li>
              <li><Check size={16} />Un classement automatique des candidats par score</li>
              <li><Check size={16} />Entretiens, messagerie et suivi de mission au même endroit</li>
            </ul>
          </>)}
          {i === 1 && (<>
            <div className="ob-art"><Target size={34} /></div>
            <h2>Qu'allez-vous faire ici ?</h2>
            <p className="ob-lead">Choisissez ce qui vous correspond : nous adapterons vos conseils.</p>
            <div className="ob-chips">{GOALS.map(([id, l]) => <button key={id} className={goals.includes(id) ? "on" : ""} onClick={() => toggle(id)}>{goals.includes(id) && <Check size={14} />}{l}</button>)}</div>
            <p className="ob-sub">Taille de votre équipe</p>
            <div className="ob-chips">{TEAMS.map((t) => <button key={t} className={team === t ? "on" : ""} onClick={() => setTeam(t)}>{t}</button>)}</div>
          </>)}
          {i === 2 && (<>
            <div className="ob-art"><Compass size={34} /></div>
            <h2>Comment ça marche</h2>
            <ol className="ob-flow">{FLOW.map(([I, t, d], k) => (
              <li key={t}><span><I size={18} /></span><div><b>{k + 1}. {t}</b><p>{d}</p></div></li>
            ))}</ol>
          </>)}
          {i === 3 && (<>
            <div className="ob-art"><Sparkles size={34} /></div>
            <h2>Comprendre le score</h2>
            <p className="ob-lead">Chaque candidat reçoit une note de 0 à 100, calculée sur cinq critères :</p>
            <ul className="ob-crit">{CRITERES.map(([t, d]) => <li key={t}><b>{t}</b><span>{d}</span></li>)}</ul>
            <div className="ob-legend"><i style={{ background: "#10b981" }} />75 et +<i style={{ background: "#f59e0b" }} />50 à 74<i style={{ background: "#ef4444" }} />moins de 50</div>
          </>)}
          {i === 4 && (<>
            <div className="ob-art"><PartyPopper size={34} /></div>
            <h2>Vous êtes prêt !</h2>
            <p className="ob-lead">{goals.length ? TIPS[goals[0]] : "Suivez la checklist « Premiers pas » : chaque étape se coche toute seule."}</p>
            <div className="ob-cta">
              <button className="fp-btn solid" style={{ margin: 0 }} onClick={() => finish("/guide")}><Rocket size={16} />Ouvrir le guide</button>
              <button className="fp-btn" onClick={() => finish("/offres/nouvelle")}><Briefcase size={16} />Publier une offre</button>
            </div>
          </>)}
        </div>
        <footer className="ob-nav">
          {i < N - 1 ? <button className="ob-skip" onClick={() => finish()}>Passer</button> : <button className="ob-skip" onClick={() => finish()}>Plus tard</button>}
          <div className="ob-dots">{Array.from({ length: N }).map((_, k) => <i key={k} className={k === i ? "on" : k < i ? "past" : ""} />)}</div>
          <div className="ob-btns">
            {i > 0 && <button className="fp-btn ep-small" onClick={() => setI(i - 1)}><ChevronLeft size={15} /></button>}
            {i < N - 1 && <button className="fp-btn solid ep-small" style={{ margin: 0 }} onClick={() => setI(i + 1)}>Suivant<ChevronRight size={15} /></button>}
          </div>
        </footer>
      </div>
    </div>
  );
}

function Tour({ onClose }) {
  const [i, setI] = useState(0);
  const sec = SECTIONS[i], I = sec.icon, last = i === SECTIONS.length - 1;
  useEffect(() => {
    const k = (e) => { if (e.key === "Escape") onClose(false); };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, []);
  return (
    <div className="ob-overlay" onClick={() => onClose(false)}>
      <div className="ob-modal fp-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="ob-close" onClick={() => onClose(false)} aria-label="Fermer"><X size={18} /></button>
        <div className="ob-slide" key={i}>
          <span className="ob-count">Visite guidée · {i + 1} / {SECTIONS.length}</span>
          <div className="ob-art"><I size={34} /></div>
          <h2>{sec.title}</h2>
          <p className="ob-lead">{sec.what}</p>
          <ul className="ob-points">{sec.tips.map((t) => <li key={t}><Lightbulb size={16} />{t}</li>)}</ul>
          <Link className="ob-open" to={sec.to} onClick={() => onClose(false)}>Ouvrir cette page <ArrowRight size={14} /></Link>
        </div>
        <footer className="ob-nav">
          <button className="ob-skip" onClick={() => onClose(false)}>Fermer</button>
          <div className="ob-dots">{SECTIONS.map((_, k) => <i key={k} className={k === i ? "on" : k < i ? "past" : ""} />)}</div>
          <div className="ob-btns">
            {i > 0 && <button className="fp-btn ep-small" onClick={() => setI(i - 1)}><ChevronLeft size={15} /></button>}
            {!last ? <button className="fp-btn solid ep-small" style={{ margin: 0 }} onClick={() => setI(i + 1)}>Suivant<ChevronRight size={15} /></button>
              : <button className="fp-btn solid ep-small" style={{ margin: 0 }} onClick={() => onClose(true)}><Check size={15} />Terminer</button>}
          </div>
        </footer>
      </div>
    </div>
  );
}

/* ================= WIDGET FLOTTANT (monté dans le Layout) ================= */
export function OnboardingWidget() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [s, patch] = useStore(user);
  const d = useData(pathname);
  const steps = useSteps(d, user, s);
  const [open, setOpen] = useState(false);
  const total = steps.length, done = steps.filter((x) => x.ok).length, pct = Math.round((100 * done) / total);

  useEffect(() => {
    if (!user || user.is_admin) return;
    if (TRACK.includes(pathname) && !s.seen[pathname]) patch((c) => ({ seen: { ...c.seen, [pathname]: 1 } }));
  }, [pathname, user?.id]);
  useEffect(() => {
    if (d && done === total && !s.celebrated) { toast.success("Bravo ! Votre espace est entièrement configuré 🎉"); patch({ celebrated: true }); }
  }, [d, done]);
  useEffect(() => setOpen(false), [pathname]);

  if (!user || user.is_admin) return null;
  const next = steps.filter((x) => !x.ok).slice(0, 3);
  const mins = steps.filter((x) => !x.ok).reduce((a, x) => a + x.min, 0);

  return (
    <>
      {!s.welcomed && <Welcome user={user} init={s} onClose={(p) => patch(p)} />}
      {s.welcomed && !s.dismissed && d && done < total && pathname !== "/guide" && (
        <>
          {open && (
            <div className="ob-panel fp-card">
              <div className="ob-panel-h">
                <Ring v={pct} size={56} stroke={6} />
                <div><b>Vos premiers pas</b><small>{done} sur {total} étapes · environ {mins} min restantes</small></div>
              </div>
              <ul className="ob-mini-list">
                {next.map((st) => { const I = st.icon; return (
                  <li key={st.id}><Link to={st.action ? "/guide" : st.to}><span><I size={15} /></span><em>{st.title}</em><ArrowRight size={14} /></Link></li>
                ); })}
              </ul>
              <div className="ob-panel-f">
                <Link className="fp-btn solid ep-small" style={{ margin: 0, textDecoration: "none" }} to="/guide">Ouvrir le guide</Link>
                <button className="ob-skip" onClick={() => { patch({ dismissed: true }); setOpen(false); toast("Retrouvez le guide à tout moment dans le menu."); }}>Masquer</button>
              </div>
            </div>
          )}
          <button className="ob-launch" onClick={() => setOpen(!open)} aria-expanded={open}>
            <span className="ob-mini">{pct}%</span>Premiers pas · {done}/{total}
          </button>
        </>
      )}
    </>
  );
}

/* ================= PAGE GUIDE ================= */
export default function GuidePro() {
  const { user } = useAuth();
  const [s, patch] = useStore(user);
  const [tab, setTab] = useState("start");
  const [tour, setTour] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const [faq, setFaq] = useState(-1);
  const d = useData("guide");
  const steps = useSteps(d, user, s);
  const total = steps.length, done = steps.filter((x) => x.ok).length, pct = Math.round((100 * done) / total);
  const rest = steps.filter((x) => !x.ok);
  const next = rest[0];
  const mins = rest.reduce((a, x) => a + x.min, 0);
  const tip = (s.goals || []).map((g) => TIPS[g]).filter(Boolean)[0];
  const title = pct === 100 ? "Bravo, tout est en place !" : pct >= 60 ? "Presque terminé" : pct > 0 ? "Bien démarré" : "Commençons";
  const tabs = [["start", "Premiers pas", Rocket], ["features", "Fonctionnalités", Compass], ["tips", "Bonnes pratiques", Lightbulb], ["faq", "FAQ", HelpCircle], ["glossary", "Glossaire", BookOpen], ["help", "Aide et raccourcis", LifeBuoy]];

  const startBtn = (st, cls) => st.action === "tour"
    ? <button className={cls} onClick={() => setTour(true)}>{st.cta}<ArrowRight size={14} /></button>
    : <Link className={cls} to={st.to}>{st.cta}<ArrowRight size={14} /></Link>;

  return (
    <div className="fp">
      <section className="fp-hero">
        <div className="ob-hero-row">
          <div className="ob-ringbox"><Ring v={d ? pct : 0} size={92} stroke={9} /></div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <span className="fp-hero-chip"><Rocket size={14} />Guide de démarrage</span>
            <h1>{title}</h1>
            <p>{!d ? "Analyse de votre compte…" : pct === 100 ? "Votre espace est entièrement configuré." : done + " étape" + (done > 1 ? "s" : "") + " sur " + total + " terminée" + (done > 1 ? "s" : "") + " · environ " + mins + " min restantes"}</p>
            {d && next && (
              <div className="ob-hero-cta">
                {startBtn(next, "fp-btn gold")}
                <span>Prochaine étape : {next.title}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="fp-tabs">
        {tabs.map(([k, l, I]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}><I size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />{l}</button>)}
      </div>

      {tab === "start" && (
        <>
          {tip && <div className="ob-tip fp-card"><Lightbulb size={18} /><div><b>Conseil pour vous</b><p>{tip}</p></div></div>}
          {pct === 100 && (
            <div className="fp-card ob-done"><PartyPopper size={30} /><div><b>Félicitations !</b><p>Vous maîtrisez les bases. Les onglets Bonnes pratiques et FAQ vous accompagneront pour la suite.</p></div></div>
          )}
          {!d && <p style={{ opacity: 0.6 }}>Chargement…</p>}
          {d && PHASES.map((ph, pi) => {
            const list = steps.filter((x) => x.phase === pi);
            const n = list.filter((x) => x.ok).length;
            return (
              <section className="ob-phase" key={ph.t}>
                <div className="ob-phase-h"><div><h2>{pi + 1}. {ph.t}</h2><p>{ph.s}</p></div><em>{n}/{list.length}</em></div>
                {list.map((st) => {
                  const I = st.icon, isNext = next && next.id === st.id;
                  return (
                    <div key={st.id} className={"ob-step" + (st.ok ? " ok" : "") + (isNext ? " next" : "")}>
                      <span className="ob-check">{st.ok && <Check size={15} />}</span>
                      <div className="ob-step-body">
                        <b><I size={15} style={{ verticalAlign: "-2px", marginRight: 6 }} />{st.title}</b>
                        <p>{st.why}</p>
                        <div className="ob-meta">
                          {st.min > 0 && <span className="ob-time"><Clock size={12} />{st.min} min</span>}
                          {st.ok ? <span className="ob-ok">Terminé</span> : isNext ? <span className="ob-now">À faire maintenant</span> : null}
                        </div>
                      </div>
                      {!st.ok && startBtn(st, "ob-go")}
                    </div>
                  );
                })}
              </section>
            );
          })}
        </>
      )}

      {tab === "features" && (
        <>
          <div className="fp-card ob-banner"><div><b>Visite guidée</b><p>Parcourez les 10 écrans de l'application en 2 minutes.</p></div><button className="fp-btn solid" style={{ margin: 0 }} onClick={() => setTour(true)}><Compass size={16} />Lancer la visite</button></div>
          <div className="ob-grid">
            {SECTIONS.map((sec) => { const I = sec.icon; return (
              <article className="fp-card ob-feat" key={sec.to}>
                <span className="ob-ico"><I size={20} /></span>
                <h3>{sec.title}</h3>
                <p>{sec.what}</p>
                <ul>{sec.tips.map((t) => <li key={t}>{t}</li>)}</ul>
                <Link className="ob-open" to={sec.to}>Ouvrir <ArrowRight size={14} /></Link>
              </article>
            ); })}
          </div>
        </>
      )}

      {tab === "tips" && (
        <div className="ob-grid">
          {PRATIQUES.map(([I, t, l]) => (
            <article className="fp-card ob-feat" key={t}>
              <span className="ob-ico"><I size={20} /></span>
              <h3>{t}</h3>
              <ul>{l.map((x) => <li key={x}>{x}</li>)}</ul>
            </article>
          ))}
        </div>
      )}

      {tab === "faq" && (
        <div className="ob-faq">
          {FAQ.map(([q, a], k) => (
            <div className={"fp-card ob-q" + (faq === k ? " open" : "")} key={q}>
              <button onClick={() => setFaq(faq === k ? -1 : k)} aria-expanded={faq === k}><span>{q}</span><ChevronDown size={18} /></button>
              {faq === k && <p>{a}</p>}
            </div>
          ))}
        </div>
      )}

      {tab === "glossary" && (
        <div className="fp-card ob-gloss">
          {GLOSSAIRE.map(([t, dsc]) => <div key={t}><b>{t}</b><span>{dsc}</span></div>)}
        </div>
      )}

      {tab === "help" && (
        <>
          <div className="fp-card">
            <header className="fp-card-head"><div><h2><Keyboard size={17} style={{ verticalAlign: "-3px", marginRight: 8 }} />Raccourcis utiles</h2></div></header>
            <div className="ob-gloss flat">{RACCOURCIS.map(([k, v]) => <div key={k}><kbd>{k}</kbd><span>{v}</span></div>)}</div>
          </div>
          <div className="ob-grid">
            <article className="fp-card ob-feat"><span className="ob-ico"><LifeBuoy size={20} /></span><h3>Besoin d'aide ?</h3><p>Une question ou un problème ? Écrivez-nous en décrivant la page concernée.</p><a className="ob-open" href={"mailto:" + SUPPORT_EMAIL}>{SUPPORT_EMAIL} <ArrowRight size={14} /></a></article>
            <article className="fp-card ob-feat"><span className="ob-ico"><ShieldCheck size={20} /></span><h3>Données et confidentialité</h3><p>Consultez les règles d'utilisation et exportez vos données à tout moment.</p><Link className="ob-open" to="/cgu" target="_blank">Conditions d'utilisation <ArrowRight size={14} /></Link><Link className="ob-open" to="/confidentialite" target="_blank">Confidentialité <ArrowRight size={14} /></Link><Link className="ob-open" to="/compte">Exporter mes données <ArrowRight size={14} /></Link></article>
            <article className="fp-card ob-feat"><span className="ob-ico"><RotateCcw size={20} /></span><h3>Votre onboarding</h3><p>Rejouez la bienvenue, réaffichez le widget ou repartez de zéro.</p>
              <button className="ob-open" onClick={() => setWelcome(true)}>Rejouer la bienvenue <ArrowRight size={14} /></button>
              {s.dismissed && <button className="ob-open" onClick={() => { patch({ dismissed: false }); toast.success("Widget réaffiché"); }}>Réafficher le widget <ArrowRight size={14} /></button>}
              <button className="ob-open" onClick={() => { if (confirm("Réinitialiser votre progression d'onboarding ?")) { patch({ ...DEFAULT }); toast.success("Onboarding réinitialisé"); } }}>Tout réinitialiser <ArrowRight size={14} /></button>
            </article>
          </div>
        </>
      )}

      {tour && <Tour onClose={(ok) => { setTour(false); if (ok) { patch({ tour: true }); toast.success("Visite terminée"); } }} />}
      {welcome && <Welcome user={user} init={s} onClose={(p) => { setWelcome(false); patch(p); }} />}
    </div>
  );
}