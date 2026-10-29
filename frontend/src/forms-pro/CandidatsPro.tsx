// @ts-nocheck
import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { CalendarPlus, ChevronDown, ChevronLeft, ChevronRight, Columns3, LayoutList, MessageSquare, Sparkles, User } from "lucide-react";
import { api, C, list as getList, qs } from "../api";
import { Async, Err, dispoLabel, useLoad } from "../ui";
import CandidatProfil from "../pages/CandidatProfil";
import { Field } from "./FormsPro";
import { MessageCircle } from "lucide-react";
import { useAuth } from "../auth";
import { WhatsAppDialog } from "../whatsapp/WhatsAppDialog";
import { CANDIDAT_TEMPLATES } from "../whatsapp/wa";
import "./forms-pro.css";

const LAB = {
  competences_obligatoires: "Compétences obligatoires", competences_souhaitees: "Compétences souhaitées",
  experience: "Expérience / TJM", disponibilite: "Disponibilité", soft_skills: "Soft skills",
};
const COL = { recue: "#3b82f6", en_cours: "#a855f7", entretien: "#f59e0b", acceptee: "#10b981", refusee: "#94a3b8" };
const col = (s) => COL[s] ?? "#64748b";
const lab = (s) => String(s).replace(/_/g, " ");
const PAGE = 100;
const MEDAL = ["#e3b023", "#9ca3af", "#c2793a"];
const scoreColor = (p) => (p >= 75 ? "#10b981" : p >= 50 ? "#f59e0b" : "#ef4444");

function Ring({ v }) {
  const R = 20, CIRC = 2 * Math.PI * R;
  const p = Math.max(0, Math.min(100, Number(v) || 0));
  return (
    <svg viewBox="0 0 50 50" width="54" height="54" role="img" aria-label={"Score " + Math.round(p) + " sur 100"} style={{ flex: "none" }}>
      <circle cx="25" cy="25" r={R} fill="none" stroke="currentColor" opacity=".12" strokeWidth="5" />
      <circle cx="25" cy="25" r={R} fill="none" stroke={scoreColor(p)} strokeWidth="5" strokeLinecap="round" strokeDasharray={(p / 100) * CIRC + " " + CIRC} transform="rotate(-90 25 25)" />
      <text x="25" y="29" textAnchor="middle" fontSize="13" fontWeight="700" fill="currentColor">{Math.round(p)}</text>
    </svg>
  );
}

