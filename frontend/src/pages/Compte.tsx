/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, type FormEvent } from "react";
import { api, coerce } from "../api";
import { useAuth } from "../auth";
import { Err, Field, Page } from "../ui";

const empty: Record<string, any> = { logo_url: "", description: "", secteur: "", taille: "", culture: "", localisation: "" };

export function Profil() {
  const [f, setF] = useState<Record<string, any>>(empty);
  const [ok, setOk] = useState("");
  const [e, setE] = useState<Error | null>(null);
  const set = (k: string) => (x: { target: { value: string } }) => setF({ ...f, [k]: x.target.value });
  useEffect(() => { api("/profiles/me").then((d) => setF({ ...empty, ...d })).catch((x) => { if (x.status !== 404) setE(x); }); }, []);
  const save = async (ev: FormEvent) => {
    ev.preventDefault(); setE(null); setOk("");
    const body = Object.fromEntries(Object.keys(empty).map((k) => [k, coerce("EntrepriseProfileIn", k, f[k])]));
    try { await api("/profiles/me", "PUT", body); setOk("Profil enregistré"); } catch (x) { setE(x as Error); }
  };
  const logo = String(f.logo_url ?? "");
  return (
    <Page title="Profil de l'entreprise">
      <form className="card" onSubmit={save}>
        <div className="row">
          <Field label="Secteur"><input value={f.secteur ?? ""} onChange={set("secteur")} /></Field>
          <Field label="Taille"><input value={f.taille ?? ""} onChange={set("taille")} /></Field>
          <Field label="Localisation"><input value={f.localisation ?? ""} onChange={set("localisation")} /></Field>
          <Field label="Adresse du logo (URL)"><input type="url" placeholder="https://..." value={f.logo_url ?? ""} onChange={set("logo_url")} /></Field>
        </div>
        {/^https?:\/\//i.test(logo) && <p><img src={logo} alt="Logo" style={{ maxHeight: 64 }} /></p>}
        <Field label="Description"><textarea rows={4} value={f.description ?? ""} onChange={set("description")} /></Field>
        <Field label="Culture d'entreprise"><textarea rows={3} value={f.culture ?? ""} onChange={set("culture")} /></Field>
        <Err e={e} />{ok && <p className="ok">{ok}</p>}
        <button>Enregistrer</button>
      </form>
    </Page>
  );
}

export function Compte() {
  const { user, setUser, logout } = useAuth();
  const [f, setF] = useState({ nom: user.nom, email: user.email });
  const [ok, setOk] = useState("");
  const [conf, setConf] = useState("");
  const [mdpActuel, setMdpActuel] = useState("");
  const [eInfo, setEInfo] = useState<Error | null>(null);
  const [eExp, setEExp] = useState<Error | null>(null);
  const [eDel, setEDel] = useState<Error | null>(null);
  const [pw, setPw] = useState({ ancien: "", nouveau: "" });
  const [okPw, setOkPw] = useState("");
  const [ePw, setEPw] = useState<Error | null>(null);
  const savePw = async (ev: FormEvent) => {
    ev.preventDefault(); setEPw(null); setOkPw("");
    try {
      await api("/auth/change-password", "POST", { ancien_mot_de_passe: pw.ancien, nouveau_mot_de_passe: pw.nouveau });
      setPw({ ancien: "", nouveau: "" }); setOkPw("Mot de passe modifié");
    } catch (x) { setEPw(x as Error); }
  };
  const save = async (ev: FormEvent) => {
    ev.preventDefault(); setEInfo(null); setOk("");
    try { const u = await api("/users/me", "PATCH", f.email !== user.email ? { ...f, mot_de_passe_actuel: mdpActuel } : f); setUser(u); setMdpActuel(""); setOk("Informations mises à jour"); } catch (x) { setEInfo(x as Error); }
  };
  const exp = async () => {
    try {
      setEExp(null);
      const d = await api("/users/me/export");
      const a = document.createElement("a");
      const url = URL.createObjectURL(new Blob([JSON.stringify(d, null, 2)], { type: "application/json" }));
      a.href = url; a.download = "mes-donnees-talent-afrique.json"; a.click();
      URL.revokeObjectURL(url);
    } catch (x) { setEExp(x as Error); }
  };
  const del = async () => {
    if (!confirm("Cette action est définitive après 30 jours. Confirmer la suppression ?")) return;
    try { setEDel(null); await api("/users/me", "DELETE"); await logout(); } catch (x) { setEDel(x as Error); }
  };
  return (
    <Page title="Mon compte">
      <form className="card" onSubmit={save}>
        <h2>Informations</h2>
        <div className="row">
          <Field label="Nom"><input required minLength={2} value={f.nom} onChange={(x) => setF({ ...f, nom: x.target.value })} /></Field>
          <Field label="Email"><input type="email" required value={f.email} onChange={(x) => setF({ ...f, email: x.target.value })} /></Field>
          {f.email !== user.email && <Field label="Mot de passe actuel (requis pour changer l'email)"><input type="password" required value={mdpActuel} onChange={(x) => setMdpActuel(x.target.value)} /></Field>}
        </div>
        <Err e={eInfo} />{ok && <p className="ok">{ok}</p>}<button>Enregistrer</button>
      </form>
      <form className="card" onSubmit={savePw}>
        <h2>Mot de passe</h2>
        <div className="row">
          <Field label="Mot de passe actuel"><input type="password" required value={pw.ancien} onChange={(x) => setPw({ ...pw, ancien: x.target.value })} /></Field>
          <Field label="Nouveau mot de passe (8 caractères minimum)"><input type="password" required minLength={8} value={pw.nouveau} onChange={(x) => setPw({ ...pw, nouveau: x.target.value })} /></Field>
        </div>
        <Err e={ePw} />{okPw && <p className="ok">{okPw}</p>}<button>Changer le mot de passe</button>
      </form>
      <div className="card"><h2>Mes données</h2><p className="mut">Télécharge une copie de toutes les données de ton compte.</p><Err e={eExp} /><button className="ghost" onClick={exp}>Exporter mes données</button></div>
      <div className="card">
        <h2>Supprimer le compte</h2>
        <p className="mut">Le compte est désactivé immédiatement, puis les données sont effacées après 30 jours. Tape SUPPRIMER pour confirmer.</p>
        <Err e={eDel} />
        <div className="actions"><input style={{ maxWidth: 200 }} value={conf} onChange={(x) => setConf(x.target.value)} /><button className="danger" disabled={conf !== "SUPPRIMER"} onClick={del}>Supprimer mon compte</button></div>
      </div>
    </Page>
  );
}