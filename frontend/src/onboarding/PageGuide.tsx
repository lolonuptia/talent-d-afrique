// @ts-nocheck
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Compass, HelpCircle, Lightbulb, PlayCircle, RotateCcw, X } from "lucide-react";
import { useAuth } from "../auth";
import "../forms-pro/forms-pro.css";
import "./pageguide.css";

const S = (sel, title, text, tryit) => ({ sel, title, text, tryit });

/* ================= CONTENU DES GUIDES ================= */
const GUIDES = {
  shell: { title: "L'interface", about: "Menu, recherche, thème, notifications, profil", steps: [
    S(".side", "Le menu principal", "Toutes les pages de l'application sont ici. Le badge rouge à côté de Notifications indique le nombre de notifications non lues.", "Cliquez sur un élément du menu pour changer de page."),
    S(".side-toggle", "Réduire le menu", "Ce bouton passe le menu en mode icônes pour gagner de la place. Votre choix est mémorisé.", "Cliquez dessus, puis recliquez pour revenir."),
    S(".crumb", "Où suis-je ?", "Le fil d'Ariane rappelle la page actuelle."),
    S(".tsearch", "Aller à…", "Tapez le nom d'une page et validez avec Entrée pour y aller directement, sans passer par le menu.", "Tapez « tal » puis Entrée pour ouvrir Talents."),
    S(".tright button.icon-btn:not([data-pg-help])", "Thème clair ou sombre", "Le bouton lune bascule l'affichage. Le choix est mémorisé sur cet appareil."),
    S(".tright a.bell", "Notifications", "Le badge affiche le nombre de notifications non lues : nouvelles candidatures, messages, mises à jour. Un clic ouvre la liste."),
    S(".profile .avatar", "Votre profil", "Ce menu donne accès au Profil entreprise, à Mon compte et à la déconnexion."),
    S("[data-pg-help]", "Ce bouton « ? »", "Il relance le guide de la page où vous êtes, autant de fois que vous le souhaitez. Le menu qu'il ouvre liste aussi toutes les visites."),
  ] },

  "/": { title: "Vue d'ensemble", about: "Votre tableau de bord", steps: [
    S(".dp-hero", "Votre accueil", "La salutation change selon l'heure. Le texte indique combien de candidatures sont à traiter (statut « reçue ») et combien d'entretiens arrivent. Les deux boutons mènent à la publication d'une offre et aux candidats."),
    S(".dp-kpis", "Les chiffres clés", "Quatre compteurs en direct : offres actives, candidatures, entretiens à venir, candidatures acceptées. Le « +N / 7 j » compte les candidatures de la semaine. Les mini-courbes montrent l'évolution."),
    S(".dp-chart", "Candidatures reçues", "La courbe compte les candidatures par jour (7 j, 30 j) ou par semaine (90 j). Le total de la période est écrit sous le titre.", "Changez la période avec 7j / 30j / 90j, puis survolez la courbe pour voir le détail d'un jour."),
    S(".dp-funnel", "Répartition par statut", "Chaque barre montre la part de candidatures dans un statut : reçue, en cours, entretien, acceptée, refusée. Elle indique où se bloque votre recrutement."),
    S(".dp-offers", "Vos offres", "Les 5 offres les plus récentes, avec leur statut et leur nombre de candidats. La barre compare chaque offre à la plus demandée.", "Cliquez sur le titre d'une offre pour ouvrir son classement."),
    S(".dp-talents", "Dernières candidatures", "Les 5 plus récentes, avec le candidat, l'offre visée et le statut. Cliquer sur le statut ouvre le classement de l'offre."),
    S(".dp-timeline", "Prochains entretiens", "L'heure, le jour, le candidat, le mode (visio, présentiel, téléphone) et la durée. « Agenda » mène à la planification."),
    S(".dp-feed", "Activité récente", "Vos 4 dernières notifications. Une pastille verte et un texte en gras signalent une notification non lue."),
  ] },

  "/offres": { title: "Mes offres", about: "Créer, suivre et gérer vos annonces", steps: [
    S(".fp-hero", "Le résumé", "Nombre d'offres, offres actives, candidatures reçues au total et candidatures à traiter."),
    S(".cp-hero-top a.fp-btn", "Publier une offre", "Ouvre l'assistant en 4 étapes. Votre email doit être confirmé et votre profil entreprise complété."),
    S(".op-tools .mp-search", "Rechercher", "Filtre par titre ou par lieu pendant que vous tapez.", "Tapez une partie du titre d'une offre."),
    S(".op-tools .cp-pills", "Filtrer par statut", "Toutes, active, expirée, archivée, avec le nombre d'offres dans chaque statut."),
    S(".op-right", "Trier et changer l'affichage", "Triez par plus récentes, plus de candidats ou titre A-Z. Les deux boutons à droite basculent entre grille et liste, et le choix est mémorisé."),
    S(".op-card", "Une offre", "Le titre, le statut, le type de contrat, le lieu, l'ancienneté, la rémunération ou le TJM, puis les 3 premières compétences obligatoires."),
    S(".op-cands", "Candidats de l'offre", "Le nombre de candidats. Le lien ouvre le classement de cette offre, déjà sélectionnée."),
    S(".op-pipe", "La barre colorée", "Elle répartit les candidatures par statut : bleu reçue, violet en cours, orange entretien, vert acceptée, gris refusée.", "Survolez un segment pour voir le détail."),
    S(".op-actions", "Les actions", "Modifier ouvre l'assistant. Prolonger prolonge une offre active. Archiver la retire des offres actives et Réactiver la remet en ligne. Dupliquer crée une copie « (copie) ». La corbeille est grisée si l'offre a des candidatures : archivez-la alors."),
  ] },

  "/offres/nouvelle": { title: "Publier ou modifier une offre", about: "L'assistant en 4 étapes", steps: [
    S(".fp-steps", "Quatre étapes", "Poste, Détails, Conditions, Récap. Vous ne passez à la suivante que lorsque les champs obligatoires sont valides."),
    S(".fp-body", "L'étape en cours", "Étape 1 : titre (3 caractères minimum), type de contrat et localisation. Le contrat « mission » ajoute plus loin un budget TJM. Les messages d'erreur n'apparaissent que si vous cliquez sur Continuer sans avoir rempli un champ obligatoire."),
    S(".fp-save", "Brouillon automatique", "Pour une nouvelle offre, ce que vous saisissez est enregistré dans ce navigateur. Si vous quittez la page, vous retrouvez votre brouillon.", null),
    S(".fp-preview", "Aperçu en direct", "Voici comment l'offre apparaîtra aux talents. Elle se met à jour pendant que vous écrivez.", "Tapez un titre et regardez l'aperçu changer."),
    S(null, "Les étapes suivantes", "Étape 2 : description (20 caractères minimum) et compétences obligatoires, souhaitées et soft skills, à valider avec Entrée ou une virgule. Étape 3 : niveau d'expérience, disponibilité attendue, rémunération, et le statut en modification. Étape 4 : récapitulatif avant publication."),
    S(".fp-actions", "Naviguer et publier", "Retour revient d'une étape, Continuer avance. À la dernière étape, le bouton Publier envoie l'offre, ou Enregistrer en modification. Annuler, à la première étape, ramène à la liste."),
  ] },

  "/candidats": { title: "Candidats", about: "Le classement par score", steps: [
    S(".fp .cp-hero-top", "Classement intelligent", "Les candidats d'une offre, classés par score de compatibilité. Une fois l'offre choisie, des compteurs s'affichent : nombre de candidats, recommandés, score moyen, acceptés."),
    S(".cp-toggle", "Deux vues", "Classement : une liste ordonnée par score. Kanban : une colonne par statut. Votre choix est mémorisé."),
    S(".fp > div.fp-card .fp-grid2 .fp-field:first-child", "Choisir l'offre", "Tout commence ici : sans offre sélectionnée, rien ne s'affiche. Le lien « Voir le classement » de Mes offres ou de la Vue d'ensemble la sélectionne automatiquement.", "Choisissez une offre dans la liste."),
    S(".cp-range", "Score minimum", "Masque les candidats sous un score donné. Le filtre s'applique au bout d'une demi-seconde.", "Placez le curseur sur 50."),
    S(".cp-pills", "Filtrer par statut", "Reçue, en cours, entretien, acceptée, refusée. « Tous » retire le filtre."),
    S(".cp-pager", "Pagination", "100 candidats par page. Les boutons Précédent et Suivant ne sont actifs que lorsqu'il y a une page avant ou après."),
    S(".cp-card", "Une carte candidat", "Le rang, les médailles or, argent et bronze pour le top 3 de la première page, le nom, le badge « Recommandé » et l'anneau de score. Vert à partir de 75, orange de 50 à 74, rouge en dessous."),
    S(".cp-status", "Changer le statut", "Le candidat est prévenu à chaque changement. La couleur de la bordure suit le statut."),
    S(".cp-actions", "Les actions", "Profil déplie le profil complet. Score détaille les 5 critères. Entretien ouvre la planification avec ce candidat présélectionné. Écrire ouvre la conversation."),
    S(".cp-kanban", "Le Kanban", "Glissez une carte d'une colonne à l'autre pour changer son statut. Chaque carte garde ses actions.", "Passez en vue Kanban avec le bouton en haut, puis glissez une carte."),
  ] },

  "/entretiens": { title: "Entretiens", about: "Planifier et suivre vos rendez-vous", steps: [
    S(".ep-stats", "Votre agenda en chiffres", "Entretiens à venir, ceux des 7 prochains jours et ceux déjà terminés."),
    S(".fp-split .fp-body > .fp-field:nth-child(1)", "Le candidat", "Seules les candidatures encore ouvertes sont listées : pas les refusées ni les acceptées. Si vous arrivez depuis Candidats, le candidat est déjà choisi.", "Choisissez un candidat."),
    S(".fp-split .fp-body > .fp-field:nth-child(2)", "La date", "Elle doit être aujourd'hui ou plus tard. Changer la date efface le créneau déjà choisi."),
    S(".fp-split .fp-body > .fp-field:nth-child(3)", "La durée", "De 15 à 90 minutes. Elle influe sur les créneaux disponibles, car un rendez-vous long peut en chevaucher un autre."),
    S(".ep-slots", "Les créneaux", "De 8 h à 18 h, toutes les 30 minutes. Un créneau grisé est déjà pris par un autre entretien ou déjà passé. Il faut d'abord choisir une date.", "Choisissez une date puis un horaire libre."),
    S(".fp-modes", "Le mode", "Visio, présentiel ou téléphone. Le champ en dessous s'adapte : lien de visio, adresse ou numéro à appeler."),
    S(".fp-split .fp-body > .fp-field:nth-child(7)", "Le message", "Il est visible par le candidat : déroulé, documents à préparer. 500 caractères maximum."),
    S(".fp-preview", "L'invitation", "Aperçu de ce que le candidat reçoit, avec la date, la durée, le mode et votre message."),
    S(".fp-split .fp-actions", "Planifier", "La candidature passe au statut « entretien » et le candidat reçoit une notification et un email."),
    S(".ep-iv", "Un entretien planifié", "La date, le candidat, l'offre, le mode et le lien « Rejoindre » si c'est une visio. Le menu règle le statut : planifié, annulé ou terminé. Annuler prévient le candidat. Reporter ouvre un sélecteur : la nouvelle date doit être dans le futur."),
  ] },

  "/missions": { title: "Missions", about: "Suivre le travail des candidats acceptés", steps: [
    S(".ep-stats", "Vue d'ensemble", "Missions en cours, avancement moyen des missions en cours, terminées et en retard."),
    S(".cp-hero-top .fp-btn", "Nouvelle mission", "Une mission se crée à partir d'un candidat accepté. Si personne n'est encore accepté, la fenêtre vous l'explique et mène vers Candidats."),
    S(".op-tools", "Rechercher et filtrer", "Cherchez par mission, candidat ou offre, et filtrez par statut : en cours, en pause, terminée, annulée."),
    S(".mi-card", "Une mission", "Le candidat, le titre, l'offre d'origine et le statut. La bordure devient rouge si la mission est en retard."),
    S(".mi-prog", "L'avancement", "Le pourcentage global du projet."),
    S(".mi-card .cp-range", "Régler l'avancement", "Sans jalon, déplacez le curseur : la valeur s'enregistre au relâchement. Avec des jalons, l'avancement se calcule tout seul. Il passe à 100 % quand la mission est terminée."),
    S(".mi-meta", "Dates et jalons", "La période, le nombre de jalons faits, les jours restants, ou le retard en rouge."),
    S(".mi-toggle", "Détails", "Cochez les jalons, ajoutez-en, postez des mises à jour datées, changez le statut ou supprimez la mission. Le talent est prévenu des changements de statut.", "Dépliez une mission et cochez un jalon."),
  ] },

  "/messages": { title: "Messages", about: "Échanger avec vos candidats", steps: [
    S(".mp-list .mp-search", "Rechercher", "Filtre les conversations par nom de candidat ou titre d'offre."),
    S(".mp-conv", "Une conversation", "Une conversation par candidature : le nom, l'offre en vert, le dernier message et un badge avec le nombre de messages non lus. Si la liste est vide, écrivez à un candidat depuis la page Candidats avec « Écrire »."),
    S(".mp-thread", "Le fil", "Vos messages sont à droite en vert. Ouvrir un fil le marque comme lu, et il se rafraîchit toutes les 10 secondes. Sur téléphone, la flèche en haut ramène à la liste."),
    S(".mp-compose", "Écrire", "2000 caractères maximum.", "Écrivez puis appuyez sur Ctrl+Entrée pour envoyer."),
  ] },

  "/talents": { title: "Talents", about: "Rechercher des profils", steps: [
    S(".tp-hero", "Vos repères", "Nombre de profils affichés, profils disponibles immédiatement, et nombre de favoris."),
    S(".tp-search", "Rechercher par compétences", "Séparez les compétences par des virgules : elles apparaissent en étiquettes. La recherche se lance après une courte pause.", "Tapez : python, sql"),
    S(".tp-chips", "Type de profil", "Tous, étudiants ou freelances."),
    S(".tp-selects", "Affiner", "Choisissez la disponibilité et le TJM maximum (pour les freelances). Le bouton Favoris n'affiche que vos favoris et Réinitialiser efface tous les filtres."),
    S(".tp-card", "Un profil", "Le nom, le type de profil, les compétences, la disponibilité, le TJM et l'expérience."),
    S(".tp-heart", "Favoris", "Le cœur met un profil de côté. Les favoris sont enregistrés dans ce navigateur et visibles avec le bouton Favoris."),
    S(".tp-card .tp-btn", "Voir le profil", "Ouvre un panneau avec les compétences, les formations, les certifications, les réalisations et le portfolio. Échap le ferme."),
    S(null, "Pagination", "20 profils par page, avec Précédent et Suivant en bas de la liste."),
  ] },

  "/notifications": { title: "Notifications", about: "Ne rien manquer", steps: [
    S(".fp-hero", "Centre de notifications", "Le nombre de notifications non lues. Le bouton « Tout marquer comme lu » vide le compteur d'un coup."),
    S(".fp-tabs", "Toutes ou non lues", "Passez sur « Non lues » pour aller à l'essentiel."),
    S(".np-item", "Une notification", "Une bordure verte signale une notification non lue. Le bouton « Lu » la marque comme lue. La liste se rafraîchit toutes les 30 secondes et le badge du menu suit."),
  ] },

  "/profil": { title: "Profil entreprise", about: "Votre vitrine auprès des talents", steps: [
    S(".fp-company-id", "Votre carte", "Le logo (ou vos initiales), le nom et la jauge de complétion. Les 6 champs du profil comptent chacun."),
    S(".fp-body .fp-grid2", "Secteur et localisation", "Les talents les lisent avant de postuler. Le profil doit être complété avant de publier une offre."),
    S(".fp-body", "Le reste du profil", "Taille de l'équipe, adresse du logo (un lien direct vers une image, avec aperçu), description de l'entreprise et culture d'entreprise."),
    S(".fp-actions", "Enregistrer", "Le bouton est actif seulement si quelque chose a changé. Annuler restaure la dernière version enregistrée."),
  ] },

  "/compte": { title: "Mon compte", about: "Email, mot de passe, données", steps: [
    S(".fp-hero", "Votre identité", "Votre nom, votre email et un badge « Email vérifié »."),
    S(".fp-tabs", "Trois onglets", "Profil : nom et email. Sécurité : mot de passe. Données : export et suppression du compte.", "Cliquez sur chaque onglet."),
    S(".fp > .fp-card", "Le contenu de l'onglet", "Profil : changer l'email demande votre mot de passe actuel. Sécurité : 8 caractères minimum, avec une jauge de force et une confirmation. Données : exporter tout en JSON, ou supprimer le compte en tapant SUPPRIMER, effectif après 30 jours."),
  ] },

  "/guide": { title: "Guide de démarrage", about: "Votre checklist de premiers pas", steps: [
    S(".ob-hero-row", "Votre progression", "L'anneau montre le pourcentage d'étapes terminées, avec le temps restant estimé et un bouton vers la prochaine étape."),
    S(".fp-tabs", "Six onglets", "Premiers pas, Fonctionnalités, Bonnes pratiques, FAQ, Glossaire, Aide et raccourcis."),
    S(".ob-phase", "Les étapes", "Elles se cochent toutes seules à partir de vos vraies données. Chaque étape a un bouton qui mène à l'action."),
  ] },

  "/formulaires": { title: "Formulaires", about: "Page de démonstration", steps: [
    S(".fp-tabs", "Trois formulaires", "Publier une offre, Profil entreprise, Entretien. C'est une page de démonstration : elle n'envoie rien à l'API. Utilisez Mes offres, Profil entreprise et Entretiens pour les vraies actions."),
  ] },
};

