import jsPDF from "jspdf";
import { CURRENCY } from "@/config/currency";
import { MOIS_LABELS } from "@/types/finance";
import type { SchoolInfo } from "@/types/school";

export interface RecuData {
  reference: string;
  studentName: string;
  classe: string;
  /** Parent / tuteur payeur — affiché sur le reçu s'il est renseigné. */
  parentName?: string;
  parentTelephone?: string;
  typeFrais: string;
  mois: string;
  anneeScolaire: string;
  montantDu: number;
  montantPaye: number;
  datePaiement: string | null;
  modePaiement: string | null;
  statut: string;
}

function fmtDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function fmtMontant(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " " + CURRENCY;
}

// ── Montant en toutes lettres (français) ────────────────────────────
const UNITS = [
  "zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
  "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize",
  "dix-sept", "dix-huit", "dix-neuf",
];
const TENS = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"];

function below100(n: number): string {
  if (n < 20) return UNITS[n];
  const t = Math.floor(n / 10);
  const u = n % 10;
  // 70-79 et 90-99 se construisent sur soixante / quatre-vingt + 10-19.
  if (t === 7 || t === 9) {
    return u === 1 && t === 7 ? `${TENS[t]} et onze` : `${TENS[t]}-${UNITS[10 + u]}`;
  }
  if (u === 0) return TENS[t] + (t === 8 ? "s" : "");
  if (u === 1 && t !== 8) return `${TENS[t]} et un`;
  return `${TENS[t]}-${UNITS[u]}`;
}

function below1000(n: number): string {
  if (n < 100) return below100(n);
  const c = Math.floor(n / 100);
  const rest = n % 100;
  if (rest === 0) return c === 1 ? "cent" : `${UNITS[c]} cents`;
  return c === 1 ? `cent ${below100(rest)}` : `${UNITS[c]} cent ${below100(rest)}`;
}

function enLettres(n: number): string {
  if (n === 0) return "zéro";
  const parts: string[] = [];
  const millions = Math.floor(n / 1_000_000);
  const milliers = Math.floor((n % 1_000_000) / 1000);
  const reste = n % 1000;
  if (millions > 0) parts.push(millions === 1 ? "un million" : `${below1000(millions)} millions`);
  if (milliers > 0) parts.push(milliers === 1 ? "mille" : `${below1000(milliers)} mille`);
  if (reste > 0) parts.push(below1000(reste));
  return parts.join(" ");
}

/**
 * « cent cinquante dinars et 500 millimes ».
 * Le libellé dinars/millimes n'est employé que pour le dinar tunisien ;
 * toute autre devise retombe sur « <lettres> <CODE> » pour ne rien inventer.
 */
function montantEnLettres(n: number): string {
  const entier = Math.floor(n);
  const millimes = Math.round((n - entier) * 1000);
  if (CURRENCY !== "TND") {
    return `${enLettres(entier)} ${CURRENCY}`;
  }
  const base = `${enLettres(entier)} dinar${entier > 1 ? "s" : ""}`;
  return millimes > 0 ? `${base} et ${millimes} millimes` : base;
}

