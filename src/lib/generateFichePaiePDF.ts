import jsPDF from "jspdf";
import { CURRENCY } from "@/config/currency";
import type { SchoolInfo } from "@/types/school";

export interface FichePaieData {
  reference: string;
  employeName: string;
  employeType: string;
  moisLabel: string;
  annee: number;
  salaireBase: number;
  primes: number;
  retenues: number;
  salaireNet: number;
  datePaiement: string | null;
  paye: boolean;
  commentaire: string | null;
}

const MOIS_FR: Record<number, string> = {
  1: "Janvier", 2: "Fevrier", 3: "Mars", 4: "Avril", 5: "Mai", 6: "Juin",
  7: "Juillet", 8: "Aout", 9: "Septembre", 10: "Octobre", 11: "Novembre", 12: "Decembre",
};

export const moisLabel = (m: number): string => MOIS_FR[m] ?? String(m);

function fmtDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

function fmtMontant(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " " + CURRENCY;
}

export function generateFichePaiePDF(fp: FichePaieData, school: SchoolInfo) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const marginL = 18;
  const marginR = 18;
  const contentW = W - marginL - marginR;
  let y = 18;

  const BLACK: [number, number, number] = [0, 0, 0];
  const DARK: [number, number, number] = [40, 40, 40];
  const MID: [number, number, number] = [110, 110, 110];
  const LIGHT_BORDER: [number, number, number] = [180, 180, 180];

  doc.setTextColor(...BLACK);
  doc.setDrawColor(...BLACK);

  // ── Header ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(school.nom.toUpperCase(), marginL, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...DARK);
  doc.text(`${school.adresse}, ${school.ville}`, marginL, y + 5);
  doc.text(`Tel: ${school.telephone}   Email: ${school.email}`, marginL, y + 9);

  // Right side: title + meta
  doc.setTextColor(...BLACK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("FICHE DE PAIE", W - marginR, y, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...DARK);
  doc.text(`Reference : ${fp.reference}`, W - marginR, y + 5, { align: "right" });
  doc.text(`Periode : ${fp.moisLabel} ${fp.annee}`, W - marginR, y + 9, { align: "right" });

  y += 14;
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.5);
  doc.line(marginL, y, W - marginR, y);
  doc.setLineWidth(0.2);

  y += 8;

  // ── Employé info (2-column table without fills) ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...BLACK);
  doc.text("INFORMATIONS DE L'EMPLOYE", marginL, y);
  y += 4;

  doc.setDrawColor(...LIGHT_BORDER);
  doc.rect(marginL, y, contentW, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  const col1 = marginL + 4;
  const col2 = marginL + contentW / 2 + 4;

  const labelKV = (label: string, value: string, x: number, yy: number) => {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MID);
    doc.text(label, x, yy);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BLACK);
    doc.text(value, x + 32, yy);
  };

  labelKV("Nom :", fp.employeName, col1, y + 6);
  labelKV("Categorie :", fp.employeType, col2, y + 6);
  labelKV("Periode :", `${fp.moisLabel} ${fp.annee}`, col1, y + 13);
  labelKV("Date paiement :", fmtDate(fp.datePaiement), col2, y + 13);

  y += 26;

  // ── Détail rémunération (table with grid) ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...BLACK);
  doc.text("DETAIL DE LA REMUNERATION", marginL, y);
  y += 4;

  const colDesignationW = contentW * 0.65;
  const colMontantW = contentW - colDesignationW;
  const colMontantX = marginL + colDesignationW;

  // Header row
  const headerH = 8;
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.3);
  doc.rect(marginL, y, contentW, headerH);
  doc.line(colMontantX, y, colMontantX, y + headerH);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...BLACK);
  doc.text("DESIGNATION", marginL + 3, y + 5.5);
  doc.text("MONTANT", colMontantX + colMontantW - 3, y + 5.5, { align: "right" });
  y += headerH;

  // Body rows
  const rowH = 8;
  const drawRow = (label: string, amount: number, sign: "" | "+" | "-" = "", bold = false) => {
    doc.setDrawColor(...LIGHT_BORDER);
    doc.setLineWidth(0.2);
    doc.rect(marginL, y, contentW, rowH);
    doc.line(colMontantX, y, colMontantX, y + rowH);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    doc.text(label, marginL + 3, y + 5.5);
    doc.setTextColor(...BLACK);
    doc.text(`${sign}${fmtMontant(amount)}`, colMontantX + colMontantW - 3, y + 5.5, { align: "right" });
    y += rowH;
  };

  drawRow("Salaire de base", fp.salaireBase);
  drawRow("Primes", fp.primes, "+");
  drawRow("Retenues", fp.retenues, "-");

  // Total row (bold, double border on top)
  const totalH = 10;
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.5);
  doc.rect(marginL, y, contentW, totalH);
  doc.line(colMontantX, y, colMontantX, y + totalH);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text("SALAIRE NET A PAYER", marginL + 3, y + 6.5);
  doc.text(fmtMontant(fp.salaireNet), colMontantX + colMontantW - 3, y + 6.5, { align: "right" });
  y += totalH + 8;

  // ── Statut & date ──
  doc.setLineWidth(0.3);
  doc.setDrawColor(...BLACK);
  const statutLabel = fp.paye ? "PAYE" : "EN ATTENTE";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  const badgeW = doc.getTextWidth(statutLabel) + 8;
  doc.rect(marginL, y, badgeW, 6);
  doc.setTextColor(...BLACK);
  doc.text(statutLabel, marginL + 4, y + 4.2);

  if (fp.paye && fp.datePaiement) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MID);
    doc.text(`Paye le ${fmtDate(fp.datePaiement)}`, marginL + badgeW + 6, y + 4.2);
  }
  y += 12;

  // ── Montant en lettres / récap ──
  doc.setDrawColor(...LIGHT_BORDER);
  doc.setLineWidth(0.2);
  doc.rect(marginL, y, contentW, 14);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...MID);
  doc.text("Arrete la presente fiche a la somme nette de :", marginL + 4, y + 5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text(fmtMontant(fp.salaireNet), marginL + 4, y + 11);
  y += 20;

  // ── Commentaire ──
  if (fp.commentaire && fp.commentaire.trim()) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...BLACK);
    doc.text("Observations :", marginL, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(fp.commentaire, contentW);
    doc.text(lines, marginL, y + 5);
    y += 5 + lines.length * 5 + 4;
  }

  // ── Signatures ──
  const sigY = Math.max(y + 10, H - 50);
  const sigBoxW = (contentW - 20) / 2;
  const sigH = 28;

  doc.setDrawColor(...LIGHT_BORDER);
  doc.setLineWidth(0.2);
  doc.rect(marginL, sigY, sigBoxW, sigH);
  doc.rect(marginL + sigBoxW + 20, sigY, sigBoxW, sigH);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...DARK);
  doc.text("Cachet et signature de l'etablissement", marginL + 4, sigY + 5);
  doc.text("Signature de l'employe", marginL + sigBoxW + 24, sigY + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...MID);
  doc.text("(Date, signature et cachet)", marginL + 4, sigY + 9);
  doc.text("(Lu et approuve, date et signature)", marginL + sigBoxW + 24, sigY + 9);

  // ── Footer ──
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.3);
  doc.line(marginL, H - 14, W - marginR, H - 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...MID);
  doc.text(
    `${school.nom} — ${school.adresse}, ${school.ville} — Tel : ${school.telephone}`,
    W / 2, H - 9, { align: "center" }
  );
  doc.text("Document genere automatiquement par le systeme de gestion scolaire.", W / 2, H - 5, { align: "center" });

  doc.save(`FichePaie_${fp.reference}_${fp.moisLabel}_${fp.annee}.pdf`);
}
