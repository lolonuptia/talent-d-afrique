/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Archive, Clock, MapPin, Pencil, Plus, RefreshCw, Search, Trash2, Users } from "lucide-react";
import { api, C, coerce, list } from "../api";
import { Async, Badge, Field, Page, csv, dispoLabel, fdate, useLoad } from "../ui";

export function OffresList() {
  const [st, setSt] = useState("");
  const [q, setQ] = useState("");
  const s = useLoad(async () => {
    const [offres, cands] = await Promise.all([list("/offres/mine"), list("/candidatures/recues").catch(() => [] as any[])]);
    return { offres, cands };
  });
  const act = async (fn: () => Promise<unknown>, ok: string) => {
    try { await fn(); toast.success(ok); s.reload(); } catch (x) { toast.error((x as Error).message); }
  };
  return (
    <Page title="Mes offres" action={<Link className="btn x-add" to="/offres/nouvelle"><Plus size={16} /> Publier une offre</Link>}>
      <Async s={s}>{({ offres, cands }) => {
        const nb = (id: string) => cands.filter((c: any) => c.offre_id === id).length;
        const count = (v: string) => offres.filter((o: any) => !v || o.statut === v).length;
        const l = offres.filter((o: any) => (!st || o.statut === st) && (o.titre || "").toLowerCase().includes(q.trim().toLowerCase()));
        return (
          <>
            <div className="x-toolbar">
              <div className="x-search"><Search size={16} /><input placeholder="Rechercher une offre..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
              <div className="x-pills">
                {["", ...C.statutsOffre].map((v) => (
                  <button key={v || "all"} className={"x-pill" + (st === v ? " on" : "")} onClick={() => setSt(v)}>
                    {v ? v : "Toutes"} <em>{count(v)}</em>
                  </button>
                ))}
              </div>
            </div>
            {l.length ? (
              <div className="x-offers">
                {l.map((o: any, i: number) => (
                  <div className="x-offer" key={o.id} style={{ animationDelay: i * 40 + "ms" }}>
                    <div className="x-offer-top">
                      <h3>{o.titre}</h3>
                      <Badge v={o.statut} />
                    </div>
                    <div className="x-meta">
                      <span className="x-tag">{o.type_contrat}</span>
                      {o.localisation && <span><MapPin size={13} /> {o.localisation}</span>}
                      <span><Clock size={13} /> {fdate(o.created_at)}</span>
                    </div>
                    <Link to={`/candidats?offre=${o.id}`} className="x-count-link">
                      <Users size={16} /> <b>{nb(o.id)}</b> candidat{nb(o.id) > 1 ? "s" : ""}
                    </Link>
                    <div className="x-offer-actions">
                      <Link className="x-ia" to={`/offres/${o.id}/modifier`} title="Modifier"><Pencil size={15} /> Modifier</Link>
                      {o.statut === "active" ? (
                        <>
                          <button className="x-ia" onClick={() => act(() => api(`/offres/${o.id}`, "PATCH", {}), "Offre prolongée")}><RefreshCw size={15} /> Prolonger</button>
                          <button className="x-ia" onClick={() => act(() => api(`/offres/${o.id}`, "PATCH", { statut: "archivee" }), "Offre archivée")}><Archive size={15} /> Archiver</button>
                        </>
                      ) : (
                        <button className="x-ia" onClick={() => act(() => api(`/offres/${o.id}`, "PATCH", { statut: "active" }), "Offre réactivée")}><RefreshCw size={15} /> Réactiver</button>
                      )}
                      <button className="x-ia del" disabled={nb(o.id) > 0} title={nb(o.id) > 0 ? "Archive l'offre : elle a des candidatures" : "Supprimer"}
                        onClick={() => confirm("Supprimer cette offre ?") && act(() => api(`/offres/${o.id}`, "DELETE"), "Offre supprimée")}><Trash2 size={15} /></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="x-empty">
                <b>Aucune offre</b>
                <p className="mut">{offres.length ? "Aucun résultat pour ce filtre." : "Publie ta première offre pour recevoir des candidatures."}</p>
                {!offres.length && <Link className="btn" to="/offres/nouvelle">Publier une offre</Link>}
              </div>
            )}
          </>
        );
      }}</Async>
    </Page>
  );
}

const NIVEAUX: [string, string][] = [["", "Non précisé"], ["debutant", "Débutant"], ["junior", "Junior (0 à 2 ans)"], ["confirme", "Confirmé"], ["senior", "Senior (5 ans et +)"]];
const empty: Record<string, string> = { titre: "", description: "", type_contrat: "stage", obl: "", sou: "", soft: "", niveau: "", disponibilite: "", localisation: "", remuneration: "", tjm: "", statut: "active" };

const Tags = ({ v }: { v: string }) => csv(v).length ? <div className="x-tags">{csv(v).map((t, i) => <span key={t + i}>{t}</span>)}</div> : null;

export function OffreForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const [f, setF] = useState<Record<string, string>>(empty);
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (x: { target: { value: string } }) => setF({ ...f, [k]: x.target.value });

  useEffect(() => {
    if (!id) return;
    api(`/offres/${id}`).then((o) => setF({
      titre: o.titre ?? "", description: o.description ?? "", type_contrat: o.type_contrat, statut: o.statut,
      obl: o.competences_obligatoires ?? "", sou: o.competences_souhaitees ?? "", soft: o.soft_skills ?? "",
      niveau: o.niveau_experience ?? "", disponibilite: o.disponibilite ?? "", localisation: o.localisation ?? "",
      remuneration: String(o.remuneration ?? ""), tjm: String(o.budget_tjm ?? ""),
    })).catch((x) => toast.error((x as Error).message));
  }, [id]);

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    const body: Record<string, unknown> = {
      titre: f.titre.trim(), description: f.description, type_contrat: f.type_contrat,
      competences_obligatoires: csv(f.obl).join(", ") || null,
      competences_souhaitees: csv(f.sou).join(", ") || null,
      soft_skills: csv(f.soft).join(", ") || null,
      niveau_experience: f.niveau || null,
      disponibilite: f.disponibilite || null,
      localisation: f.localisation.trim() || null,
      remuneration: coerce("OffreCreate", "remuneration", f.remuneration),
      budget_tjm: f.type_contrat === "mission" ? coerce("OffreCreate", "budget_tjm", f.tjm) : null,
    };
    if (id) body.statut = f.statut;
    try {
      await api(id ? `/offres/${id}` : "/offres", id ? "PATCH" : "POST", body);
      toast.success(id ? "Offre enregistrée" : "Offre publiée");
      nav("/offres");
    } catch (x) { toast.error((x as Error).message); setBusy(false); }
  };

  return (
    <Page title={id ? "Modifier l'offre" : "Publier une offre"}>
      <form className="x-form" onSubmit={submit}>
        <section className="card x-sec">
          <div className="x-sec-h"><span>1</span><div><h2>Le poste</h2><p className="mut">Un titre clair et une description concrète attirent plus de profils.</p></div></div>
          <Field label="Titre du poste">
            <input required minLength={3} maxLength={120} placeholder="Ex : Développeur React confirmé" value={f.titre} onChange={set("titre")} />
            <small className="x-count-t">{f.titre.length}/120</small>
          </Field>
          <Field label="Description">
            <textarea rows={6} required placeholder="Missions, contexte, équipe, avantages..." value={f.description} onChange={set("description")} />
            <small className="x-count-t">{f.description.length} caractères</small>
          </Field>
        </section>

        <section className="card x-sec">
          <div className="x-sec-h"><span>2</span><div><h2>Contrat et conditions</h2><p className="mut">Les informations utilisées pour le calcul du score.</p></div></div>
          <div className="row">
            <Field label="Type de contrat"><select value={f.type_contrat} onChange={set("type_contrat")}>{C.contrats.map((v) => <option key={v}>{v}</option>)}</select></Field>
            {f.type_contrat === "mission" && <Field label="Budget TJM maximum"><input type="number" min={0} value={f.tjm} onChange={set("tjm")} /></Field>}
            <Field label="Niveau d'expérience">
              <select value={f.niveau} onChange={set("niveau")}>
                {NIVEAUX.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                {f.niveau && !NIVEAUX.some(([v]) => v === f.niveau) && <option value={f.niveau}>{f.niveau}</option>}
              </select>
            </Field>
            <Field label="Disponibilité attendue">
              <select value={f.disponibilite} onChange={set("disponibilite")}>
                <option value="">Non précisée</option>{C.dispos.map((v) => <option key={v} value={v}>{dispoLabel(v)}</option>)}
              </select>
            </Field>
            <Field label="Localisation"><input placeholder="Ex : Dakar" value={f.localisation} onChange={set("localisation")} /></Field>
            <Field label="Rémunération"><input type="number" min={0} value={f.remuneration} onChange={set("remuneration")} /></Field>
            {id && <Field label="Statut"><select value={f.statut} onChange={set("statut")}>{C.statutsOffre.map((v) => <option key={v}>{v}</option>)}</select></Field>}
          </div>
        </section>

        <section className="card x-sec">
          <div className="x-sec-h"><span>3</span><div><h2>Compétences recherchées</h2><p className="mut">Sépare-les par des virgules, elles apparaissent en étiquettes.</p></div></div>
          <Field label="Obligatoires"><input placeholder="React, TypeScript, Git" value={f.obl} onChange={set("obl")} /><Tags v={f.obl} /></Field>
          <Field label="Souhaitées"><input placeholder="Docker, Tests, CI/CD" value={f.sou} onChange={set("sou")} /><Tags v={f.sou} /></Field>
          <Field label="Soft skills"><input placeholder="Autonomie, communication" value={f.soft} onChange={set("soft")} /><Tags v={f.soft} /></Field>
        </section>

        <div className="x-sticky">
          <Link className="btn ghost" to="/offres">Annuler</Link>
          <button disabled={busy}>{busy ? "Enregistrement..." : id ? "Enregistrer" : "Publier l'offre"}</button>
        </div>
      </form>
    </Page>
  );
}