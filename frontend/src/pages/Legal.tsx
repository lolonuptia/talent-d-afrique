import type { ReactNode } from "react";
import { Link } from "react-router-dom";

function Doc({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ maxWidth: 760, margin: "6vh auto", padding: "0 16px" }}>
      <h1 style={{ marginBottom: 16 }}>{title}</h1>
      <p className="err">Modèle à compléter et à faire valider avant publication : remplace tout ce qui est entre [crochets], puis supprime ce bandeau.</p>
      <div className="card">{children}</div>
      <p className="mut">Version 2026-09-06 · <Link to="/login">Retour</Link></p>
    </div>
  );
}

export function Cgu() {
  return (
    <Doc title="Conditions d'utilisation">
      <h2>1. Objet</h2>
      <p>Talent d'Afrique met en relation des entreprises, des étudiants et des freelances. Ces conditions encadrent l'utilisation de l'espace web réservé aux entreprises.</p>
      <h2>2. Éditeur</h2>
      <p>[Nom de la société], [forme juridique], [adresse], [email de contact].</p>
      <h2>3. Compte entreprise</h2>
      <p>Les informations fournies doivent être exactes. Le compte est réservé aux personnes habilitées à représenter l'entreprise. Les identifiants sont confidentiels et l'entreprise répond de l'usage qui en est fait.</p>
      <h2>4. Offres publiées</h2>
      <p>Les offres doivent être réelles, licites et non discriminatoires. Aucun paiement ne peut être demandé à un candidat. Une offre reste en ligne 60 jours après sa dernière modification, sauf prolongation. Talent d'Afrique peut retirer toute offre contraire à ces règles.</p>
      <h2>5. Données des talents</h2>
      <p>Les profils, CV et messages des candidats ne peuvent être utilisés que pour le recrutement. Toute copie, revente, démarchage étranger au recrutement ou collecte automatisée est interdit.</p>
      <h2>6. Suppression du compte</h2>
      <p>Depuis « Mon compte », le compte est désactivé immédiatement et ses offres sont archivées. Les données sont effacées définitivement après 30 jours.</p>
      <h2>7. Responsabilité</h2>
      <p>[À compléter : limites de responsabilité, disponibilité du service.]</p>
      <h2>8. Droit applicable</h2>
      <p>[À compléter : droit applicable et juridiction compétente.]</p>
    </Doc>
  );
}

export function Confidentialite() {
  return (
    <Doc title="Politique de confidentialité">
      <h2>Responsable du traitement</h2>
      <p>[Nom de la société], [adresse], [email de contact].</p>
      <h2>Données collectées</h2>
      <p>Nom, email et mot de passe (chiffré) du compte ; profil de l'entreprise ; offres publiées ; candidatures reçues, entretiens et messages échangés ; données techniques de connexion.</p>
      <h2>Finalités et bases légales</h2>
      <p>Fournir le service et mettre en relation entreprises et candidats (exécution du contrat) ; envoyer les notifications et emails liés à votre activité ; sécuriser la plateforme. L'inscription vaut consentement à ce traitement.</p>
      <h2>Destinataires</h2>
      <p>Les candidats concernés voient le nom de l'entreprise et ses offres. Nos prestataires techniques interviennent comme sous-traitants : hébergeur [nom, pays], service d'envoi d'emails Resend.</p>
      <h2>Durées de conservation</h2>
      <p>Les données sont conservées tant que le compte est actif, puis effacées 30 jours après sa suppression. [Préciser les durées légales éventuelles.]</p>
      <h2>Vos droits</h2>
      <p>Accès et portabilité : « Mon compte » puis « Exporter mes données ». Rectification : « Profil entreprise » et « Mon compte ». Suppression : « Mon compte ». Pour tout autre droit (opposition, limitation) : [email de contact].</p>
      <h2>Réclamation</h2>
      <p>Vous pouvez saisir l'autorité de protection des données de votre pays (au Sénégal : la Commission de protection des données personnelles, CDP).</p>
    </Doc>
  );
}