import jsPDF from "jspdf";
import { CURRENCY } from "@/config/currency";
import { MOIS_LABELS } from "@/types/finance";
import type { SchoolInfo } from "@/types/school";
import type { Paiement } from "@/types/finance";

export interface FactureStudentInfo {
  nom: string;
  prenom: string;
  classe: string;
}

function fmtMontant(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " " + CURRENCY;
}

function today(): string {
  return new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function generateFacturePDF(
  student: FactureStudentInfo,
  paiements: Paiement[],
  typesFraisMap: Record<number, string>,
  anneeScolaire: string,
  school: SchoolInfo
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const marginL = 20;
  const marginR = 20;
  const contentW = W - marginL - marginR;
  let y = 20;

  const factureNum = `FAC-${Date.now().toString(36).toUpperCase()}`;

  // ── Header band ──
  doc.setFillColor(109, 40, 217);
  doc.rect(0, 0, W, 38, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(school.nom, marginL, 16);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`${school.adresse}, ${school.ville}`, marginL, 23);
  doc.text(`Tel: ${school.telephone}  |  ${school.email}`, marginL, 29);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("FACTURE", W - marginR, 16, { align: "right" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`N° ${factureNum}`, W - marginR, 23, { align: "right" });
  doc.text(`Date: ${today()}`, W - marginR, 29, { align: "right" });

  y = 48;

  // ── Student info box ──
  doc.setTextColor(60, 60, 60);
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(248, 248, 252);
  doc.roundedRect(marginL, y, contentW, 22, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Facture a", marginL + 6, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Eleve : ${student.prenom} ${student.nom}`, marginL + 6, y + 14);
  doc.text(`Classe : ${student.classe}`, marginL + contentW / 2, y + 14);
  doc.text(`Annee scolaire : ${anneeScolaire}`, marginL + 6, y + 20);

  y += 30;

  // ── Payment table ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(109, 40, 217);
  doc.text("Detail des paiements", marginL, y);
  y += 6;

  // Table header
  const colX = [marginL, marginL + 50, marginL + 80, marginL + 110, marginL + 140];
  const colLabels = ["Type de frais", "Mois", "Montant du", "Montant paye", "Statut"];

  doc.setFillColor(109, 40, 217);
  doc.rect(marginL, y, contentW, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  colLabels.forEach((label, i) => {
    doc.text(label, colX[i] + 2, y + 5.5);
  });
  y += 8;

  // Table rows
  let totalDu = 0;
  let totalPaye = 0;

  const sortedPaiements = [...paiements].sort((a, b) => {
    const moiOrder = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    return moiOrder.indexOf(a.mois) - moiOrder.indexOf(b.mois);
  });

  sortedPaiements.forEach((p, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 248, isEven ? 255 : 252);
    doc.setDrawColor(230, 230, 230);
    doc.rect(marginL, y, contentW, 8, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(50, 50, 50);

    const typeName = typesFraisMap[p.typeFraisId] ?? "—";
    doc.text(typeName.length > 22 ? typeName.slice(0, 22) + "..." : typeName, colX[0] + 2, y + 5.5);
    doc.text(MOIS_LABELS[p.mois] ?? p.mois, colX[1] + 2, y + 5.5);
    doc.text(fmtMontant(p.montantDu), colX[2] + 2, y + 5.5);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129);
    doc.text(fmtMontant(p.montantPaye), colX[3] + 2, y + 5.5);

    // Statut with color
    const statut = p.statut;
    if (statut === "Payé" || statut === "Paye") {
      doc.setTextColor(4, 120, 87);
    } else if (statut === "Partiel") {
      doc.setTextColor(146, 64, 14);
    } else {
      doc.setTextColor(185, 28, 28);
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(statut, colX[4] + 2, y + 5.5);

    totalDu += p.montantDu;
    totalPaye += p.montantPaye;
    y += 8;

    // Page break if needed
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
  });

  // ── Totals row ──
  y += 2;
  doc.setFillColor(240, 240, 248);
  doc.setDrawColor(109, 40, 217);
  doc.setLineWidth(0.5);
  doc.rect(marginL, y, contentW, 10, "FD");
  doc.setLineWidth(0.2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.text("TOTAL", colX[0] + 2, y + 7);
  doc.text(fmtMontant(totalDu), colX[2] + 2, y + 7);

  doc.setTextColor(16, 185, 129);
  doc.text(fmtMontant(totalPaye), colX[3] + 2, y + 7);

  y += 16;

  // ── Summary box ──
  const solde = totalDu - totalPaye;
  doc.setFillColor(248, 248, 252);
  doc.setDrawColor(200, 200, 200);
  doc.roundedRect(marginL + contentW / 2, y, contentW / 2, 28, 3, 3, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);

  const sumX = marginL + contentW / 2 + 6;
  const sumValX = marginL + contentW - 6;

  doc.text("Total du :", sumX, y + 8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(50, 50, 50);
  doc.text(fmtMontant(totalDu), sumValX, y + 8, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("Total paye :", sumX, y + 16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(16, 185, 129);
  doc.text(fmtMontant(totalPaye), sumValX, y + 16, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 100, 100);
  doc.text("Solde restant :", sumX, y + 24);
  doc.setFont("helvetica", "bold");
  if (solde <= 0) {
    doc.setTextColor(16, 185, 129);
    doc.text("0,00 " + CURRENCY, sumValX, y + 24, { align: "right" });
  } else {
    doc.setTextColor(239, 68, 68);
    doc.text(fmtMontant(solde), sumValX, y + 24, { align: "right" });
  }

  y += 38;

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

  doc.save(`Facture_${student.prenom}_${student.nom}_${anneeScolaire}.pdf`);
}
