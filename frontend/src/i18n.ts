import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en.json";
import pt from "./locales/pt.json";

export const LANGS = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "pt", label: "Português" },
];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { fr: { translation: {} }, en: { translation: en }, pt: { translation: pt } },
    fallbackLng: "fr",
    supportedLngs: LANGS.map((l) => l.code),
    load: "languageOnly",
    nsSeparator: false,
    keySeparator: false,
    interpolation: { escapeValue: false },
    detection: { order: ["localStorage", "navigator"], caches: ["localStorage"], lookupLocalStorage: "lang" },
  });

const applyLang = (l: string) => {
  document.documentElement.lang = l;
  document.documentElement.dir = i18n.dir(l);
};
applyLang(i18n.resolvedLanguage || "fr");
i18n.on("languageChanged", applyLang);

export default i18n;