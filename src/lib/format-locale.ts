import type { SupportedLanguage } from "@/hooks/useLanguage";

/**
 * Langue de l'interface → étiquette BCP 47 pour Intl.
 *
 * `ar-TN` et non `ar` : le Maghreb écrit les nombres en chiffres occidentaux
 * (1234), alors qu'un `ar` générique bascule sur les chiffres orientaux
 * (١٢٣٤) — illisible pour un parent tunisien.
 */
const INTL_LOCALES: Record<SupportedLanguage, string> = {
  fr: "fr-FR",
  ar: "ar-TN",
  en: "en-GB",
};

export function intlLocale(lang: SupportedLanguage): string {
  return INTL_LOCALES[lang] ?? INTL_LOCALES.fr;
}

/** Date courte (03/09/2026). Renvoie un tiret cadratin si la valeur manque. */
export function formatDate(
  value: string | Date | null | undefined,
  lang: SupportedLanguage,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(intlLocale(lang), options);
}

/** Nombre sans décimales, séparateurs selon la langue. */
export function formatNumber(
  value: number | null | undefined,
  lang: SupportedLanguage,
  options?: Intl.NumberFormatOptions
): string {
  return (value ?? 0).toLocaleString(intlLocale(lang), {
    minimumFractionDigits: 0,
    ...options,
  });
}
