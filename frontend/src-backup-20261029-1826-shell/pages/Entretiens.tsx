/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, type FormEvent, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { CalendarPlus, Clock, ExternalLink, MapPin, Phone, RotateCcw, Video } from "lucide-react";
import { api, C, coerce, list } from "../api";
import { Async, Field, Page, useLoad } from "../ui";

const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
const MODE: Record<string, string> = { visio: "Visio", presentiel: "Présentiel", telephone: "Téléphone" };
const MICON: Record<string, ReactNode> = { visio: <Video size={14} />, presentiel: <MapPin size={14} />, telephone: <Phone size={14} /> };
const toDate = (d?: string) => new Date(!d ? 0 : /(Z|[+-]\d\d:?\d\d)$/i.test(d) ? d : d + "Z");

export default function Entretiens() {
  const [sp] = useSearchParams();
  const [f, setF] = useState({ candidature_id: sp.get("cand") || "", date_heure: "", duree_minutes: "30", mode: C.modes[0], lieu_ou_lien: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [rep, setRep] = useState<{ id: string; v: string } | null>(null);
  const s = useLoad(async () => {
    const [entretiens, cands] = await Promise.all([list("/entretiens"), list("/candidatures/recues")]);
    return { entretiens, cands };
  });
  const set = (k: string) => (x: { target: { value: string } }) => setF({ ...f, [k]: x.target.value });
  const submit = async (ev: FormEvent) => {
    ev.preventDefault(); setBusy(true);
    try {
      await api("/entretiens", "POST", {
        candidature_id: f.candidature_id, date_heure: new Date(f.date_heure).toISOString(),
        duree_minutes: coerce("EntretienCreate", "duree_minutes", f.duree_minutes), mode: f.mode,
        lieu_ou_lien: f.lieu_ou_lien || null, message: f.message || null, fuseau: TZ,
      });
      toast.success("Entretien planifié");
      setF({ ...f, date_heure: "", lieu_ou_lien: "", message: "" }); s.reload();
    } catch (x) { toast.error((x as Error).message); }
    setBusy(false);
  };
  const patch = async (id: string, body: Record<string, unknown>) => {
    try { await api(`/entretiens/${id}`, "PATCH", body); toast.success("Entretien mis à jour"); setRep(null); s.reload(); }
    catch (x) { toast.error((x as Error).message); }
  };
  return (
    <Page title="Entretiens">
      <Async s={s}>{({ entretiens, cands }) => {
        const byId = new Map<string, any>(cands.map((c: any) => [c.id, c] as [string, any]));
        const ouvertes = cands.filter((c: any) => !["refusee", "acceptee"].includes(c.statut));
        const venir = entretiens.filter((x: any) => x.statut === "planifie").sort((a: any, b: any) => +toDate(a.date_heure) - +toDate(b.date_heure));
        const histo = entretiens.filter((x: any) => x.statut !== "planifie").sort((a: any, b: any) => +toDate(b.date_heure) - +toDate(a.date_heure));

        const card = (x: any, past: boolean) => {
          const c = byId.get(x.candidature_id);
          const r = rep && rep.id === x.id ? rep : null;
          const d = toDate(x.date_heure);
          const lien = String(x.lieu_ou_lien || "");
          return (
            <div className={"x-iv" + (past ? " past" : "")} key={x.id}>
              <div className="x-iv-date">
                <b>{d.getDate()}</b><span>{d.toLocaleDateString("fr-FR", { month: "short" })}</span>
              </div>
              <div className="x-iv-body">
                <strong>{c?.candidat_nom ?? "—"}</strong>
                <small className="mut">{c?.offre_titre ?? "—"}</small>
                <div className="x-meta">
                  <span><Clock size={13} /> {d.toLocaleDateString("fr-FR", { weekday: "long" })} · {d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} · {x.duree_minutes} min</span>
                  <span>{MICON[x.mode]} {MODE[x.mode] ?? x.mode}</span>
                  {lien && (/^https?:/i.test(lien)
                    ? <a href={lien} target="_blank" rel="noreferrer"><ExternalLink size={13} /> Rejoindre</a>
                    : <span><MapPin size={13} /> {lien}</span>)}
                </div>
              </div>
              <div className="x-iv-act">
                <select className="x-status" value={x.statut} onChange={(ev) => patch(x.id, { statut: ev.target.value })}>
                  {(C.statutsEntretien.includes(x.statut) ? C.statutsEntretien : [x.statut, ...C.statutsEntretien]).map((v) => <option key={v}>{v}</option>)}
                </select>
                {x.statut === "planifie" && !r && <button className="x-ia" onClick={() => setRep({ id: x.id, v: "" })}><RotateCcw size={15} /> Reporter</button>}
              </div>
              {r && (
                <div className="x-iv-rep">
                  <input type="datetime-local" value={r.v} onChange={(ev) => setRep({ id: x.id, v: ev.target.value })} />
                  <button disabled={!r.v} onClick={() => patch(x.id, { date_heure: new Date(r.v).toISOString(), fuseau: TZ })}>Valider</button>
                  <button className="ghost" onClick={() => setRep(null)}>Annuler</button>
                </div>
              )}
            </div>
          );
        };

        return (
          <>
            <form className="card" onSubmit={submit}>
              <div className="x-sec-h"><span><CalendarPlus size={17} /></span><div><h2>Planifier un entretien</h2><p className="mut">Le candidat est prévenu automatiquement.</p></div></div>
              <div className="row">
                <Field label="Candidat">
                  <select required value={f.candidature_id} onChange={set("candidature_id")}>
                    <option value="">Choisir un candidat</option>
                    {ouvertes.map((c: any) => <option key={c.id} value={c.id}>{c.candidat_nom} — {c.offre_titre}</option>)}
                  </select>
                </Field>
                <Field label="Date et heure"><input type="datetime-local" required value={f.date_heure} onChange={set("date_heure")} /></Field>
                <Field label="Durée (minutes)"><input type="number" min={5} max={480} value={f.duree_minutes} onChange={set("duree_minutes")} /></Field>
                <Field label="Mode"><select value={f.mode} onChange={set("mode")}>{C.modes.map((v) => <option key={v} value={v}>{MODE[v] ?? v}</option>)}</select></Field>
              </div>
              <Field label="Lieu ou lien de visio"><input placeholder="https://meet.google.com/... ou adresse" value={f.lieu_ou_lien} onChange={set("lieu_ou_lien")} /></Field>
              <Field label="Message au candidat"><textarea rows={2} value={f.message} onChange={set("message")} /></Field>
              <button disabled={busy}>{busy ? "Planification..." : "Planifier l'entretien"}</button>
            </form>

            <div className="x-ivh"><h2>À venir</h2><span className="x-count">{venir.length}</span></div>
            {venir.length ? venir.map((x: any) => card(x, false)) : <div className="x-empty"><b>Aucun entretien à venir</b><p className="mut">Planifie ton premier entretien avec le formulaire ci-dessus.</p></div>}

            {histo.length > 0 && (
              <>
                <div className="x-ivh"><h2>Historique</h2><span className="x-count">{histo.length}</span></div>
                {histo.map((x: any) => card(x, true))}
              </>
            )}
          </>
        );
      }}</Async>
    </Page>
  );
}