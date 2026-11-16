import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LANGS } from "../i18n";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const cur = (i18n.resolvedLanguage || "fr").slice(0, 2);
  return (
    <label className="icon-btn" title="Language / Langue" style={{ display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
      <Globe size={16} />
      <select
        aria-label="Language"
        value={cur}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        style={{ background: "transparent", border: 0, color: "inherit", font: "inherit", cursor: "pointer" }}
      >
        {LANGS.map((l) => (
          <option key={l.code} value={l.code}>{l.code.toUpperCase()}</option>
        ))}
      </select>
    </label>
  );
}