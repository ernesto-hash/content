import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import pt from "./locales/pt.json";
import en from "./locales/en.json";
import es from "./locales/es.json";

function normalizeLanguage(lang: string): string {
  const base = lang.split("-")[0].toLowerCase();
  if (base === "pt") return "pt";
  if (base === "es") return "es";
  return "en";
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      pt: { translation: pt },
      en: { translation: en },
      es: { translation: es },
    },
    fallbackLng: "en",
    supportedLngs: ["pt", "en", "es"],
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "i18n_language",
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false,
    },
    load: "languageOnly",
    debug: false,
  });

// Normaliza o idioma detectado para o conjunto suportado
const normalized = normalizeLanguage(i18n.language ?? "en");
if (normalized !== i18n.language) {
  i18n.changeLanguage(normalized);
}

export default i18n;
