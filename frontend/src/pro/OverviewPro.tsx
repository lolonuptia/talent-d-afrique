// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Users, CalendarDays, CheckCircle2, Plus, ArrowUpRight, Sparkles, MapPin, Video, Phone, Bell, ChevronRight, Clock, TrendingUp } from "lucide-react";
import { C, list } from "../api";
import { useAuth } from "../auth";
import { Err, fdate, useLoad } from "../ui";
import "../dashboard-pro/dashboard-pro.css";

const toDate = (d) => new Date(!d ? 0 : /(Z|[+-]\d\d:?\d\d)$/i.test(d) ? d : d + "Z");
const lab = (s) => String(s).replace(/_/g, " ");
const pl = (n, w) => n + " " + w + (n > 1 ? "s" : "");
const MI = { visio: Video, presentiel: MapPin, telephone: Phone };
const TONE = { recue: "warn", en_cours: "mute", entretien: "ok", acceptee: "ok", refusee: "mute", active: "ok", expiree: "warn", archivee: "mute" };

function series(dates, range) {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const n = range === "7j" ? 7 : range === "30j" ? 30 : 12;
  const step = range === "90j" ? 7 : 1;
  const counts = Array(n).fill(0), labels = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(now); d.setDate(d.getDate() - (n - 1 - i) * step);
    labels.push(range === "7j" ? d.toLocaleDateString("fr-FR", { weekday: "short" }) : range === "30j" ? String(d.getDate()) : d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }));
  }
  dates.forEach((dt) => {
    const days = Math.max(0, Math.floor((now - new Date(dt.getFullYear(), dt.getMonth(), dt.getDate())) / 864e5));
    const idx = n - 1 - Math.floor(days / step);
    if (idx >= 0 && idx < n) counts[idx]++;
  });
  return { counts, labels };
}
function spark(dates) {
  const c = series(dates, "90j").counts;
  let acc = dates.length - c.reduce((a, b) => a + b, 0);
  return c.map((v) => (acc += v));
}
const whenLabel = (d) => {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const days = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - t) / 864e5);
  return days === 0 ? "Aujourd'hui" : days === 1 ? "Demain" : d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
};

