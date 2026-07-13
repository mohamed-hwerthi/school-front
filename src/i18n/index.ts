import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import fr from "./locales/fr.json";
import ar from "./locales/ar.json";
import en from "./locales/en.json";

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    ar: { translation: ar },
    en: { translation: en },
  },
  lng: localStorage.getItem("lang") || "fr",
  fallbackLng: "fr",
  interpolation: {
    escapeValue: false,
  },
});

// Apply RTL direction on initial load if Arabic is selected
const currentLang = localStorage.getItem("lang") || "fr";
if (currentLang === "ar") {
  document.documentElement.setAttribute("dir", "rtl");
  document.documentElement.setAttribute("lang", "ar");
} else {
  document.documentElement.setAttribute("dir", "ltr");
  document.documentElement.setAttribute("lang", currentLang);
}

export default i18n;
