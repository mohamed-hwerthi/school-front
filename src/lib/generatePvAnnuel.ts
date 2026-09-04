import type { PropositionPassage } from "@/types/conseil-classe";
import type { DecisionType } from "@/types/passage";
import type { Student } from "@/types/student";
import type { SchoolInfo } from "@/types/school";

/**
 * محضر الجلسة السنوي — procès-verbal annuel du conseil de classe.
 *
 * Reproduit le formulaire officiel tunisien : tableau RTL en A4 paysage,
 * une ligne par élève, moyennes et rangs des trois trimestres + annuel,
 * et la décision du conseil. Imprimé via une fenêtre navigateur (le shaping
 * arabe est fait par le moteur de rendu), comme les attestations.
 */

export interface PvEleve {
  proposition: PropositionPassage;
  /** Décision retenue par le conseil (peut différer de la proposition). */
  decision: DecisionType;
  student?: Student;
  /** Nombre d'années redoublées, quand l'historique est connu. */
  redoublements?: number;
}

export interface PvAnnuelData {
  eleves: PvEleve[];
  classeNom: string;
  niveauNom: string;
  anneeScolaire: string;
  school: SchoolInfo;
}

const DECISION_AR: Record<DecisionType, string> = {
  PASSAGE: "يرتقي",
  REDOUBLEMENT: "يعيد",
  EXCLUSION: "يُفصل",
  TRANSFERT: "يُنقل",
};

const MENTION_AR: Record<string, string> = {
  Excellence: "لوحة الشرف مع التهاني",
  Félicitations: "تهانـي",
  "Tableau d'honneur": "لوحة الشرف",
  Encouragements: "تشجيع",
};

const ORDINAUX_AR = ["", "أولى", "ثانية", "ثالثة", "رابعة", "خامسة", "سادسة", "سابعة", "ثامنة", "تاسعة"];
const LETTRES_AR: Record<string, string> = { A: "أ", B: "ب", C: "ج", D: "د", E: "هـ", F: "و" };

/** Chiffre de tête d'un libellé de niveau ("3ème année" → 3), sinon null. */
function chiffreNiveau(nom: string): number | null {
  const m = /(\d+)/.exec(nom ?? "");
  return m ? Number(m[1]) : null;
}

/** "3A" / "3ème année" → "ثالثة أ" pour l'en-tête du PV. */
function classeEnArabe(classeNom: string, niveauNom: string): string {
  const chiffre = chiffreNiveau(niveauNom) ?? chiffreNiveau(classeNom);
  const ordinal = chiffre && chiffre < ORDINAUX_AR.length ? ORDINAUX_AR[chiffre] : "";
  const lettre = /([A-Za-z])\s*$/.exec(classeNom ?? "")?.[1]?.toUpperCase() ?? "";
  const lettreAr = LETTRES_AR[lettre] ?? lettre;
  return [ordinal, lettreAr].filter(Boolean).join(" ") || classeNom || "";
}

/**
 * التجاوز العمري — dépassement d'âge, compté en années de cohorte comme sur
 * le formulaire officiel : l'âge légal est 6 ans en 1ère année (+1 par niveau),
 * donc l'année de naissance normale vaut `rentrée − âge légal`. Un élève né
 * cette année-là (quel que soit le mois) est « dans les temps » : la case reste
 * vide. Les colonnes أشهر / أيام restent libres pour les cas de dérogation.
 */
function tjavozOmri(
  dateNaissance: string | undefined,
  niveauNom: string,
  anneeScolaire: string,
): { annees: string; mois: string; jours: string } {
  const vide = { annees: "", mois: "", jours: "" };
  const chiffre = chiffreNiveau(niveauNom);
  if (!dateNaissance || !chiffre) return vide;

  const naissance = new Date(dateNaissance);
  const debut = Number(anneeScolaire.slice(0, 4));
  if (Number.isNaN(naissance.getTime()) || Number.isNaN(debut)) return vide;

  const anneeNormale = debut - (5 + chiffre);
  const ecart = anneeNormale - naissance.getFullYear();
  return ecart > 0 ? { annees: String(ecart), mois: "", jours: "" } : vide;
}

