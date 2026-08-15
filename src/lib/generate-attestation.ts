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
    direction: rtl; width: 210mm; margin: 0 auto;
    background: white; color: #000;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .page { position: relative; display: flex; flex-direction: column; width: 190mm; height: 279mm; overflow: hidden; margin: 8mm auto; border: 2px solid #000; padding: 10mm 12mm; page-break-after: avoid; break-after: avoid; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5mm; }
  .header-right { text-align: center; font-size: 13pt; line-height: 1.8; }
  .header-left { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 2mm; }
  .header-left .school-name { font-size: 14pt; font-weight: bold; }
  .header-left .school-subtitle { font-size: 10pt; color: #333; }
  .school-year { text-align: left; font-size: 13pt; font-weight: bold; margin: 3mm 0 6mm 0; }
  .title { text-align: center; font-size: 24pt; font-weight: bold; margin: 8mm 0 10mm 0; text-decoration: underline; text-underline-offset: 4px; }
  .body-text { font-size: 14pt; line-height: 2.2; padding: 0 5mm; }
  .dotted-value { border-bottom: 1px dotted #000; padding: 0 8mm; display: inline; }
  .footer { margin-top: 10mm; padding: 0 5mm; }
  .footer-date { text-align: center; font-size: 14pt; font-weight: bold; margin-bottom: 3mm; }
  .footer-sign { text-align: center; font-size: 13pt; line-height: 1.8; }
  .signature-line { width: 50mm; border-bottom: 1px solid #000; margin: 12mm auto 0 auto; }
  @media print { html, body { margin: 0; height: auto; } .page { border: 2px solid #000; } .no-print { display: none !important; } }
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

/**
 * Attestation de présence — version française (LTR).
 */
export function generateAttestationFr(
  student: Student,
  school: SchoolInfo
): void {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const schoolYear = month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;

  const todayFormatted = `${String(now.getDate()).padStart(2, "0")}-${String(now.getMonth() + 1).padStart(2, "0")}-${year}`;

  const schoolName = school.nom;
  const adresse = school.adresse;
  const inscrit = student.sexe === "F" ? "inscrite" : "inscrit";
  const ne = student.sexe === "F" ? "Née le" : "Né le";

  const logoHtml = school.logo
    ? `<img src="${school.logo}" style="max-width:90px;max-height:90px;object-fit:contain;" />`
    : "";

  const html = `<!DOCTYPE html>
<html lang="fr" dir="ltr">
<head>
<meta charset="UTF-8" />
<title>Attestation de présence - ${student.prenom} ${student.nom}</title>
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Times New Roman', Times, serif;
    font-style: italic;
    direction: ltr; width: 210mm; margin: 0 auto;
    background: white; color: #000;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .page {
    position: relative; display: flex; flex-direction: column;
    width: 190mm; height: 279mm; overflow: hidden;
    margin: 8mm auto; border: 2px solid #000; padding: 12mm;
    page-break-after: avoid; break-after: avoid;
  }
  .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8mm; }
  .header-left { font-size: 12pt; font-weight: bold; line-height: 1.7; }
  .header-right { text-align: center; }
  .school-year { text-align: right; font-size: 12pt; font-weight: bold; margin: 6mm 0 0 0; }
  .title { text-align: center; font-size: 24pt; font-weight: bold; margin: 14mm 0 16mm 0; }
  .body-text { font-size: 13pt; font-weight: bold; line-height: 2; padding: 0 4mm; }
  .fields { margin: 6mm 0 6mm 14mm; }
  .field { margin-bottom: 3mm; }
  .field-label { display: inline-block; min-width: 32mm; }
  .footer { margin-top: auto; text-align: right; font-size: 12pt; font-weight: bold; line-height: 1.9; padding: 0 12mm 18mm 0; }
  @media print {
    html, body { margin: 0; height: auto; }
    .page { border: 2px solid #000; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="header-left">
      République Tunisienne<br/>
      Ministère de l'éducation<br/>
      Direction régionale de l'éducation${school.delegationRegionale ? " " + school.delegationRegionale : ""}<br/>
      Ecole primaire privée ${schoolName}
    </div>
    <div class="header-right">${logoHtml}</div>
  </div>

  <div class="school-year">Année scolaire ${schoolYear}</div>

  <div class="title">Attestation de présence</div>

  <div class="body-text">
    Je soussigné le directeur de l'école ${schoolName} atteste que l'élève
    <div class="fields">
      <div class="field"><span class="field-label">Nom :</span> ${student.nom}</div>
      <div class="field"><span class="field-label">Prénom :</span> ${student.prenom}</div>
      <div class="field"><span class="field-label">Classe :</span> ${student.classe}</div>
      <div class="field"><span class="field-label">${ne} :</span> ${student.dateNaissance}</div>
      <div class="field"><span class="field-label">Matricule :</span> ${student.matricule}</div>
    </div>
    est ${inscrit} au sein de l'établissement pendant l'année scolaire : ${schoolYear}
  </div>

  <div class="footer">
    ${adresse ? adresse + " le " : "Le "}${todayFormatted}<br/>
    Directeur${school.directeur ? "<br/>" + school.directeur : ""}
  </div>
</div>

<div class="no-print" style="text-align:center;margin:10px 0;">
  <button onclick="window.print()" style="padding:10px 30px;font-size:16px;cursor:pointer;background:#2563eb;color:white;border:none;border-radius:6px;">
    Imprimer / Télécharger PDF
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

/**
 * Attestation d'inscription — courrier aux parents, en-tête graphique de l'école.
 */
export function generateAttestationInscription(
  student: Student,
  school: SchoolInfo
): void {
  const now = new Date();
  const year = now.getFullYear();
  const schoolYear = now.getMonth() >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;

  const todayFormatted = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${year}`;

  const schoolName = school.nom;
  const inscrit = student.sexe === "F" ? "inscrite" : "inscrit";

  const logoHtml = school.logo
    ? `<img src="${school.logo}" style="max-width:110px;max-height:80px;object-fit:contain;" />`
    : "";

  const dotted = (value: string) =>
    `${value || ""}<span class="dots">${".".repeat(60)}</span>`;

  const html = `<!DOCTYPE html>
<html lang="fr" dir="ltr">
<head>
<meta charset="UTF-8" />
<title>Attestation d'inscription - ${student.prenom} ${student.nom}</title>
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Times New Roman', Times, serif;
    font-style: italic;
    direction: ltr; width: 210mm; margin: 0 auto;
    background: white; color: #000;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .page {
    position: relative; display: flex; flex-direction: column;
    width: 210mm; height: 295mm; overflow: hidden; margin: 0 auto;
    page-break-after: avoid; break-after: avoid;
  }

  /* En-tête graphique */
  .banner {
    position: relative;
    background: linear-gradient(105deg, #58c2ac 0%, #6fcfc9 45%, #86d8e0 100%);
    padding: 14mm 14mm 26mm 14mm;
    clip-path: polygon(0 0, 100% 0, 100% 84%, 0 100%);
    display: flex; justify-content: space-between; align-items: flex-start; gap: 8mm;
  }
  .banner::after {
    content: ""; position: absolute; inset: 0;
    background: linear-gradient(to bottom right, rgba(255,255,255,.14) 45%, transparent 45%);
    pointer-events: none;
  }
  .banner-left { position: relative; z-index: 1; flex: 1 1 auto; }
  .banner-right { position: relative; z-index: 1; text-align: center; }
  .banner-right .school-name { font-size: 13pt; font-weight: bold; margin-top: 2mm; }
  .doc-title { font-size: 21pt; font-weight: bold; margin-bottom: 5mm; }
  .contact { font-size: 11pt; font-weight: bold; line-height: 1.9; padding-left: 6mm; }
  .dots { color: #333; letter-spacing: 1px; }

  /* Corps */
  .content { padding: 14mm 16mm 0 16mm; font-size: 12.5pt; font-weight: bold; line-height: 1.75; }
  .content p { text-align: justify; margin-bottom: 2mm; }
  .fields { margin: 3mm 0 3mm 4mm; line-height: 2; }
  .nb { margin-top: 4mm; }

  .footer { margin-top: auto; padding: 0 22mm 22mm 0; text-align: right; font-size: 12.5pt; font-weight: bold; line-height: 2.4; }

  @media print {
    html, body { margin: 0; height: auto; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
<div class="page">

  <div class="banner">
    <div class="banner-left">
      <div class="doc-title">Attestation d'inscription</div>
      <div class="contact">
        Adresse : ${dotted(school.adresse)}<br/>
        Tel : ${dotted(school.telephone)}<br/>
        Mail : ${dotted(school.email)}
      </div>
    </div>
    <div class="banner-right">
      ${logoHtml}
      <div class="school-name">${schoolName}</div>
    </div>
  </div>

  <div class="content">
    <p>Chèrs Parents, La Direction et toute l'équipe pédagogique de ${schoolName} se font un très
    grand plaisir de vous compter parmi leurs adhérents.</p>
    <p>L'épanouissement et la sécurité de vos enfants sont notre priorité, aussi l'équipe pédagogique
    a été sélectionnée avec soin, en fonction de leurs diplomes, expériences, aptitudes pédagogiques
    et humaines. Afin de répondre aux besoins éducatifs, culturels, artistiques de chaque élève, nous
    mettons à leur disposition un espace éducatif où chacun s'épanouira grâce à des moyens
    didactiques modernes, attractifs et motivants, et grâce à un large éventail d'activités.
    Et par ce fait, on atteste que votre enfant :</p>
    <div class="fields">
      Nom &amp; Prénom: ${student.nom} ${student.prenom}<br/>
      Classe d'etude: ${student.classe}<br/>
      Date de naissance: ${student.dateNaissance}<br/>
      Numero d'admission: ${student.matricule}
    </div>
    <p>Est ${inscrit} dans notre établissement ${schoolName} pour l'année scolaire : ${schoolYear}</p>
    <p class="nb">NB: La somme d'inscription ne sera en aucun cas remboursable.</p>
  </div>

  <div class="footer">
    Date: ${todayFormatted}<br/>
    Direction
  </div>
</div>

<div class="no-print" style="text-align:center;margin:10px 0;">
  <button onclick="window.print()" style="padding:10px 30px;font-size:16px;cursor:pointer;background:#2563eb;color:white;border:none;border-radius:6px;">
    Imprimer / Télécharger PDF
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
  const adresse = school.adresseAr || school.adresse;
  // Délégation régionale : champ dédié, comme sur les bulletins.
  const delegation = school.delegationRegionaleAr || school.delegationRegionale;
  // « بـ… » n'est imprimé que si la valeur existe, sinon on affichait un « ب » orphelin.
  const delegationLine = delegation ? `<br/>بـ${delegation}` : "";
  const adressePrefix = adresse ? ` بـ${adresse}` : "";

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
    margin: 0 auto;
    background: white;
    color: #000;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 190mm;
    height: 279mm;
    overflow: hidden;
    margin: 8mm auto;
    border: 2px solid #000;
    padding: 10mm 12mm;
    page-break-after: avoid;
    break-after: avoid;
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
    margin: 3mm 0 6mm 0;
  }
  .title {
    text-align: center;
    font-size: 24pt;
    font-weight: bold;
    margin: 8mm 0 10mm 0;
    text-decoration: underline;
    text-underline-offset: 4px;
  }
  .body-text {
    font-size: 14pt;
    line-height: 2.2;
    padding: 0 5mm;
  }
  .dotted-value {
    border-bottom: 1px dotted #000;
    padding: 0 8mm;
    display: inline;
  }
  .footer {
    margin-top: 10mm;
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
    margin: 12mm auto 0 auto;
  }
  .footnotes {
    margin-top: auto;
    padding-top: 6mm;
    text-align: center;
    font-size: 10pt;
    color: #444;
    line-height: 1.6;
  }
  @media print {
    html, body { margin: 0; height: auto; }
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
      المندوبية الجهوية للتربية${delegationLine}
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
    <div class="footer-date">حرر${adressePrefix} في ${todayFormatted}</div>
    <div class="footer-sign">
      الامضاء و الختم<br/>
      المدير(ة)${school.directeurAr ? "<br/>" + school.directeurAr : ""}
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