export function generateRecuPDF(recu: RecuData, school: SchoolInfo) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const marginL = 20;
  const marginR = 20;
  const contentW = W - marginL - marginR;
  const right = W - marginR;

  // Palette strictement monochrome.
  const BLACK: [number, number, number] = [0, 0, 0];
  const GREY: [number, number, number] = [110, 110, 110];
  const RULE: [number, number, number] = [170, 170, 170];
  const FILL: [number, number, number] = [240, 240, 240];

  const setText = (c: [number, number, number]) => doc.setTextColor(c[0], c[1], c[2]);
  const setDraw = (c: [number, number, number]) => doc.setDrawColor(c[0], c[1], c[2]);
  const setFill = (c: [number, number, number]) => doc.setFillColor(c[0], c[1], c[2]);

  /** Intitulé de section : petites capitales sur filet plein. */
  const section = (titre: string, y: number): number => {
    setText(BLACK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(titre.toUpperCase(), marginL, y);
    setDraw(BLACK);
    doc.setLineWidth(0.4);
    doc.line(marginL, y + 1.8, right, y + 1.8);
    return y + 7;
  };

  let y = 20;

  // ── En-tête ──────────────────────────────────────────────────────
  setText(BLACK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(school.nom, marginL, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setText(GREY);
  let hy = y + 5.5;
  if (school.adresse) {
    doc.text(school.adresse, marginL, hy);
    hy += 4;
  }
  const contact = [school.telephone, school.email].filter(Boolean).join("  ·  ");
  if (contact) doc.text(contact, marginL, hy);

  // Bloc titre à droite
  setText(BLACK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("REÇU DE PAIEMENT", right, y, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setText(GREY);
  doc.text(`N° ${recu.reference}`, right, y + 5.5, { align: "right" });
  doc.text(
    `Date : ${fmtDate(recu.datePaiement || new Date().toISOString().split("T")[0])}`,
    right,
    y + 9.5,
    { align: "right" }
  );

  y = 42;
  setDraw(BLACK);
  doc.setLineWidth(0.6);
  doc.line(marginL, y, right, y);
  y += 10;

  // ── Élève & payeur ───────────────────────────────────────────────
  y = section("Élève et payeur", y);

  const labelW = 38;
  const midX = marginL + contentW / 2;

  /** Ligne « intitulé / valeur », sur une demi-largeur ou toute la largeur. */
  const field = (label: string, value: string, x: number, yy: number) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setText(GREY);
    doc.text(label, x, yy);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setText(BLACK);
    doc.text(value || "—", x + labelW, yy);
  };

  field("Élève", recu.studentName, marginL, y);
  field("Classe", recu.classe, midX, y);
  y += 6.5;
  field("Année scolaire", recu.anneeScolaire, marginL, y);
  if (recu.parentTelephone) field("Téléphone", recu.parentTelephone, midX, y);
  y += 6.5;
  // Le payeur figure sur le reçu : c'est lui qui s'en prévaut.
  field("Parent / tuteur", recu.parentName || "—", marginL, y);

  y += 12;

  // ── Détail du paiement ───────────────────────────────────────────
  y = section("Détail du paiement", y);

  // Colonnes : désignation | mois | montant dû | montant payé
  const cDesig = marginL + 2;
  const cMois = marginL + 78;
  const cDu = marginL + 112;
  const cPaye = right - 2;
  const rowH = 9;

  // En-tête de tableau
  setFill(FILL);
  setDraw(RULE);
  doc.setLineWidth(0.2);
  doc.rect(marginL, y, contentW, rowH, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  setText(BLACK);
  doc.text("Désignation", cDesig, y + 6);
  doc.text("Mois", cMois, y + 6);
  doc.text("Montant dû", cDu + 28, y + 6, { align: "right" });
  doc.text("Montant payé", cPaye, y + 6, { align: "right" });
  y += rowH;

  // Ligne unique
  doc.rect(marginL, y, contentW, rowH, "D");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(recu.typeFrais, cDesig, y + 6);
  doc.text(recu.mois ? (MOIS_LABELS[recu.mois] ?? recu.mois) : "—", cMois, y + 6);
  doc.text(fmtMontant(recu.montantDu), cDu + 28, y + 6, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.text(fmtMontant(recu.montantPaye), cPaye, y + 6, { align: "right" });
  y += rowH + 8;

  // ── Récapitulatif chiffré, aligné à droite ───────────────────────
  const solde = Math.max(0, recu.montantDu - recu.montantPaye);
  const boxW = 82;
  const boxX = right - boxW;

  const totalRow = (label: string, value: string, yy: number, strong = false) => {
    doc.setFont("helvetica", strong ? "bold" : "normal");
    doc.setFontSize(strong ? 10 : 9);
    setText(BLACK);
    doc.text(label, boxX + 3, yy);
    doc.text(value, right - 3, yy, { align: "right" });
  };

  setDraw(RULE);
  doc.setLineWidth(0.2);
  doc.line(boxX, y - 5, right, y - 5);
  totalRow("Montant dû", fmtMontant(recu.montantDu), y);
  y += 6;
  totalRow("Montant payé", fmtMontant(recu.montantPaye), y);
  y += 3;
  setDraw(BLACK);
  doc.setLineWidth(0.4);
  doc.line(boxX, y, right, y);
  y += 6;
  totalRow("Reste à payer", fmtMontant(solde), y, true);
  y += 4;
  doc.setLineWidth(0.4);
  doc.line(boxX, y, right, y);

  // Mode de paiement et statut, à gauche du récapitulatif
  let ly = y - 19;
  field("Mode de paiement", recu.modePaiement ?? "—", marginL, ly);
  ly += 6.5;
  field("Statut", recu.statut, marginL, ly);

  y += 12;

  // ── Arrêté en lettres ────────────────────────────────────────────
  setDraw(RULE);
  doc.setLineWidth(0.2);
  const arretH = 16;
  doc.rect(marginL, y, contentW, arretH, "D");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setText(GREY);
  doc.text("Arrêté le présent reçu à la somme de :", marginL + 3, y + 5.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  setText(BLACK);
  const lettres = montantEnLettres(recu.montantPaye);
  // Première lettre en capitale, repli sur plusieurs lignes si nécessaire.
  const phrase = lettres.charAt(0).toUpperCase() + lettres.slice(1);
  doc.text(doc.splitTextToSize(phrase, contentW - 6), marginL + 3, y + 11.5);

  y += arretH + 16;

  // ── Signatures ───────────────────────────────────────────────────
  const sigW = 62;
  const sigH = 26;
  setDraw(RULE);
  doc.setLineWidth(0.2);
  doc.rect(marginL, y, sigW, sigH, "D");
  doc.rect(right - sigW, y, sigW, sigH, "D");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setText(GREY);
  doc.text("Cachet de l'établissement", marginL + sigW / 2, y + 5, { align: "center" });
  doc.text("Signature du responsable", right - sigW / 2, y + 5, { align: "center" });

  // ── Pied de page ─────────────────────────────────────────────────
  const footerY = H - 15;
  setDraw(RULE);
  doc.setLineWidth(0.2);
  doc.line(marginL, footerY - 6, right, footerY - 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  setText(GREY);
  const pied = [school.nom, school.adresse, school.telephone, school.email]
    .filter(Boolean)
    .join("  ·  ");
  doc.text(pied, W / 2, footerY - 1, { align: "center" });
  doc.text("Ce document est un reçu de paiement officiel.", W / 2, footerY + 3, {
    align: "center",
  });

  doc.save(`Recu_${recu.reference}.pdf`);
}