/** Rangs d'un trimestre : moyenne décroissante, ex æquo au même rang. */
function rangsTrimestre(
  eleves: PvEleve[],
  moyenne: (p: PropositionPassage) => number | null,
): Map<string, number> {
  const rangs = new Map<string, number>();
  const classes = eleves
    .filter((e) => moyenne(e.proposition) != null)
    .sort((a, b) => (moyenne(b.proposition) as number) - (moyenne(a.proposition) as number));
  classes.forEach((e, i) => {
    const precedent = classes[i - 1];
    const exAequo = precedent && moyenne(precedent.proposition) === moyenne(e.proposition);
    rangs.set(e.proposition.studentId, exAequo ? (rangs.get(precedent.proposition.studentId) as number) : i + 1);
  });
  return rangs;
}

function moy(n: number | null | undefined): string {
  return n == null ? "" : n.toFixed(2);
}

function nomArabe(e: PvEleve): string {
  const s = e.student;
  const ar = [s?.nomAr, s?.prenomAr].filter(Boolean).join(" ").trim();
  return ar || e.proposition.studentName || "";
}

function dateFr(d: string | undefined): string {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);
}

/** Construit le document HTML autonome du PV — c'est lui qu'on archive. */
export function buildPvAnnuelHtml(data: PvAnnuelData): string {
  const { classeNom, niveauNom, anneeScolaire, school } = data;

  // Ordre alphabétique arabe, comme sur le formulaire officiel.
  const eleves = [...data.eleves].sort((a, b) =>
    nomArabe(a).localeCompare(nomArabe(b), "ar"),
  );

  const rangT1 = rangsTrimestre(eleves, (p) => p.moyenneT1);
  const rangT2 = rangsTrimestre(eleves, (p) => p.moyenneT2);
  const rangT3 = rangsTrimestre(eleves, (p) => p.moyenneT3);

  const lignes = eleves
    .map((e, i) => {
      const p = e.proposition;
      const age = tjavozOmri(e.student?.dateNaissance, niveauNom, anneeScolaire);
      const mention = p.mention ? (MENTION_AR[p.mention] ?? p.mention) : "";
      return `<tr>
  <td class="num">${i + 1}</td>
  <td class="id">${esc(e.student?.matricule ?? "")}</td>
  <td class="nom">${esc(nomArabe(e))}</td>
  <td class="date">${esc(dateFr(e.student?.dateNaissance))}</td>
  <td>${e.redoublements ? e.redoublements : ""}</td>
  <td>${age.annees}</td>
  <td>${age.mois}</td>
  <td>${age.jours}</td>
  <td class="moy">${moy(p.moyenneT1)}</td>
  <td>${rangT1.get(p.studentId) ?? ""}</td>
  <td class="moy">${moy(p.moyenneT2)}</td>
  <td>${rangT2.get(p.studentId) ?? ""}</td>
  <td class="moy">${moy(p.moyenneT3)}</td>
  <td>${rangT3.get(p.studentId) ?? ""}</td>
  <td class="moy">${moy(p.moyenneAnnuelle)}</td>
  <td>${p.rang ?? ""}</td>
  <td class="prix">${esc(mention)}</td>
  <td class="decision">${DECISION_AR[e.decision] ?? ""}</td>
</tr>`;
    })
    .join("\n");

  const titre = `محضر الجلسة السنوي - ${classeEnArabe(classeNom, niveauNom)} - ${anneeScolaire}`;

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<title>${esc(titre)}</title>
<style>
  @page { size: A4 landscape; margin: 8mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Traditional Arabic', 'Simplified Arabic', 'Sakkal Majalla', 'Amiri', 'Arial', serif;
    direction: rtl; background: #fff; color: #000;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .page { width: 281mm; margin: 0 auto; padding: 4mm 6mm; }
  .annee { text-align: left; font-size: 13pt; font-weight: bold; margin-bottom: 1mm; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; }
  .header-right { font-size: 11pt; line-height: 2; text-align: right; }
  .header-center { flex: 1; text-align: center; }
  .titre { font-size: 17pt; font-weight: bold; }
  .classe { font-size: 13pt; font-weight: bold; margin-top: 2.5mm; }
  .header-spacer { width: 55mm; }
  .effectif { font-size: 12pt; font-weight: bold; margin: 3mm 0 2mm; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 0.8pt solid #000; }
  th, td { text-align: center; vertical-align: middle; font-size: 10pt; padding: 0.5mm; background: #fff; }
  /* Quadrillage complet, en-tête et corps, comme sur le formulaire officiel. */
  th, td { border: 0.6pt solid #000; }
  th { font-weight: normal; font-size: 10.5pt; height: 7mm; }
  tbody td { height: 8mm; }
  thead tr:last-child th { border-bottom: 0.9pt solid #000; }
  td.nom { font-size: 11pt; text-align: right; padding-right: 2mm; }
  td.id, td.date, td.moy { font-family: 'Times New Roman', 'Arial', serif; font-size: 10pt; direction: ltr; }
  td.decision, td.prix { font-size: 11pt; }
  col.c-num { width: 7mm; } col.c-id { width: 24mm; } col.c-nom { width: 44mm; }
  col.c-date { width: 21mm; } col.c-red { width: 14mm; } col.c-age { width: 9mm; }
  col.c-val { width: 13mm; } col.c-prix { width: 26mm; } col.c-dec { width: 20mm; }
  .footer { display: flex; justify-content: flex-end; margin-top: 6mm; font-size: 12pt; }
  .sign { text-align: center; line-height: 1.9; }
  .sign-line { width: 45mm; border-bottom: 0.8pt solid #000; margin-top: 12mm; }
  @media print { .no-print { display: none !important; } .page { width: auto; padding: 0; } tbody tr { page-break-inside: avoid; } thead { display: table-header-group; } }
</style>
</head>
<body>
<div class="page">
  <div class="annee">السنة الدراسية : ${esc(anneeScolaire)}</div>
  <div class="header">
    <div class="header-right">
      الجمهورية التونسية<br/>وزارة التربية<br/>المندوبية الجهوية للتربية بـ ${esc(school.delegationRegionaleAr || school.delegationRegionale || "")}<br/>${esc(school.nomAr || school.nom || "")}
    </div>
    <div class="header-center">
      <div class="titre">محضر الجلسة السنوي</div>
      <div class="classe">القسم : ${esc(classeEnArabe(classeNom, niveauNom))}</div>
    </div>
    <div class="header-spacer"></div>
  </div>

  <div class="effectif">عدد التلاميذ : ${eleves.length}</div>

  <table>
    <colgroup>
      <col class="c-num" /><col class="c-id" /><col class="c-nom" /><col class="c-date" /><col class="c-red" />
      <col class="c-age" /><col class="c-age" /><col class="c-age" />
      <col class="c-val" /><col class="c-val" /><col class="c-val" /><col class="c-val" />
      <col class="c-val" /><col class="c-val" /><col class="c-val" /><col class="c-val" />
      <col class="c-prix" /><col class="c-dec" />
    </colgroup>
    <thead>
      <tr>
        <th rowspan="2">ر</th>
        <th rowspan="2">المعرف الوحيد</th>
        <th rowspan="2">الاسم واللقب</th>
        <th rowspan="2">تاريخ الولادة</th>
        <th rowspan="2">سنوات الرسوب</th>
        <th colspan="3">التجاوز العمري</th>
        <th colspan="2">الثلاثي الأول</th>
        <th colspan="2">الثلاثي الثاني</th>
        <th colspan="2">الثلاثي الثالث</th>
        <th colspan="2">السنوي</th>
        <th rowspan="2">الجوائز والعقوبات</th>
        <th rowspan="2">قرار المجلس</th>
      </tr>
      <tr>
        <th>أعوام</th><th>أشهر</th><th>أيام</th>
        <th>المعدل</th><th>الرتبة</th>
        <th>المعدل</th><th>الرتبة</th>
        <th>المعدل</th><th>الرتبة</th>
        <th>المعدل</th><th>الرتبة</th>
      </tr>
    </thead>
    <tbody>
${lignes}
    </tbody>
  </table>

  <div class="footer">
    <div class="sign">
      الإمضاء والختم<br/>المدير(ة)${school.directeurAr ? "<br/>" + esc(school.directeurAr) : ""}
      <div class="sign-line"></div>
    </div>
  </div>
</div>
<div class="no-print" style="text-align:center;margin:10px 0;">
  <button onclick="window.print()" style="padding:10px 30px;font-size:16px;cursor:pointer;background:#2563eb;color:white;border:none;border-radius:6px;">طباعة / تحميل PDF</button>
</div>
</body>
</html>`;

  return html;
}

/**
 * Ouvre un PV archivé dans un onglet, pour consultation ou téléchargement
 * (impression / « Enregistrer au format PDF » du navigateur).
 */
export function openPvAnnuel(html: string, options: { print?: boolean } = {}): void {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  if (options.print) {
    // Laisser le rendu se stabiliser avant d'ouvrir la boîte d'impression.
    w.addEventListener("load", () => w.setTimeout(() => w.print(), 200));
  }
}
