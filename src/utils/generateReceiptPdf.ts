import jsPDF from "jspdf";

interface PaymentData {
  id: string;
  studentName: string;
  amount: number;
  date: string;
  type: string;
  modePaiement: string;
  reference: string;
  status: string;
}

export function generateReceiptPdf(payment: PaymentData) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("EcoleNet - Recu de Paiement", 105, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Recu N° ${payment.reference || payment.id}`, 105, 28, {
    align: "center",
  });

  // Line
  doc.setLineWidth(0.5);
  doc.line(20, 32, 190, 32);

  // Details
  doc.setFontSize(12);
  let y = 45;
  const addRow = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, 25, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, 90, y);
    y += 10;
  };

  addRow("Eleve:", payment.studentName);
  addRow("Montant:", `${payment.amount.toFixed(2)} TND`);
  addRow("Date:", payment.date);
  addRow("Type:", payment.type);
  addRow("Mode:", payment.modePaiement);
  addRow("Reference:", payment.reference || "\u2014");
  addRow("Statut:", payment.status);

  // Footer
  y += 15;
  doc.setLineWidth(0.3);
  doc.line(20, y, 190, y);
  y += 10;
  doc.setFontSize(9);
  doc.text(
    `Document genere le ${new Date().toLocaleDateString("fr-FR")}`,
    105,
    y,
    { align: "center" }
  );
  doc.text("EcoleNet - Gestion Scolaire", 105, y + 6, { align: "center" });

  doc.save(`recu-${payment.reference || payment.id}.pdf`);
}