export default function CandidatsPro() {
  const [sp, setSp] = useSearchParams();
  const offre = sp.get("offre") || "";
  const [q, setQ] = useState({ score_min: "", disponibilite: "", statut: "", page: 0 });
  const [scoreIn, setScoreIn] = useState("0");
  const [view, setView] = useState(() => localStorage.getItem("cview") || "liste");
  const timer = useRef(undefined);
  const [open, setOpen] = useState(null);
  const [prof, setProf] = useState(null);
  const [over, setOver] = useState(null);
  const { user } = useAuth();
  const [wa, setWa] = useState(null);
  const [waPh, setWaPh] = useState("");
  const openWa = async (c) => {
    let p = "";
    try { const d = await api("/candidatures/" + c.id + "/candidat"); p = d?.telephone || ""; } catch {}
    if (!p) { try { p = localStorage.getItem("wa:" + c.candidat_id) || ""; } catch {} }
    setWaPh(p); setWa(c);
  };
  const offres = useLoad(() => getList("/offres/mine"));
  const rows = useLoad(
    () => (offre ? getList("/candidatures/offre/" + offre + "/classees" + qs({ score_min: q.score_min, disponibilite: q.disponibilite, statut: q.statut, limit: PAGE, offset: q.page * PAGE })) : Promise.resolve([])),
    [offre, q.score_min, q.disponibilite, q.statut, q.page]
  );

  const onScore = (v) => {
    setScoreIn(v);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setQ((p) => ({ ...p, score_min: v === "0" ? "" : v, page: 0 })), 400);
  };
  const setStatut = async (id, statut) => {
    try { await api("/candidatures/" + id + "/statut", "PATCH", { statut }); toast.success("Statut : " + lab(statut)); rows.reload(); }
    catch (x) { toast.error(x.message); }
  };
  const switchView = (v) => { setView(v); localStorage.setItem("cview", v); };

  const data = rows.data || [];
  const avg = data.length ? Math.round(data.reduce((a, c) => a + (Number(c.score_global) || 0), 0) / data.length) : 0;
  const reco = data.filter((c) => c.recommandee).length;
  const acc = data.filter((c) => c.statut === "acceptee").length;
  const nomOf = (c) => c.candidat_nom || String(c.candidat_id).slice(0, 8);
  const initials = (c) => nomOf(c).split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const actions = (c) => (
    <div className="cp-actions">
      <button className="cp-act" onClick={() => setProf(prof === c.id ? null : c.id)}><User size={14} />Profil</button>
      <button className="cp-act" onClick={() => setOpen(open === c.id ? null : c.id)}><ChevronDown size={14} />Score</button>
      <Link className="cp-act" to={"/entretiens?cand=" + c.id}><CalendarPlus size={14} />Entretien</Link>
      <Link className="cp-act" to={"/messages?c=" + c.id}><MessageSquare size={14} />Écrire</Link>
      <button className="cp-act wa" onClick={() => openWa(c)}><MessageCircle size={14} />WhatsApp</button>
    </div>
  );
  const extra = (c) => (
    <>
      {prof === c.id && <div className="cp-extra"><CandidatProfil id={c.id} /></div>}
      {open === c.id && (
        <div className="cp-extra">
          {Object.entries(c.detail_score || {}).map(([k, v]) => (
            <div key={k} className="cp-sc">
              <span>{LAB[k] ?? lab(k)}</span>
              <div className="cp-bar"><i style={{ width: Math.max(0, Math.min(100, Number(v))) + "%", background: scoreColor(Number(v)) }} /></div>
              <b>{Math.round(Number(v))}</b>
            </div>
          ))}
          {!Object.keys(c.detail_score || {}).length && <p style={{ opacity: 0.6, margin: 0 }}>Aucun détail disponible.</p>}
        </div>
      )}
    </>
  );
  const statusSel = (c) => (
    <select className="fp-input cp-status" style={{ "--c": col(c.statut) }} value={c.statut} onChange={(x) => setStatut(c.id, x.target.value)}>
      {C.statutsCand.map((v) => <option key={v} value={v}>{lab(v)}</option>)}
    </select>
  );

  return (
    <div className="fp">
      <section className="fp-hero">
        <div className="cp-hero-top">
          <div>
            <span className="fp-hero-chip"><Sparkles size={14} />Classement intelligent</span>
            <h1>Candidats</h1>
            <p>Les profils les plus adaptés à votre offre, classés par score.</p>
          </div>
          <div className="cp-toggle">
            <button className={view === "liste" ? "on" : ""} onClick={() => switchView("liste")}><LayoutList size={15} />Classement</button>
            <button className={view === "kanban" ? "on" : ""} onClick={() => switchView("kanban")}><Columns3 size={15} />Kanban</button>
          </div>
        </div>
        {offre && (
          <div className="ep-stats">
            <div><b>{data.length}</b> candidats</div>
            <div><b>{reco}</b> recommandés</div>
            <div><b>{avg}</b> score moyen</div>
            <div><b>{acc}</b> acceptés</div>
          </div>
        )}
      </section>

      <div className="fp-card">
        <div className="fp-grid2">
          <Field label="Offre">
            <select className="fp-input" value={offre} onChange={(x) => { setQ({ ...q, page: 0 }); setSp(x.target.value ? { offre: x.target.value } : {}); }}>
              <option value="">Choisir une offre</option>
              {(offres.data || []).map((o) => <option key={o.id} value={o.id}>{o.titre}</option>)}
            </select>
          </Field>
          <Field label="Disponibilité">
            <select className="fp-input" value={q.disponibilite} onChange={(x) => setQ({ ...q, disponibilite: x.target.value, page: 0 })}>
              <option value="">Toutes</option>{C.dispos.map((v) => <option key={v} value={v}>{dispoLabel(v)}</option>)}
            </select>
          </Field>
        </div>
        <div style={{ height: 14 }} />
        <Field label="Score minimum" right={scoreIn === "0" ? "Aucun" : "≥ " + scoreIn}>
          <input className="cp-range" type="range" min="0" max="100" step="5" value={scoreIn} onChange={(x) => onScore(x.target.value)} />
        </Field>
        <div style={{ height: 14 }} />
        <Field label="Statut">
          <div className="cp-pills">
            {["", ...C.statutsCand].map((v) => (
              <button key={v || "all"} className={q.statut === v ? "on" : ""} onClick={() => setQ({ ...q, statut: v, page: 0 })}>{v ? lab(v) : "Tous"}</button>
            ))}
          </div>
        </Field>
        <Err e={offres.error} />
        {wa && <WhatsAppDialog
          title={"WhatsApp : " + nomOf(wa)} subtitle="Candidature à votre offre"
          templates={CANDIDAT_TEMPLATES}
          vars={{ nom: nomOf(wa), offre: (offres.data || []).find((o) => o.id === offre)?.titre || "", entreprise: user.nom, expediteur: user.nom, date: "[date à préciser]", lien: "" }}
          phone={waPh}
          onOpened={({ phone }) => { try { localStorage.setItem("wa:" + wa.candidat_id, phone); } catch {} }}
          onClose={() => setWa(null)} />}
        {offre && (
          <div className="cp-pager">
            <button className="fp-btn ep-small" disabled={q.page === 0} onClick={() => setQ({ ...q, page: q.page - 1 })}><ChevronLeft size={15} />Précédent</button>
            <span>Page {q.page + 1}</span>
            <button className="fp-btn ep-small" disabled={data.length < PAGE} onClick={() => setQ({ ...q, page: q.page + 1 })}>Suivant<ChevronRight size={15} /></button>
          </div>
        )}
      </div>

      {!offre ? (
        <div className="fp-card ep-empty"><b>Aucune offre sélectionnée</b><p>Choisissez une offre pour voir ses candidats classés.</p></div>
      ) : (
        <Async s={rows}>{(l) => !l.length ? (
          <div className="fp-card ep-empty"><b>Aucun candidat</b><p>Aucun candidat pour ces filtres.</p></div>
        ) : view === "liste" ? (
          <div className="cp-list">
            {l.map((c, i) => {
              const top = q.page === 0 && i < 3;
              return (
                <div className={"cp-card fp-card" + (top ? " top" : "")} key={c.id} style={{ "--c": col(c.statut), "--m": top ? MEDAL[i] : "transparent" }}>
                  <div className="cp-main">
                    <span className={"cp-rank" + (top ? " medal" : "")}>{top ? "★" : "#" + (q.page * PAGE + i + 1)}</span>
                    <span className="cp-ava">{initials(c)}</span>
                    <div className="cp-id">
                      <strong>{nomOf(c)}{c.recommandee && <span className="cp-reco">Recommandé</span>}</strong>
                      <small>{c.message || (top ? "Top " + (i + 1) + " du classement" : lab(c.statut))}</small>
                    </div>
                    <Ring v={c.score_global} />
                  </div>
                  <div className="cp-line">{statusSel(c)}{actions(c)}</div>
                  {extra(c)}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="cp-kanban">
            {C.statutsCand.map((st) => {
              const items = l.filter((c) => c.statut === st);
              return (
                <div key={st} className={"cp-kcol" + (over === st ? " over" : "")} style={{ "--c": col(st) }}
                  onDragOver={(e) => { e.preventDefault(); setOver(st); }}
                  onDragLeave={() => setOver(null)}
                  onDrop={(e) => { e.preventDefault(); setOver(null); const id = e.dataTransfer.getData("text"); const c = l.find((x) => x.id === id); if (c && c.statut !== st) setStatut(id, st); }}>
                  <div className="cp-kh"><i /><span>{lab(st)}</span><em>{items.length}</em></div>
                  {items.map((c) => (
                    <div key={c.id} className="cp-kcard" draggable onDragStart={(e) => e.dataTransfer.setData("text", c.id)}>
                      <div className="cp-ktop">
                        <div style={{ minWidth: 0 }}>
                          <strong>{nomOf(c)}</strong>
                          {c.recommandee && <span className="cp-reco">Recommandé</span>}
                        </div>
                        <Ring v={c.score_global} />
                      </div>
                      {statusSel(c)}
                      {actions(c)}
                      {extra(c)}
                    </div>
                  ))}
                  {!items.length && <p className="cp-kempty">Glissez un candidat ici</p>}
                </div>
              );
            })}
          </div>
        )}</Async>
      )}
    </div>
  );
}