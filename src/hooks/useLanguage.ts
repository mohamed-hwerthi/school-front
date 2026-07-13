import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

export type SupportedLanguage = "fr" | "ar" | "en";

interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  dir: "ltr" | "rtl";
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: "fr", name: "French", nativeName: "Fran\u00e7ais", flag: "\ud83c\uddeb\ud83c\uddf7", dir: "ltr" },
  { code: "ar", name: "Arabic", nativeName: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629", flag: "\ud83c\uddf8\ud83c\udde6", dir: "rtl" },
  { code: "en", name: "English", nativeName: "English", flag: "\ud83c\uddec\ud83c\udde7", dir: "ltr" },
];

export function useLanguage() {
  const { t, i18n } = useTranslation();

  const currentLang = (i18n.language || "fr") as SupportedLanguage;

  const isRTL = currentLang === "ar";

  const currentLanguageInfo = useMemo(
    () => SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0],
    [currentLang]
  );

  const changeLang = useCallback(
    (lang: SupportedLanguage) => {
      i18n.changeLanguage(lang);
      localStorage.setItem("lang", lang);

      // Update document direction for RTL support
      if (lang === "ar") {
        document.documentElement.setAttribute("dir", "rtl");
        document.documentElement.setAttribute("lang", "ar");
      } else {
        document.documentElement.setAttribute("dir", "ltr");
        document.documentElement.setAttribute("lang", lang);
      }
    },
    [i18n]
  );

  return {
    t,
    currentLang,
    changeLang,
    isRTL,
    currentLanguageInfo,
    languages: SUPPORTED_LANGUAGES,
  };
}
