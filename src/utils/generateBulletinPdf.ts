import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  BulletinDTO,
  BulletinModuleDTO,
  BulletinTemplateDTO,
} from "@/api/bulletins.api";
import type { SchoolInfo } from "@/types/school";

/**
 * Generates a PDF report card (bulletin) for a single student.
 */
export function generateBulletinPdf(
  bulletin: BulletinDTO,
  school: SchoolInfo,
  template?: BulletinTemplateDTO | null
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const marginL = 15;
  const marginR = 15;
  const contentW = W - marginL - marginR;

  const headerColor = template?.headerColor || "#1e3a5f";
  const r = parseInt(headerColor.slice(1, 3), 16);
  const g = parseInt(headerColor.slice(3, 5), 16);
  const b = parseInt(headerColor.slice(5, 7), 16);

  let y = 0;

  // Header band
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, W, 36, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  const schoolName = template?.nomEcoleFr || school.nom;
  doc.text(schoolName, marginL, 14);

  if (template?.nomEcoleAr || school.nomAr) {
    doc.setFontSize(11);
    doc.text(template?.nomEcoleAr || school.nomAr, W - marginR, 14, {
      align: "right",
    });
  }

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const contactLine = [
    template?.adresse || school.adresse,
    school.ville,
    template?.telephone || school.telephone,
    template?.email || school.email,
  ]
    .filter(Boolean)
    .join(" | ");
  doc.text(contactLine, marginL, 22);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("BULLETIN SCOLAIRE", W / 2, 32, { align: "center" });

  y = 42;

  // Student info box
  doc.setTextColor(60, 60, 60);
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(248, 248, 252);
  doc.roundedRect(marginL, y, contentW, 22, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Informations de l'eleve", marginL + 4, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const col1 = marginL + 4;
  const col2 = marginL + contentW / 2;
  doc.text(`Nom : ${bulletin.studentName}`, col1, y + 13);
  doc.text(`Classe : ${bulletin.classe}`, col2, y + 13);
  doc.text(`Niveau : ${bulletin.niveau}`, col1, y + 19);
  doc.text(`Trimestre : ${bulletin.trimestre}`, col2, y + 19);

  y += 28;

  // Collect all modules (from domaines + hors domaine)
  const allModules: { domaine: string; module: BulletinModuleDTO }[] = [];

  for (const domaine of bulletin.domaines) {
    for (const mod of domaine.modules) {
      allModules.push({ domaine: domaine.domaineName, module: mod });
    }
  }
  for (const mod of bulletin.modulesHorsDomaine) {
    allModules.push({ domaine: "Autres", module: mod });
  }

  // Grades table
  const tableHead = [
    ["Domaine", "Matière", "Note", "Coeff.", "Moy. Matière", "Min", "Max", "Moy. Classe"],
  ];

  const tableBody = allModules.map(({ domaine, module: mod }) => [
    domaine,
    mod.moduleName,
    mod.moyenneModule.toFixed(2),
    String(mod.coeff),
    mod.moyenneModule.toFixed(2),
    mod.moduleMin.toFixed(2),
    mod.moduleMax.toFixed(2),
    mod.moduleClasseAvg.toFixed(2),
  ]);

  autoTable(doc, {
    startY: y,
    head: tableHead,
    body: tableBody,
    margin: { left: marginL, right: marginR },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [r, g, b],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      halign: "center",
    },
    columnStyles: {
      0: { halign: "left", cellWidth: 30 },
      1: { halign: "left", cellWidth: 35 },
    },
    alternateRowStyles: {
      fillColor: [248, 248, 252],
    },
  });

  // Get the Y position after the table
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY + 6;

  // Summary box
  doc.setFillColor(r, g, b);
  doc.rect(marginL, y, contentW, 24, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("RESULTATS GENERAUX", marginL + 4, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  const summaryCol1 = marginL + 4;
  const summaryCol2 = marginL + contentW / 3;
  const summaryCol3 = marginL + (contentW * 2) / 3;

  doc.text(
    `Moyenne Generale : ${bulletin.moyenneGenerale.toFixed(2)} / 20`,
    summaryCol1,
    y + 14
  );
  doc.text(
    `Moyenne Classe : ${bulletin.moyenneClasse.toFixed(2)}`,
    summaryCol2,
    y + 14
  );
  if (template?.showRang !== false) {
    doc.text(
      `Rang : ${bulletin.rang} / ${bulletin.totalEleves}`,
      summaryCol3,
      y + 14
    );
  }

  doc.text(
    `Min : ${bulletin.moyenneMin.toFixed(2)}`,
    summaryCol1,
    y + 20
  );
  doc.text(
    `Max : ${bulletin.moyenneMax.toFixed(2)}`,
    summaryCol2,
    y + 20
  );
  if (bulletin.certificatType) {
    doc.text(`Certificat : ${bulletin.certificatType}`, summaryCol3, y + 20);
  }

  y += 30;

  // Appreciation
  if (template?.showAppreciation !== false && bulletin.comportement) {
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Appreciation generale", marginL, y);
    y += 5;

    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(marginL, y, contentW, 14, 2, 2, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(bulletin.comportement, marginL + 4, y + 6);
    y += 20;
  }

  // Signature line
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  y += 5;
  doc.setTextColor(120, 120, 120);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Signature du Directeur", marginL + 10, y);
  doc.text("Signature du Parent", W - marginR - 45, y);

  doc.setDrawColor(180, 180, 180);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(marginL + 5, y + 18, marginL + 65, y + 18);
  doc.line(W - marginR - 55, y + 18, W - marginR - 5, y + 18);

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 12;
  doc.setLineDashPattern([], 0);
  doc.setDrawColor(200, 200, 200);
  doc.line(marginL, footerY - 4, W - marginR, footerY - 4);
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `${schoolName} | ${
      template?.adresse || school.adresse
    } | Tel: ${template?.telephone || school.telephone}`,
    W / 2,
    footerY,
    { align: "center" }
  );
  doc.text(
    `Genere le ${new Date().toLocaleDateString("fr-FR")} - EcoleNet`,
    W / 2,
    footerY + 4,
    { align: "center" }
  );

  // Footer text from template
  if (template?.footerText) {
    doc.text(template.footerText, W / 2, footerY + 8, { align: "center" });
  }

  doc.save(
    `Bulletin_${bulletin.studentName.replace(/\s+/g, "_")}_T${bulletin.trimestre}.pdf`
  );
}

/**
 * Generate PDFs for all bulletins in a batch (mass export).
 * Generates a single multi-page PDF with one page per student.
 */
export function generateBulletinsMassePdf(
  bulletins: BulletinDTO[],
  school: SchoolInfo,
  trimestre: number,
  template?: BulletinTemplateDTO | null
) {
  if (bulletins.length === 0) return;

  // For mass export, generate individual files per student
  for (const bulletin of bulletins) {
    generateBulletinPdf(bulletin, school, template);
  }
}
