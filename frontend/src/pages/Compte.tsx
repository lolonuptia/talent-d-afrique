import { useEffect, useState, type FormEvent } from "react";
import { api, coerce } from "../api";
import { useAuth } from "../auth";
import { Err, Field, Page } from "../ui";

const empty = { logo_url: "", description: "", secteur: "", taille: "", culture: "", localisation: "" };

export function Profil() {
  const [f, setF] = useState<any>(empty);
  const [ok, setOk] = useState("");
  const [e, setE] = useState<Error | null>(null);
  const set = (k: string) => (x: any) => setF({ ...f, [k]: x.target.value });
  useEffect(() => { api("/profiles/me").then((d) => setF({ ...empty, ...d })).catch((x) => { if (x.status !== 404) setE(x); }); }, []);
  const save = async (ev: FormEvent) => {
    ev.preventDefault(); setE(null); setOk("");
    const body = Object.fromEntries(Object.keys(empty).map((k) => [k, coerce("EntrepriseProfileIn", k, f[k])]));
    try { await api("/profiles/me", "PUT", body); setOk("Profil enregistré"); } catch (x) { setE(x as Error); }
  };
  return (
    <Page title="Profil de l'entreprise">
      <form className="card" onSubmit={save}>
        <div className="row">
          <Field label="Secteur"><input value={f.secteur ?? ""} onChange={set("secteur")} /></Field>
          <Field label="Taille"><input value={f.taille ?? ""} onChange={set("taille")} /></Field>
          <Field label="Localisation"><input value={f.localisation ?? ""} onChange={set("localisation")} /></Field>
          <Field label="Adresse du logo (URL)"><input value={f.logo_url ?? ""} onChange={set("logo_url")} /></Field>
        </div>
        <Field label="Description"><textarea rows={4} value={f.description ?? ""} onChange={set("description")} /></Field>
        <Field label="Culture d'entreprise"><textarea rows={3} value={f.culture ?? ""} onChange={set("culture")} /></Field>
        <Err e={e} />{ok && <p className="ok">{ok}</p>}
        <button>Enregistrer</button>
      </form>
    </Page>
  );
}

export function Compte() {
  const { user, logout } = useAuth();
  const [f, setF] = useState({ nom: user.nom, email: user.email });
  const [ok, setOk] = useState("");
  const [conf, setConf] = useState("");
  const [e, setE] = useState<Error | null>(null);
  const save = async (ev: FormEvent) => {
    ev.preventDefault(); setE(null); setOk("");
    try { await api("/users/me", "PATCH", f); setOk("Informations mises à jour"); } catch (x) { setE(x as Error); }
  };
  const exp = async () => {
    try {
      const d = await api("/users/me/export");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(d, null, 2)], { type: "application/json" }));
      a.download = "mes-donnees-talent-afrique.json"; a.click();
    } catch (x) { setE(x as Error); }
  };
  const del = async () => { try { await api("/users/me", "DELETE"); await logout(); } catch (x) { setE(x as Error); } };
  return (
    <Page title="Mon compte">
      <form className="card" onSubmit={save}>
        <h2>Informations</h2>
        <div className="row">
          <Field label="Nom"><input value={f.nom} onChange={(x) => setF({ ...f, nom: x.target.value })} /></Field>
          <Field label="Email"><input type="email" value={f.email} onChange={(x) => setF({ ...f, email: x.target.value })} /></Field>
        </div>
        {ok && <p className="ok">{ok}</p>}<button>Enregistrer</button>
      </form>
      <div className="card"><h2>Mes données</h2><p className="mut">Télécharge une copie de toutes les données de ton compte.</p><button className="ghost" onClick={exp}>Exporter mes données</button></div>
      <div className="card">
        <h2>Supprimer le compte</h2>
        <p className="mut">Le compte est désactivé immédiatement, puis les données sont effacées après 30 jours. Tape SUPPRIMER pour confirmer.</p>
        <Err e={e} />
        <div className="actions"><input style={{ maxWidth: 200 }} value={conf} onChange={(x) => setConf(x.target.value)} /><button className="danger" disabled={conf !== "SUPPRIMER"} onClick={del}>Supprimer mon compte</button></div>
      </div>
    </Page>
  );
}
