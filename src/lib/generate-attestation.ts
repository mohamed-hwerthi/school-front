import type { Student } from "@/types/student";
import type { SchoolInfo } from "@/types/school";
import type { AttestationDTO } from "@/api/bulletins.api";

/**
 * BUL-006: Generate attestation from backend API data.
 */
export function generateAttestationFromApi(
  data: AttestationDTO
): void {
  const studentName = data.studentNameAr || data.studentName;
  const schoolName = data.schoolNameAr || data.schoolName;

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<title>شهادة مدرسية - ${studentName}</title>
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Traditional Arabic', 'Simplified Arabic', 'Sakkal Majalla', 'Arial', serif;
    direction: rtl; width: 210mm; min-height: 297mm; margin: 0 auto;
    background: white; color: #000;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .page { position: relative; width: 190mm; min-height: 277mm; margin: 10mm auto; border: 2px solid #000; padding: 15mm 12mm; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5mm; }
  .header-right { text-align: center; font-size: 13pt; line-height: 1.8; }
  .header-left { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 2mm; }
  .header-left .school-name { font-size: 14pt; font-weight: bold; }
  .header-left .school-subtitle { font-size: 10pt; color: #333; }
  .school-year { text-align: left; font-size: 13pt; font-weight: bold; margin: 4mm 0 10mm 0; }
  .title { text-align: center; font-size: 26pt; font-weight: bold; margin: 12mm 0 15mm 0; text-decoration: underline; text-underline-offset: 4px; }
  .body-text { font-size: 14pt; line-height: 2.6; padding: 0 5mm; }
  .dotted-value { border-bottom: 1px dotted #000; padding: 0 8mm; display: inline; }
  .footer { margin-top: 15mm; padding: 0 5mm; }
  .footer-date { text-align: center; font-size: 14pt; font-weight: bold; margin-bottom: 3mm; }
  .footer-sign { text-align: center; font-size: 13pt; line-height: 1.8; }
  .signature-line { width: 50mm; border-bottom: 1px solid #000; margin: 15mm auto 8mm auto; }
  @media print { body { margin: 0; } .page { border: 2px solid #000; } .no-print { display: none !important; } }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="header-right">الجمهورية التونسية<br/>وزارة التربية<br/>المندوبية الجهوية للتربية</div>
    <div class="header-left">
      <div class="school-name">${schoolName}</div>
      <div class="school-subtitle">${data.adresse || ""}</div>
    </div>
  </div>
  <div class="school-year">السنة الدراسية: ${data.anneeScolaire}</div>
  <div class="title">شهادة مدرسية</div>
  <div class="body-text">
    يشهد مدير(ة) <span class="dotted-value">${schoolName}</span><br/>
    أن التلميذ(ة) : <span class="dotted-value">${studentName}</span><br/>
    المولود(ة) في : <span class="dotted-value">${data.dateOfBirth || ""}</span><br/>
    بـ : <span class="dotted-value">${data.birthPlace || ""}</span><br/>
    مرسم بالمدرسة و يزاول دراسته (ها)<br/>
    بـ <span class="dotted-value">${data.classe} - ${data.niveau}</span><br/>
    المعرّف الوحيد: <span class="dotted-value">${data.registrationNumber || ""}</span><br/><br/>
    سلمت هذه الشهادة بطلب من المعني (ة) بالأمر قصد :
  </div>
  <div class="footer">
    <div class="footer-date">حرر في ${data.dateGeneration}</div>
    <div class="footer-sign">الامضاء و الختم<br/>المدير(ة)${data.directeurNameAr ? "<br/>" + data.directeurNameAr : ""}</div>
    <div class="signature-line"></div>
  </div>
</div>
<div class="no-print" style="text-align:center;margin:10px 0;">
  <button onclick="window.print()" style="padding:10px 30px;font-size:16px;cursor:pointer;background:#2563eb;color:white;border:none;border-radius:6px;">طباعة / تحميل PDF</button>
</div>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

export function generateAttestation(
  student: Student,
  school: SchoolInfo
): void {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const schoolYear = month >= 8 ? `${year + 1} /${year}` : `${year} /${year - 1}`;

  const todayFormatted = `${year}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const studentName = `${student.prenomAr} ${student.nomAr}`.trim() || `${student.prenom} ${student.nom}`;
  const schoolName = school.nomAr || school.nom;
  const city = school.villeAr || school.ville;

  const genderSuffix = student.sexe === "F" ? "ة" : "";

  const logoHtml = school.logo
    ? `<img src="${school.logo}" style="width:60px;height:60px;object-fit:contain;" />`
    : "";

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<title>شهادة حضور - ${studentName}</title>
<style>
  @page {
    size: A4;
    margin: 0;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Traditional Arabic', 'Simplified Arabic', 'Sakkal Majalla', 'Arial', serif;
    direction: rtl;
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    background: white;
    color: #000;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    position: relative;
    width: 190mm;
    min-height: 277mm;
    margin: 10mm auto;
    border: 2px solid #000;
    padding: 15mm 12mm;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 5mm;
  }
  .header-right {
    text-align: center;
    font-size: 13pt;
    line-height: 1.8;
  }
  .header-left {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2mm;
  }
  .header-left .school-name {
    font-size: 14pt;
    font-weight: bold;
  }
  .header-left .school-subtitle {
    font-size: 10pt;
    color: #333;
  }
  .school-year {
    text-align: left;
    font-size: 13pt;
    font-weight: bold;
    margin: 4mm 0 10mm 0;
  }
  .title {
    text-align: center;
    font-size: 26pt;
    font-weight: bold;
    margin: 12mm 0 15mm 0;
    text-decoration: underline;
    text-underline-offset: 4px;
  }
  .body-text {
    font-size: 14pt;
    line-height: 2.6;
    padding: 0 5mm;
  }
  .dotted-value {
    border-bottom: 1px dotted #000;
    padding: 0 8mm;
    display: inline;
  }
  .footer {
    margin-top: 15mm;
    padding: 0 5mm;
  }
  .footer-date {
    text-align: center;
    font-size: 14pt;
    font-weight: bold;
    margin-bottom: 3mm;
  }
  .footer-sign {
    text-align: center;
    font-size: 13pt;
    line-height: 1.8;
  }
  .signature-line {
    width: 50mm;
    border-bottom: 1px solid #000;
    margin: 15mm auto 8mm auto;
  }
  .footnotes {
    margin-top: 12mm;
    text-align: center;
    font-size: 10pt;
    color: #444;
    line-height: 1.8;
  }
  @media print {
    body { margin: 0; }
    .page { border: 2px solid #000; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="header">
    <div class="header-right">
      الجمهورية التونسية<br/>
      وزارة التربية<br/>
      المندوبية الجهوية للتربية<br/>
      ب${city}
    </div>
    <div class="header-left">
      ${logoHtml}
      <div class="school-name">${schoolName}</div>
      <div class="school-subtitle">المدرسة الإبتدائية الخاصة</div>
    </div>
  </div>

  <!-- School Year -->
  <div class="school-year">السنة الدراسية: ${schoolYear}</div>

  <!-- Title -->
  <div class="title">شهادة حضور</div>

  <!-- Body -->
  <div class="body-text">
    يشهد مدير(ة) <span class="dotted-value">${schoolName}</span>
    <br/>
    أن التلميذ(ة) : <span class="dotted-value">${studentName}</span>
    <br/>
    المولود(ة) في : <span class="dotted-value">${student.dateNaissance}</span>
    <br/>
    مرسم${genderSuffix} بالمدرسة * / المعهد المذكور أعلاه و يزاول دراسته (ها)
    <br/>
    بـ <span class="dotted-value">${student.classe}</span>
    <br/>
    المعرّف الوحيد: <span class="dotted-value">${student.matricule}</span>
    <br/><br/>
    سلمت هذه الشهادة بطلب من المعني (ة) بالأمر قصد :
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-date">حرر ب${city} في ${todayFormatted}</div>
    <div class="footer-sign">
      الامضاء و الختم<br/>
      المدير(ة)
    </div>
    <div class="signature-line"></div>
  </div>

  <!-- Footnotes -->
  <div class="footnotes">
    (1) يذكر إسم المؤسسة التربوية<br/>
    (2) يذكر الفصل بشأن القسم<br/>
    (3) يذكر الإسم و اللقب و الصفة<br/>
    (*) يشطب لزائد
  </div>
</div>

<!-- Print button (hidden on print) -->
<div class="no-print" style="text-align:center;margin:10px 0;">
  <button onclick="window.print()" style="padding:10px 30px;font-size:16px;cursor:pointer;background:#2563eb;color:white;border:none;border-radius:6px;">
    طباعة / تحميل PDF
  </button>
</div>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
