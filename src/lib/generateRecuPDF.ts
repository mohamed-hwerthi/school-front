import jsPDF from "jspdf";
import { CURRENCY } from "@/config/currency";
import { MOIS_LABELS } from "@/types/finance";
import type { SchoolInfo } from "@/types/school";

export interface RecuData {
  reference: string;
  studentName: string;
  classe: string;
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

export function generateRecuPDF(recu: RecuData, school: SchoolInfo) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const marginL = 20;
  const marginR = 20;
  const contentW = W - marginL - marginR;
  let y = 20;

  // ── Header band ──
  doc.setFillColor(109, 40, 217); // violet-600
  doc.rect(0, 0, W, 38, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(school.nom, marginL, 16);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`${school.adresse}, ${school.ville}`, marginL, 23);
  doc.text(`Tel: ${school.telephone}  |  ${school.email}`, marginL, 29);

  // "REÇU DE PAIEMENT" on the right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("RECU DE PAIEMENT", W - marginR, 16, { align: "right" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`N° ${recu.reference}`, W - marginR, 23, { align: "right" });
  doc.text(`Date: ${fmtDate(recu.datePaiement || new Date().toISOString().split("T")[0])}`, W - marginR, 29, { align: "right" });

  y = 48;

  // ── Student info box ──
  doc.setTextColor(60, 60, 60);
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(248, 248, 252);
  doc.roundedRect(marginL, y, contentW, 28, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Informations de l'eleve", marginL + 6, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const col1 = marginL + 6;
  const col2 = marginL + contentW / 2;

  doc.text(`Nom : ${recu.studentName}`, col1, y + 15);
  doc.text(`Classe : ${recu.classe}`, col2, y + 15);
  doc.text(`Annee scolaire : ${recu.anneeScolaire}`, col1, y + 22);

  y += 36;

  // ── Payment details table ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(109, 40, 217);
  doc.text("Details du paiement", marginL, y);
  y += 6;

  // Table header
  const cols = [marginL, marginL + 55, marginL + 95, marginL + 130];
  const colLabels = ["Designation", "Mois", "Montant du", "Montant paye"];

  doc.setFillColor(109, 40, 217);
  doc.rect(marginL, y, contentW, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  colLabels.forEach((label, i) => {
    doc.text(label, cols[i] + 3, y + 5.5);
  });
  y += 8;

  // Table row
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(220, 220, 220);
  doc.rect(marginL, y, contentW, 9, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.text(recu.typeFrais, cols[0] + 3, y + 6);
  doc.text(MOIS_LABELS[recu.mois] ?? recu.mois, cols[1] + 3, y + 6);
  doc.text(fmtMontant(recu.montantDu), cols[2] + 3, y + 6);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(16, 185, 129); // emerald-500
  doc.text(fmtMontant(recu.montantPaye), cols[3] + 3, y + 6);
  y += 9;

  // Totals
  doc.setDrawColor(200, 200, 200);
  doc.line(marginL, y + 2, marginL + contentW, y + 2);
  y += 8;

  doc.setTextColor(50, 50, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Mode de paiement :", marginL + 3, y);
  doc.setFont("helvetica", "bold");
  doc.text(recu.modePaiement ?? "—", marginL + 45, y);

  const solde = recu.montantDu - recu.montantPaye;

  doc.setFont("helvetica", "normal");
  doc.text("Reste a payer :", cols[2] + 3, y);
  doc.setFont("helvetica", "bold");
  if (solde <= 0) {
    doc.setTextColor(16, 185, 129);
    doc.text("0,00 " + CURRENCY, cols[3] + 3, y);
  } else {
    doc.setTextColor(239, 68, 68); // red-500
    doc.text(fmtMontant(solde), cols[3] + 3, y);
  }
  y += 10;

  // ── Status badge ──
  const statutLabel = recu.statut;
  if (statutLabel === "Paye" || statutLabel === "Payé") {
    doc.setFillColor(209, 250, 229); // emerald-100
    doc.setTextColor(4, 120, 87);
  } else if (statutLabel === "Partiel") {
    doc.setFillColor(254, 243, 199); // amber-100
    doc.setTextColor(146, 64, 14);
  } else {
    doc.setFillColor(254, 226, 226); // red-100
    doc.setTextColor(185, 28, 28);
  }
  const badgeW = doc.getTextWidth(statutLabel) + 12;
  doc.roundedRect(marginL + 3, y - 1, badgeW, 7, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(statutLabel, marginL + 3 + 6, y + 4);

  y += 20;

  // ── Amount in words box ──
  doc.setFillColor(248, 248, 252);
  doc.setDrawColor(200, 200, 200);
  doc.roundedRect(marginL, y, contentW, 16, 3, 3, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Arrete le present recu a la somme de :", marginL + 6, y + 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text(fmtMontant(recu.montantPaye), marginL + 6, y + 12);

  y += 26;

  // ── Signatures ──
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);

  doc.text("Cachet de l'etablissement", marginL + 10, y);
  doc.text("Signature du responsable", W - marginR - 50, y);

  doc.setDrawColor(180, 180, 180);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(marginL + 5, y + 22, marginL + 65, y + 22);
  doc.line(W - marginR - 55, y + 22, W - marginR - 5, y + 22);

  // ── Footer ──
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setLineDashPattern([], 0);
  doc.setDrawColor(200, 200, 200);
  doc.line(marginL, footerY - 5, W - marginR, footerY - 5);

  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `${school.nom} — ${school.adresse}, ${school.ville} — Tel: ${school.telephone} — ${school.email}`,
    W / 2,
    footerY,
    { align: "center" }
  );
  doc.text("Ce document est un recu de paiement officiel.", W / 2, footerY + 4, {
    align: "center",
  });

  // Save
  doc.save(`Recu_${recu.reference}.pdf`);
}
