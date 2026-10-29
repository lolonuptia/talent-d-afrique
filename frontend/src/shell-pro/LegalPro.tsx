// @ts-nocheck
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft, FileText, Printer, ShieldCheck } from "lucide-react";
import { useAuth } from "../auth";

const VERSION = "2026-09-06";
const CGU = [
  ["Objet", "TIBA met en relation des entreprises, des étudiants et des freelances. Ces conditions encadrent l'utilisation de l'espace web réservé aux entreprises."],
  ["Éditeur", "[Nom de la société], [forme juridique], [adresse], [email de contact]."],
  ["Compte entreprise", "Les informations fournies doivent être exactes. Le compte est réservé aux personnes habilitées à représenter l'entreprise. Les identifiants sont confidentiels et l'entreprise répond de l'usage qui en est fait."],
  ["Offres publiées", "Les offres doivent être réelles, licites et non discriminatoires. Aucun paiement ne peut être demandé à un candidat. Une offre reste en ligne 60 jours après sa dernière modification, sauf prolongation. TIBA peut retirer toute offre contraire à ces règles."],
  ["Données des talents", "Les profils, CV et messages des candidats ne peuvent être utilisés que pour le recrutement. Toute copie, revente, démarchage étranger au recrutement ou collecte automatisée est interdit."],
  ["Suppression du compte", "Depuis « Mon compte », le compte est désactivé immédiatement et ses offres sont archivées. Les données sont effacées définitivement après 30 jours."],
  ["Responsabilité", "[À compléter : limites de responsabilité, disponibilité du service.]"],
  ["Droit applicable", "[À compléter : droit applicable et juridiction compétente.]"],
];
const CONF = [
  ["Responsable du traitement", "[Nom de la société], [adresse], [email de contact]."],
  ["Données collectées", "Nom, email et mot de passe (chiffré) du compte ; numéro de téléphone (facultatif, communiqué aux entreprises seulement si vous l'autorisez) ; profil de l'entreprise ; offres publiées ; candidatures reçues, entretiens et messages échangés ; données techniques de connexion."],
  ["Finalités et bases légales", "Fournir le service et mettre en relation entreprises et candidats (exécution du contrat) ; envoyer les notifications et emails liés à votre activité ; sécuriser la plateforme. L'inscription vaut consentement à ce traitement."],
  ["Destinataires", "Les candidats concernés voient le nom de l'entreprise et ses offres. Nos prestataires techniques interviennent comme sous-traitants : hébergeur [nom, pays], service d'envoi d'emails Resend."],
  ["Durées de conservation", "Les données sont conservées tant que le compte est actif, puis effacées 30 jours après sa suppression. [Préciser les durées légales éventuelles.]"],
  ["Vos droits", "Accès et portabilité : « Mon compte » puis « Exporter mes données ». Rectification : « Profil entreprise » et « Mon compte ». Suppression : « Mon compte ». Pour tout autre droit (opposition, limitation) : [email de contact]."],
  ["Réclamation", "Vous pouvez saisir l'autorité de protection des données de votre pays (au Sénégal : la Commission de protection des données personnelles, CDP)."],
];

const hl = (t) => t.split(/(\[[^\]]+\])/g).map((p, i) => (/^\[.*\]$/.test(p) ? <mark key={i}>{p}</mark> : p));

function Doc({ title, lead, icon: I, sections, kind }) {
  const auth = useAuth();
  const [active, setActive] = useState("s0");
  const todo = (sections.map((s) => s[1]).join(" ").match(/\[[^\]]+\]/g) || []).length;
  useEffect(() => {
    const els = sections.map((_, i) => document.getElementById("s" + i)).filter(Boolean);
    const io = new IntersectionObserver((en) => {
      const v = en.filter((x) => x.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (v) setActive(v.target.id);
    }, { rootMargin: "-15% 0px -70% 0px" });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [sections]);
  const jump = (i) => (e) => { e.preventDefault(); document.getElementById("s" + i)?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  return (
    <div className="lg">
      <div className="lg-wrap">
        <div className="lg-top">
          <Link className="lg-back" to={auth?.user ? "/compte" : "/login"}><ArrowLeft size={15} />Retour</Link>
          <button className="lg-print" onClick={() => window.print()}><Printer size={15} />Imprimer</button>
        </div>
        <header className="lg-hero">
          <span className="lg-chip"><I size={14} />Document légal</span>
          <h1>{title}</h1>
          <p>{lead}</p>
          <div className="lg-tabs">
            <Link className={"lg-tab" + (kind === "cgu" ? " on" : "")} to="/cgu">Conditions d'utilisation</Link>
            <Link className={"lg-tab" + (kind === "conf" ? " on" : "")} to="/confidentialite">Confidentialité</Link>
          </div>
        </header>
        <div className="lg-notice">
          <AlertTriangle size={18} />
          <span>Modèle à compléter et à faire valider avant publication{todo ? " : " + todo + " élément" + (todo > 1 ? "s" : "") + " à remplacer (surlignés en jaune)" : ""}. Remplacez tout ce qui est entre [crochets], puis supprimez ce bandeau.</span>
        </div>
        <div className="lg-body">
          <nav className="lg-toc" aria-label="Sommaire">
            {sections.map(([t], i) => (
              <a key={t} href={"#s" + i} className={active === "s" + i ? "on" : ""} onClick={jump(i)}>{i + 1}. {t}</a>
            ))}
          </nav>
          <div className="lg-secs">
            {sections.map(([t, p], i) => (
              <section className="lg-sec" id={"s" + i} key={t}>
                <h2><span className="lg-num">{i + 1}</span>{t}</h2>
                <p>{hl(p)}</p>
              </section>
            ))}
          </div>
        </div>
        <p className="lg-ver">Version {VERSION}</p>
      </div>
    </div>
  );
}

export function Cgu() {
  return <Doc kind="cgu" icon={FileText} title="Conditions d'utilisation" lead="Les règles d'utilisation de l'espace web réservé aux entreprises." sections={CGU} />;
}
export function Confidentialite() {
  return <Doc kind="conf" icon={ShieldCheck} title="Politique de confidentialité" lead="Comment vos données sont collectées, utilisées et protégées." sections={CONF} />;
}