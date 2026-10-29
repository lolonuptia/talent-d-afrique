// @ts-nocheck
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Copy, ExternalLink, MessageCircle, X } from "lucide-react";
import { fill, normPhone, waLink } from "./wa";
import "./wa.css";

export function WhatsAppDialog({ title, subtitle, templates, vars, phone = "", needPhone = true, onClose, onOpened }) {
  const [tpl, setTpl] = useState(templates[0]?.id);
  const [text, setText] = useState(() => fill(templates[0]?.text, vars));
  const [ph, setPh] = useState(phone || "");
  const [tried, setTried] = useState(false);
  const n = normPhone(ph);
  const bad = needPhone && !n;

  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  const pick = (t) => { setTpl(t.id); setText(fill(t.text, vars)); };
  const open = () => {
    setTried(true);
    if (bad) return;
    window.open(waLink(n, text), "_blank", "noopener,noreferrer");
    onOpened && onOpened({ phone: n, template: tpl });
    toast.success("WhatsApp ouvert : relisez le message puis appuyez sur Envoyer.");
  };
  const copy = () => {
    try { navigator.clipboard.writeText(text).then(() => toast.success("Message copié")).catch(() => toast.error("Copie impossible")); }
    catch { toast.error("Copie impossible"); }
  };

  return createPortal(
    <div className="wa-ov" onClick={onClose}>
      <div className="wa-box" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <header className="wa-h">
          <span className="wa-ico"><MessageCircle size={20} /></span>
          <div><h2>{title}</h2>{subtitle && <small>{subtitle}</small>}</div>
          <button type="button" className="wa-x" onClick={onClose} aria-label="Fermer"><X size={16} /></button>
        </header>

        {needPhone && (
          <label className="wa-f">
            <span>Numéro WhatsApp</span>
            <input className={"wa-in" + (tried && bad ? " err" : "")} inputMode="tel" autoComplete="off" placeholder="77 123 45 67 ou +221 77 123 45 67" value={ph} onChange={(e) => setPh(e.target.value)} autoFocus={!phone} />
            <small className={tried && bad ? "bad" : ""}>{tried && bad ? "Numéro invalide." : n ? "Ouvrira +" + n : "Sans indicatif, +221 (Sénégal) est ajouté."}</small>
          </label>
        )}

        {templates.length > 1 && (
          <div className="wa-pills" role="group" aria-label="Modèles">
            {templates.map((t) => <button type="button" key={t.id} className={tpl === t.id ? "on" : ""} onClick={() => pick(t)}>{t.label}</button>)}
          </div>
        )}

        <label className="wa-f">
          <span>Message</span>
          <textarea className="wa-in" rows={7} maxLength={1500} value={text} onChange={(e) => setText(e.target.value)} />
        </label>

        <div className="wa-prev" aria-hidden="true"><div className="wa-bub">{text || "…"}</div></div>
        <p className="wa-note">Rien n'est envoyé depuis TIBA : WhatsApp s'ouvre avec ce message, et c'est vous qui appuyez sur Envoyer.</p>

        <footer className="wa-foot">
          <button type="button" className="wa-btn" onClick={copy}><Copy size={15} />Copier</button>
          <button type="button" className="wa-btn go" onClick={open} disabled={!text.trim()}><ExternalLink size={15} />Ouvrir WhatsApp</button>
        </footer>
      </div>
    </div>,
    document.body
  );
}