function useCountUp(target, duration = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf, start;
    const tick = (t) => {
      if (!start) start = t;
      const p = Math.min((t - start) / duration, 1);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

function Spark({ data, color }) {
  const w = 100, h = 32;
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((d, i) => [(i / (data.length - 1)) * w, h - ((d - min) / (max - min || 1)) * (h - 6) - 3]);
  const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const id = "sg" + color.replace("#", "");
  return (
    <svg viewBox={"0 0 " + w + " " + h} preserveAspectRatio="none" className="dp-spark" aria-hidden>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".35" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <path d={line + " L" + w + " " + h + " L0 " + h + " Z"} fill={"url(#" + id + ")"} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AreaChart({ data, labels }) {
  const W = 600, H = 230, P = { t: 16, r: 12, b: 26, l: 32 };
  const max = Math.max(...data, 1) * 1.15;
  const x = (i) => P.l + (i / (data.length - 1)) * (W - P.l - P.r);
  const y = (v) => P.t + (1 - v / max) * (H - P.t - P.b);
  const line = data.map((v, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1)).join(" ");
  const area = line + " L" + x(data.length - 1) + " " + (H - P.b) + " L" + x(0) + " " + (H - P.b) + " Z";
  const [hover, setHover] = useState(null);
  const ref = useRef(null);
  const step = Math.ceil(data.length / 6);
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const rel = ((cx - r.left) / r.width) * W;
    const i = Math.round(((rel - P.l) / (W - P.l - P.r)) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  };
  return (
    <div className="dp-chart">
      <svg ref={ref} viewBox={"0 0 " + W + " " + H} onMouseMove={onMove} onTouchMove={onMove} onMouseLeave={() => setHover(null)} onTouchEnd={() => setHover(null)}>
        <defs><linearGradient id="dpArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0f9d73" stopOpacity=".38" /><stop offset="1" stopColor="#0f9d73" stopOpacity="0" /></linearGradient></defs>
        {[0, 0.33, 0.66, 1].map((t) => {
          const val = Math.round(max * t);
          return (<g key={t}><line x1={P.l} x2={W - P.r} y1={y(val)} y2={y(val)} className="dp-grid-line" /><text x={P.l - 6} y={y(val) + 4} textAnchor="end" className="dp-axis">{val}</text></g>);
        })}
        {labels.map((l, i) => i % step === 0 && <text key={i} x={x(i)} y={H - 6} textAnchor="middle" className="dp-axis">{l}</text>)}
        <path d={area} fill="url(#dpArea)" />
        <path d={line} fill="none" stroke="#0f9d73" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {hover !== null && (<g><line x1={x(hover)} x2={x(hover)} y1={P.t} y2={H - P.b} className="dp-cursor" /><circle cx={x(hover)} cy={y(data[hover])} r="6" fill="#fff" stroke="#0f9d73" strokeWidth="3" /></g>)}
      </svg>
      {hover !== null && (
        <div className="dp-tip" style={{ left: (x(hover) / W) * 100 + "%", top: (y(data[hover]) / H) * 100 + "%" }}>
          <b>{data[hover]}</b> candidature{data[hover] > 1 ? "s" : ""}<small>{labels[hover]}</small>
        </div>
      )}
    </div>
  );
}

const Head = ({ title, sub, right }) => (<div className="dp-head"><div><h2>{title}</h2>{sub && <p>{sub}</p>}</div>{right}</div>);

function Kpi({ k, i }) {
  const v = useCountUp(k.value);
  const Icon = k.icon;
  return (
    <article className="dp-card dp-kpi dp-in" style={{ "--i": i }}>
      <div className="dp-kpi-top">
        <span className="dp-ico" style={{ "--c": k.color }}><Icon size={18} /></span>
        {k.delta ? <span className="dp-delta"><TrendingUp size={12} />{k.delta}</span> : null}
      </div>
      <div className="dp-kpi-val">{v.toLocaleString("fr-FR")}</div>
      <div className="dp-kpi-lab">{k.label}</div>
      {k.data && k.data.length > 1 ? <Spark data={k.data} color={k.color} /> : <div style={{ height: 34 }} />}
    </article>
  );
}

export default function OverviewPro() {
  const { user } = useAuth();
  const [range, setRange] = useState("30j");
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);
  const s = useLoad(async () => {
    const [offres, cands, entretiens, notifs] = await Promise.all([
      list("/offres/mine"), list("/candidatures/recues"),
      list("/entretiens").catch(() => []), list("/notifications").catch(() => []),
    ]);
    return { offres, cands, entretiens, notifs };
  }, [], 60000);

  if (s.error) return <div className="dp"><Err e={s.error} /></div>;
  if (!s.data) return <div className="dp"><p className="dp-empty">Chargement…</p></div>;

  const { offres, cands, entretiens, notifs } = s.data;
  const now = Date.now();
  const n = (st) => cands.filter((c) => c.statut === st).length;
  const byId = new Map(cands.map((c) => [c.id, c]));
  const venir = entretiens.filter((x) => x.statut === "planifie" && +toDate(x.date_heure) > now - 36e5).sort((a, b) => +toDate(a.date_heure) - +toDate(b.date_heure));
  const candDates = cands.map((c) => toDate(c.created_at));
  const last7 = candDates.filter((d) => now - +d < 7 * 864e5).length;
  const cur = series(candDates, range);
  const total = cur.counts.reduce((a, b) => a + b, 0);
  const aTraiter = n("recue");
  const nbOf = (id) => cands.filter((c) => c.offre_id === id).length;
  const maxNb = Math.max(1, ...offres.map((o) => nbOf(o.id)));
  const h = new Date().getHours();
  const hello = h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir";

  const KPIS = [
    { label: "Offres actives", value: offres.filter((o) => o.statut === "active").length, icon: Briefcase, color: "#0f9d73", data: spark(offres.map((o) => toDate(o.created_at))) },
    { label: "Candidatures", value: cands.length, delta: last7 ? "+" + last7 + " / 7 j" : "", icon: Users, color: "#d4a017", data: spark(candDates) },
    { label: "Entretiens à venir", value: venir.length, icon: CalendarDays, color: "#3b82f6", data: spark(entretiens.map((x) => toDate(x.date_heure))) },
    { label: "Acceptées", value: n("acceptee"), icon: CheckCircle2, color: "#8b5cf6" },
  ];

  return (
    <div className="dp">
      <section className="dp-hero dp-in" style={{ "--i": 0 }}>
        <div className="dp-hero-glow" aria-hidden />
        <span className="dp-chip"><Sparkles size={14} /> Espace recruteur</span>
        <h1>{hello}, {user?.nom} 👋</h1>
        <p>{aTraiter > 0 ? <>Vous avez <b>{pl(aTraiter, "candidature")} à traiter</b></> : "Aucune candidature en attente"}{venir.length > 0 ? <> et <b>{pl(venir.length, "entretien")}</b> à venir.</> : "."}</p>
        <div className="dp-hero-cta">
          <Link className="dp-btn dp-btn-gold" to="/offres/nouvelle"><Plus size={16} /> Publier une offre</Link>
          <Link className="dp-btn dp-btn-ghost" to="/candidats">Voir les candidats <ArrowUpRight size={16} /></Link>
        </div>
      </section>

      <section className="dp-kpis">{KPIS.map((k, i) => <Kpi key={k.label} k={k} i={i + 1} />)}</section>

      <div className="dp-cols">
        <div className="dp-col">
          <article className="dp-card dp-in" style={{ "--i": 5 }}>
            <Head title="Candidatures reçues" sub={pl(total, "candidature") + " sur la période"}
              right={<div className="dp-seg">{["7j", "30j", "90j"].map((r) => <button key={r} className={r === range ? "on" : ""} onClick={() => setRange(r)}>{r}</button>)}</div>} />
            <AreaChart key={range} data={cur.counts} labels={cur.labels} />
          </article>

          <article className="dp-card dp-in" style={{ "--i": 6 }}>
            <Head title="Candidatures par statut" sub="Répartition actuelle" />
            <ul className="dp-funnel">
              {C.statutsCand.map((st, i) => (
                <li key={st}>
                  <div className="dp-funnel-row"><span style={{ textTransform: "capitalize" }}>{lab(st)}</span><b>{n(st)}</b></div>
                  <div className="dp-bar"><i style={{ width: mounted && cands.length ? (100 * n(st)) / cands.length + "%" : "0%", transitionDelay: i * 90 + "ms" }} /></div>
                </li>
              ))}
            </ul>
          </article>

          <article className="dp-card dp-in" style={{ "--i": 7 }}>
            <Head title="Mes offres" sub="Candidats par offre" right={<Link className="dp-link" to="/offres">Tout voir <ChevronRight size={14} /></Link>} />
            {offres.length ? (
              <ul className="dp-offers">
                {offres.slice(0, 5).map((o) => (
                  <li key={o.id} className="dp-offer">
                    <div className="dp-offer-top">
                      <div className="dp-offer-main"><Link to={"/candidats?offre=" + o.id} style={{ color: "inherit", textDecoration: "none" }}><strong>{o.titre}</strong></Link><span>{[o.localisation, o.type_contrat].filter(Boolean).join(" · ")}</span></div>
                      <div className="dp-offer-side"><span className={"dp-badge " + (TONE[o.statut] || "mute")}>{lab(o.statut)}</span><span className="dp-offer-n"><Users size={13} />{nbOf(o.id)}</span></div>
                    </div>
                    <div className="dp-bar"><i style={{ width: mounted ? (100 * nbOf(o.id)) / maxNb + "%" : "0%" }} /></div>
                  </li>
                ))}
              </ul>
            ) : <p className="dp-empty">Aucune offre pour l'instant. Publiez la première pour recevoir des candidatures.</p>}
          </article>
        </div>

        <div className="dp-col">
          <article className="dp-card dp-in" style={{ "--i": 5 }}>
            <Head title="Dernières candidatures" right={<Link className="dp-link" to="/candidats">Classement <ChevronRight size={14} /></Link>} />
            {cands.length ? (
              <ul className="dp-talents">
                {cands.slice(0, 5).map((c) => (
                  <li key={c.id}>
                    <span className="dp-avatar">{(c.candidat_nom || "?").split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}</span>
                    <div className="dp-talent-txt"><strong>{c.candidat_nom}</strong><span>{c.offre_titre}</span></div>
                    <Link to={"/candidats?offre=" + c.offre_id} className={"dp-badge " + (TONE[c.statut] || "mute")} style={{ textDecoration: "none", textTransform: "capitalize" }}>{lab(c.statut)}</Link>
                  </li>
                ))}
              </ul>
            ) : <p className="dp-empty">Aucune candidature pour l'instant.</p>}
          </article>

          <article className="dp-card dp-in" style={{ "--i": 6 }}>
            <Head title="Entretiens à venir" right={<Link className="dp-link" to="/entretiens">Agenda <ChevronRight size={14} /></Link>} />
            {venir.length ? (
              <ul className="dp-timeline">
                {venir.slice(0, 4).map((x) => {
                  const d = toDate(x.date_heure), c = byId.get(x.candidature_id), I = MI[x.mode] || Video;
                  return (
                    <li key={x.id}>
                      <div className="dp-time"><b>{d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</b><span>{whenLabel(d)}</span></div>
                      <div className="dp-int"><strong>{c?.candidat_nom ?? "—"}</strong><span>{c?.offre_titre ?? ""}</span><em><I size={12} /> {x.mode} · {x.duree_minutes} min</em></div>
                    </li>
                  );
                })}
              </ul>
            ) : <p className="dp-empty">Aucun entretien planifié.</p>}
          </article>

          <article className="dp-card dp-in" style={{ "--i": 7 }}>
            <Head title="Activité récente" right={<Link className="dp-link" to="/notifications">Tout voir <ChevronRight size={14} /></Link>} />
            {notifs.length ? (
              <ul className="dp-feed">
                {notifs.slice(0, 4).map((a) => (
                  <li key={a.id}>
                    <span className="dp-ico sm" style={{ "--c": a.lue ? "#94a3b8" : "#0f9d73" }}><Bell size={14} /></span>
                    <div><p style={{ fontWeight: a.lue ? 400 : 700 }}>{a.titre}</p><small><Clock size={11} /> {fdate(a.created_at)}</small></div>
                  </li>
                ))}
              </ul>
            ) : <p className="dp-empty">Aucune notification.</p>}
          </article>
        </div>
      </div>
    </div>
  );
}