const ORDER = ["shell", "/", "/offres", "/offres/nouvelle", "/candidats", "/entretiens", "/missions", "/messages", "/talents", "/notifications", "/profil", "/compte", "/guide", "/formulaires"];

const routeKey = (p) => {
  const x = p.replace(/\/+$/, "") || "/";
  if (x === "/offres/nouvelle" || /^\/offres\/[^/]+\/modifier$/.test(x)) return "/offres/nouvelle";
  return x !== "shell" && GUIDES[x] ? x : null;
};

/* ================= STOCKAGE ================= */
const skey = (u) => "pg:" + (u?.id ?? "anon");
const read = (u) => { try { return { auto: true, seen: {}, ...JSON.parse(localStorage.getItem(skey(u)) || "{}") }; } catch { return { auto: true, seen: {} }; } };
const welcomed = (u) => { try { return !!JSON.parse(localStorage.getItem("ob:" + (u?.id ?? "anon")) || "{}").welcomed; } catch { return false; } };

/* ================= MOTEUR DE VISITE ================= */
function find(sel) {
  if (!sel) return null;
  try {
    return Array.from(document.querySelectorAll(sel)).find((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }) || null;
  } catch { return null; }
}
function focusEl(el) {
  const r = el.getBoundingClientRect();
  el.style.scrollMarginTop = "90px";
  el.scrollIntoView({ block: window.innerWidth < 640 || r.height > window.innerHeight * 0.5 ? "start" : "center", behavior: "smooth" });
}

