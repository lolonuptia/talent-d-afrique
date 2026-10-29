/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { CalendarPlus, ChevronDown, Columns3, LayoutList, MessageSquare, User } from "lucide-react";
import { api, C, list as getList, qs } from "../api";
import { Async, Err, Field, Page, dispoLabel, useLoad } from "../ui";
import CandidatProfil from "./CandidatProfil";

const LAB: Record<string, string> = {
  competences_obligatoires: "Compétences obligatoires", competences_souhaitees: "Compétences souhaitées",
  experience: "Expérience / TJM", disponibilite: "Disponibilité", soft_skills: "Soft skills",
};
const COL: Record<string, string> = { recue: "#3b82f6", en_cours: "#a855f7", entretien: "#f59e0b", acceptee: "#10b981", refusee: "#94a3b8" };
const col = (s: string) => COL[s] ?? "#64748b";
const lab = (s: string) => s.replace(/_/g, " ");
const PAGE = 100;

function Ring({ v }: { v: number }) {
  const R = 20, CIRC = 2 * Math.PI * R;
  const p = Math.max(0, Math.min(100, v));
  const color = p >= 75 ? "#10b981" : p >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <svg viewBox="0 0 50 50" width="52" height="52" role="img" aria-label={`Score ${Math.round(p)} sur 100`}>
      <circle cx="25" cy="25" r={R} fill="none" stroke="currentColor" opacity=".12" strokeWidth="5" />
      <circle cx="25" cy="25" r={R} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${(p / 100) * CIRC} ${CIRC}`} transform="rotate(-90 25 25)" />
      <text x="25" y="29" textAnchor="middle" fontSize="13" fontWeight="700" fill="currentColor">{Math.round(p)}</text>
    </svg>
  );
}

export default function Candidats() {
  const [sp, setSp] = useSearchParams();
  const offre = sp.get("offre") || "";
  const [q, setQ] = useState({ score_min: "", disponibilite: "", statut: "", page: 0 });
  const [scoreIn, setScoreIn] = useState("");
  const [view, setView] = useState<"liste" | "kanban">(() => (localStorage.getItem("cview") as any) || "liste");
  const timer = useRef<number | undefined>(undefined);
  const [open, setOpen] = useState<string | null>(null);
  const [prof, setProf] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const offres = useLoad(() => getList("/offres/mine"));
  const rows = useLoad(
    () => (offre ? getList(`/candidatures/offre/${offre}/classees${qs({ score_min: q.score_min, disponibilite: q.disponibilite, statut: q.statut, limit: PAGE, offset: q.page * PAGE })}`) : Promise.resolve([] as any[])),
    [offre, q.score_min, q.disponibilite, q.statut, q.page]
  );
  const onScore = (v: string) => {
    setScoreIn(v);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setQ((p) => ({ ...p, score_min: v, page: 0 })), 400);
  };
  const setStatut = async (id: string, statut: string) => {
    try { await api(`/candidatures/${id}/statut`, "PATCH", { statut }); toast.success("Statut : " + lab(statut)); rows.reload(); }
    catch (x) { toast.error((x as Error).message); }
  };
  const switchView = (v: "liste" | "kanban") => { setView(v); localStorage.setItem("cview", v); };

  const actions = (c: any) => (
    <div className="x-cactions">
      <button className="x-ia" onClick={() => setProf(prof === c.id ? null : c.id)}><User size={15} /> Profil</button>
      <button className="x-ia" onClick={() => setOpen(open === c.id ? null : c.id)}><ChevronDown size={15} /> Score</button>
      <Link className="x-ia" to={`/entretiens?cand=${c.id}`}><CalendarPlus size={15} /> Entretien</Link>
      <Link className="x-ia" to={`/messages?c=${c.id}`}><MessageSquare size={15} /> Écrire</Link>
    </div>
  );
  const extra = (c: any) => (
    <>
      {prof === c.id && <div className="x-extra"><CandidatProfil id={c.id} /></div>}
      {open === c.id && (
        <div className="x-extra">
          {Object.entries(c.detail_score || {}).map(([k, v]) => (
            <div key={k} className="x-sc">
              <span>{LAB[k] ?? lab(k)}</span><div className="bar"><i style={{ width: Number(v) + "%" }} /></div><b>{Math.round(Number(v))}</b>
            </div>
          ))}
        </div>
      )}
    </>
  );

  return (
    <Page title="Candidats classés par score" action={
      <div className="x-seg">
        <button className={view === "liste" ? "on" : ""} onClick={() => switchView("liste")}><LayoutList size={15} /> Classement</button>
        <button className={view === "kanban" ? "on" : ""} onClick={() => switchView("kanban")}><Columns3 size={15} /> Kanban</button>
      </div>
    }>
      <div className="card">
        <div className="row">
          <Field label="Offre">
            <select value={offre} onChange={(x) => { setQ({ ...q, page: 0 }); setSp(x.target.value ? { offre: x.target.value } : {}); }}>
              <option value="">Choisir une offre</option>
              {(offres.data || []).map((o: any) => <option key={o.id} value={o.id}>{o.titre}</option>)}
            </select>
          </Field>
          <Field label="Score minimum"><input type="number" min={0} max={100} value={scoreIn} onChange={(x) => onScore(x.target.value)} /></Field>
          <Field label="Disponibilité">
            <select value={q.disponibilite} onChange={(x) => setQ({ ...q, disponibilite: x.target.value, page: 0 })}>
              <option value="">Toutes</option>{C.dispos.map((v) => <option key={v} value={v}>{dispoLabel(v)}</option>)}
            </select>
          </Field>
          <Field label="Statut">
            <select value={q.statut} onChange={(x) => setQ({ ...q, statut: x.target.value, page: 0 })}>
              <option value="">Tous</option>{C.statutsCand.map((v) => <option key={v} value={v}>{lab(v)}</option>)}
            </select>
          </Field>
        </div>
        <Err e={offres.error} />
        {offre && (
          <div className="actions">
            <button className="ghost" disabled={q.page === 0} onClick={() => setQ({ ...q, page: q.page - 1 })}>Précédent</button>
            <button className="ghost" disabled={(rows.data || []).length < PAGE} onClick={() => setQ({ ...q, page: q.page + 1 })}>Suivant</button>
            <span className="mut">Page {q.page + 1}</span>
          </div>
        )}
      </div>

      {!offre ? <div className="x-empty"><b>Aucune offre sélectionnée</b><p className="mut">Choisis une offre pour voir ses candidats classés.</p></div> : (
        <Async s={rows}>{(l) => !l.length ? <div className="x-empty"><b>Aucun candidat</b><p className="mut">Aucun candidat pour ces filtres.</p></div> : view === "liste" ? (
          <div className="x-clist">
            {l.map((c: any, i: number) => (
              <div className="x-cand2" key={c.id} style={{ ["--c" as any]: col(c.statut), animationDelay: Math.min(i, 10) * 35 + "ms" }}>
                <div className="x-cand2-main">
                  <span className="x-rank">#{i + 1}</span>
                  <Ring v={c.score_global} />
                  <div className="x-cand2-id">
                    <strong>{c.candidat_nom || String(c.candidat_id).slice(0, 8)}{c.recommandee && <span className="b b-active">Recommandé</span>}</strong>
                    {c.message && <small className="mut">{c.message}</small>}
                  </div>
                  <select className="x-status" value={c.statut} onChange={(x) => setStatut(c.id, x.target.value)}>
                    {C.statutsCand.map((v) => <option key={v} value={v}>{lab(v)}</option>)}
                  </select>
                </div>
                {actions(c)}
                {extra(c)}
              </div>
            ))}
          </div>
        ) : (
          <div className="x-kanban">
            {C.statutsCand.map((st) => {
              const items = l.filter((c: any) => c.statut === st);
              return (
                <div key={st} className={"x-kcol" + (over === st ? " over" : "")} style={{ ["--c" as any]: col(st) }}
                  onDragOver={(e) => { e.preventDefault(); setOver(st); }}
                  onDragLeave={() => setOver(null)}
                  onDrop={(e) => { e.preventDefault(); setOver(null); const id = e.dataTransfer.getData("text"); const c = l.find((x: any) => x.id === id); if (c && c.statut !== st) setStatut(id, st); }}>
                  <div className="x-kcol-h"><i /> <span>{lab(st)}</span><em>{items.length}</em></div>
                  {items.map((c: any) => (
                    <div key={c.id} className="x-kcard" draggable onDragStart={(e) => e.dataTransfer.setData("text", c.id)}>
                      <div className="x-kcard-top">
                        <strong>{c.candidat_nom || String(c.candidat_id).slice(0, 8)}</strong>
                        <Ring v={c.score_global} />
                      </div>
                      {c.recommandee && <span className="b b-active">Recommandé</span>}
                      <select className="x-status" value={c.statut} onChange={(x) => setStatut(c.id, x.target.value)}>
                        {C.statutsCand.map((v) => <option key={v} value={v}>{lab(v)}</option>)}
                      </select>
                      {actions(c)}
                      {extra(c)}
                    </div>
                  ))}
                  {!items.length && <p className="mut x-kempty">Glisse un candidat ici</p>}
                </div>
              );
            })}
          </div>
        )}</Async>
      )}
    </Page>
  );
}