function Tour({ guide, onClose }) {
  const steps = guide.steps;
  const [i, setI] = useState(0);
  const [rect, setRect] = useState(null);
  const [th, setTh] = useState(0);
  const [waited, setWaited] = useState(false);
  const [vp, setVp] = useState([window.innerWidth, window.innerHeight]);
  const tip = useRef(null);
  const el = useRef(null);
  const step = steps[i];
  const last = i === steps.length - 1;
  const next = useCallback(() => { if (last) onClose(true); else setI((x) => x + 1); }, [last, onClose]);
  const prev = useCallback(() => setI((x) => Math.max(0, x - 1)), []);

  useEffect(() => {
    el.current = null; setWaited(false);
    const t = setTimeout(() => setWaited(true), 500);
    let raf, lastKey = "";
    const tick = () => {
      if (!el.current || !el.current.isConnected) {
        el.current = find(step.sel);
        if (el.current) focusEl(el.current);
      }
      const r = el.current ? el.current.getBoundingClientRect() : null;
      const h = tip.current ? tip.current.offsetHeight : 0;
      const k = [r ? Math.round(r.left) : "x", r ? Math.round(r.top) : "x", r ? Math.round(r.width) : 0, r ? Math.round(r.height) : 0, h, window.innerWidth, window.innerHeight].join();
      if (k !== lastKey) {
        lastKey = k;
        setRect(r ? { left: r.left, top: r.top, width: r.width, height: r.height } : null);
        setTh(h); setVp([window.innerWidth, window.innerHeight]);
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { clearTimeout(t); cancelAnimationFrame(raf); if (el.current) el.current.style.scrollMarginTop = ""; };
  }, [i]);

  useEffect(() => {
    const k = (e) => {
      if (e.key === "Escape") onClose(false);
      else if (e.key === "ArrowRight") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [next, prev, onClose]);

  const [vw, vh] = vp;
  const small = vw < 640;
  const W = small ? vw - 24 : Math.min(400, vw - 24);
  const H = th || 230;
  const pad = 8;
  let top, left;
  if (!rect) { top = Math.max(12, (vh - H) / 2); left = (vw - W) / 2; }
  else if (small) { top = Math.max(12, vh - H - 12); left = 12; }
  else {
    const bottom = rect.top + rect.height + pad;
    left = Math.min(Math.max(rect.left, 12), vw - W - 12);
    if (vh - bottom >= H + 20) top = bottom + 12;
    else if (rect.top - pad >= H + 20) top = rect.top - pad - 12 - H;
    else if (vw - (rect.left + rect.width) >= W + 28) { left = rect.left + rect.width + pad + 12; top = Math.min(Math.max(rect.top, 12), vh - H - 12); }
    else if (rect.left >= W + 28) { left = rect.left - pad - 12 - W; top = Math.min(Math.max(rect.top, 12), vh - H - 12); }
    else top = vh - H - 12;
  }
  const missing = step.sel && !rect && waited;

  return createPortal(
    <>
      {rect ? (
        <>
          <div className="pg-block" onClick={(e) => e.stopPropagation()} />
          <div className="pg-spot" style={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }} />
        </>
      ) : <div className="pg-dim" />}
      <div className="pg-tip fp-card" ref={tip} role="dialog" aria-modal="true" aria-label={guide.title} style={{ top, left, width: W }}>
        <div className="pg-tip-h">
          <span>{guide.title} · {i + 1} / {steps.length}</span>
          <button onClick={() => onClose(false)} aria-label="Fermer"><X size={16} /></button>
        </div>
        <div className="pg-bar"><i style={{ width: ((i + 1) / steps.length) * 100 + "%" }} /></div>
        <h3>{step.title}</h3>
        <p>{step.text}</p>
        {missing && <p className="pg-note">Cet élément n'est pas affiché pour l'instant, par exemple parce qu'il n'y a pas encore de données ou parce qu'il apparaît après une action. Passez à la suite, puis relancez le guide plus tard.</p>}
        {step.tryit && <div className="pg-try"><Lightbulb size={15} /><span><b>À essayer :</b> {step.tryit}</span></div>}
        <footer>
          {i > 0
            ? <button className="pg-link" onClick={() => setI(0)}><RotateCcw size={14} />Recommencer</button>
            : <button className="pg-link" onClick={() => onClose(false)}>Passer</button>}
          <div className="pg-btns">
            {i > 0 && <button className="fp-btn ep-small" style={{ margin: 0 }} onClick={prev} aria-label="Précédent"><ArrowLeft size={15} /></button>}
            <button className="fp-btn solid ep-small" style={{ margin: 0 }} onClick={next} autoFocus>{last ? <><Check size={15} />Terminer</> : <>Suivant<ArrowRight size={15} /></>}</button>
          </div>
        </footer>
      </div>
    </>,
    document.body
  );
}

/* ================= BOUTON « ? », MENU ET PROPOSITION ================= */
export default function PageGuide() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const nav = useNavigate();
  const [st, setSt] = useState(() => read(user));
  const [tour, setTour] = useState(null);
  const [menu, setMenu] = useState(false);
  const [prompt, setPrompt] = useState(false);
  const [slot, setSlot] = useState(null);
  const [float, setFloat] = useState(false);
  const pending = useRef(null);
  const pageKey = routeKey(pathname);

  useEffect(() => { setSt(read(user)); }, [user?.id]);
  const update = (fn) => setSt((c) => { const n = { ...c, ...fn(c) }; try { localStorage.setItem(skey(user), JSON.stringify(n)); } catch {} return n; });

  // emplacement du bouton dans la barre du haut
  useEffect(() => {
    let box = null, n = 0, t;
    const attach = () => {
      const host = document.querySelector(".topbar .tright");
      if (!host) return false;
      box = document.createElement("span");
      box.style.display = "contents";
      host.insertBefore(box, host.firstChild);
      setSlot(box);
      return true;
    };
    if (!attach()) t = setInterval(() => { if (attach() || ++n > 15) { clearInterval(t); if (!box) setFloat(true); } }, 300);
    return () => { clearInterval(t); if (box) box.remove(); setSlot(null); };
  }, []);

  const start = (k) => {
    if (!GUIDES[k]) return;
    setMenu(false); setPrompt(false); setTour(k);
    update((c) => ({ seen: { ...c.seen, [k]: 1 } }));
  };
  const go = (k) => {
    setMenu(false);
    if (k === "shell" || k === pageKey) { setTimeout(() => start(k), 150); return; }
    pending.current = k;
    nav(k);
  };

  // visite demandée depuis le menu pour une autre page
  useEffect(() => {
    if (!pending.current) return;
    const k = pending.current; pending.current = null;
    const t = setTimeout(() => start(k), 600);
    return () => clearTimeout(t);
  }, [pathname]);

  // proposition à la première visite d'une page
  useEffect(() => {
    setPrompt(false);
    if (tour || !pageKey || !st.auto || st.seen[pageKey] || !welcomed(user)) return;
    try { if (sessionStorage.getItem("pg-later:" + pageKey)) return; } catch {}
    const t = setTimeout(() => setPrompt(true), 1300);
    return () => clearTimeout(t);
  }, [pathname, st.auto, tour]);

  useEffect(() => {
    if (!menu) return;
    const k = (e) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [menu]);

  const unseen = pageKey && !st.seen[pageKey];
  const btn = (
    <button className={float ? "pg-float" : "icon-btn"} data-pg-help="1" style={{ position: float ? undefined : "relative" }} onClick={() => setMenu((m) => !m)} title="Aide et visites guidées" aria-label="Aide et visites guidées" aria-expanded={menu}>
      <HelpCircle size={18} />{unseen && <i className="pg-dot" />}
    </button>
  );

  return (
    <>
      {slot ? createPortal(btn, slot) : float ? btn : null}

      {menu && createPortal(
        <>
          <div className="pg-menu-bg" onClick={() => setMenu(false)} />
          <div className="pg-menu fp-card" role="menu">
            <div className="pg-menu-h"><b>Aide et visites guidées</b><button onClick={() => setMenu(false)} aria-label="Fermer"><X size={16} /></button></div>
            {pageKey ? (
              <button className="pg-main" onClick={() => start(pageKey)}>
                <span><PlayCircle size={20} /></span>
                <div><b>Guide de cette page</b><small>{GUIDES[pageKey].title} · {GUIDES[pageKey].steps.length} étapes · relançable à volonté</small></div>
              </button>
            ) : <p className="pg-none">Cette page n'a pas de guide dédié.</p>}
            <button className="pg-main alt" onClick={() => start("shell")}>
              <span><Compass size={20} /></span>
              <div><b>Découvrir l'interface</b><small>Menu, recherche, thème, notifications, profil</small></div>
            </button>
            <p className="pg-sub">Toutes les visites</p>
            <ul className="pg-list">
              {ORDER.filter((k) => k !== "shell").map((k) => (
                <li key={k}>
                  <button onClick={() => go(k)} className={k === pageKey ? "on" : ""}>
                    <span className={"pg-check" + (st.seen[k] ? " ok" : "")}>{st.seen[k] && <Check size={12} />}</span>
                    <em>{GUIDES[k].title}<small>{GUIDES[k].about}</small></em>
                    <ArrowRight size={14} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="pg-menu-f">
              <label className="pg-sw"><input type="checkbox" checked={st.auto} onChange={(e) => update(() => ({ auto: e.target.checked }))} /><i /><span>Proposer le guide à la première visite d'une page</span></label>
              <button className="pg-link" onClick={() => { update(() => ({ seen: {}, auto: true })); try { Object.keys(sessionStorage).filter((x) => x.startsWith("pg-later:")).forEach((x) => sessionStorage.removeItem(x)); } catch {} toast.success("Visites réinitialisées"); }}><RotateCcw size={13} />Réinitialiser les pages vues</button>
            </div>
          </div>
        </>,
        document.body
      )}

      {prompt && !tour && !menu && pageKey && createPortal(
        <div className="pg-prompt fp-card" role="status">
          <span className="pg-prompt-ico"><Compass size={20} /></span>
          <div className="pg-prompt-t">
            <b>Première visite de « {GUIDES[pageKey].title} » ?</b>
            <p>Découvrez cette page en {Math.max(1, Math.round(GUIDES[pageKey].steps.length / 3))} min, étape par étape.</p>
            <div className="pg-prompt-b">
              <button className="fp-btn solid ep-small" style={{ margin: 0 }} onClick={() => start(pageKey)}>Lancer le guide</button>
              <button className="fp-btn ep-small" style={{ margin: 0 }} onClick={() => { try { sessionStorage.setItem("pg-later:" + pageKey, "1"); } catch {} setPrompt(false); }}>Plus tard</button>
              <button className="pg-link" onClick={() => { update(() => ({ auto: false })); setPrompt(false); toast("Propositions désactivées. Le bouton ? reste disponible."); }}>Ne plus proposer</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {tour && <Tour guide={GUIDES[tour]} onClose={(ok) => { setTour(null); if (ok) toast.success("Guide terminé. Relancez-le quand vous voulez avec le bouton ?"); }} />}
    </>
  );
}