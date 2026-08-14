import jsPDF from "jspdf";
import type { EmploiDuTempsEntry, Creneau } from "@/types/emploi-du-temps";
import type { SchoolInfo } from "@/types/school";

export interface EmploiDuTempsPdfParams {
  school: SchoolInfo;
  anneeScolaireLabel?: string;
  classeName: string;
  jours: string[];
  creneaux: Creneau[];
  entries: EmploiDuTempsEntry[];
}

const SLOT_COLORS = [
  { bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af" },
  { bg: "#ecfdf5", border: "#a7f3d0", text: "#065f46" },
  { bg: "#faf5ff", border: "#e9d5ff", text: "#6b21a8" },
  { bg: "#fff7ed", border: "#fed7aa", text: "#9a3412" },
  { bg: "#fdf2f8", border: "#fbcfe8", text: "#9d174d" },
  { bg: "#ecfeff", border: "#a5f3fc", text: "#155e75" },
];

const HEADER_COLOR = "#1e3a5f";
const HEADER_LIGHT = "#2c5282";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const safe = (v: string | null | undefined) => escapeHtml(v ?? "");

/**
 * Exports the weekly timetable of a class to a presentable A4-landscape PDF.
 * Renders a styled HTML grid then converts it via jsPDF.html() (html2canvas).
 *
 * By default the PDF is downloaded directly. Pass `{ download: false }` to
 * receive the raw Blob instead (e.g. to upload it as an announcement
 * attachment).
 */
export async function generateEmploiDuTempsPdf(
  {
    school,
    anneeScolaireLabel,
    classeName,
    jours,
    creneaux,
    entries,
  }: EmploiDuTempsPdfParams,
  options?: { download?: boolean }
): Promise<void | Blob> {
  const getEntry = (jour: number, creneauId: string) =>
    entries.find(
      (e) => e.jourSemaine === jour && e.creneauId === creneauId
    );

  const colorOf = (moduleId?: string) => {
    if (!moduleId) return SLOT_COLORS[0];
    let hash = 0;
    for (let i = 0; i < moduleId.length; i++) {
      hash = (hash * 31 + moduleId.charCodeAt(i)) >>> 0;
    }
    return SLOT_COLORS[hash % SLOT_COLORS.length];
  };

  const rowHtml = (creneau: Creneau, isCourse: boolean) => {
    const cells = jours.map((_, idx) => {
      const jour = idx + 1;
      if (!isCourse) {
        const slotLabel = creneau.type === "PAUSE" ? "Pause déjeuner" : "Récréation";
        return `<td style="background:#f8fafc;color:#94a3b8;text-align:center;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;border:1px solid #e5e7eb;">${slotLabel}</td>`;
      }
      const entry = getEntry(jour, creneau.id);
      if (!entry) {
        return `<td style="border:1px solid #e5e7eb;height:52px;"></td>`;
      }
      const c = colorOf(entry.moduleId);
      const moduleName = safe(entry.moduleName ?? "Matière");
      const teacher = safe(entry.enseignantNom ?? "");
      const salle = safe(entry.salle ?? "");
      return `<td style="border:1px solid ${c.border};background:${c.bg};padding:6px 8px;vertical-align:top;">
        <div style="font-size:13px;font-weight:700;color:${c.text};line-height:1.2;">${moduleName}</div>
        ${teacher ? `<div style="font-size:11px;color:#4b5563;margin-top:3px;line-height:1.2;">${teacher}</div>` : ""}
        ${salle ? `<div style="font-size:10px;color:#6b7280;margin-top:2px;line-height:1.2;">Salle : ${salle}</div>` : ""}
      </td>`;
    });
    return `<tr>
      <td style="border:1px solid #e5e7eb;background:#f8fafc;padding:6px 10px;white-space:nowrap;width:150px;">
        <div style="font-size:12px;font-weight:700;color:#1e293b;">${safe(creneau.label)}</div>
        <div style="font-size:10px;color:#64748b;margin-top:2px;">${safe(creneau.heureDebut)} - ${safe(creneau.heureFin)}</div>
      </td>
      ${cells.join("")}
    </tr>`;
  };

  const headCells = jours
    .map(
      (label) =>
        `<th style="border:1px solid ${HEADER_LIGHT};background:${HEADER_COLOR};color:#ffffff;padding:10px 6px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">${safe(label)}</th>`
    )
    .join("");

  const rows = creneaux.map((c) => rowHtml(c, c.type === "COURS")).join("");

  const today = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const logoHtml = school.logo
    ? `<img src="${safe(school.logo)}" style="height:52px;width:52px;object-fit:contain;border-radius:8px;background:#ffffff;padding:3px;margin-right:12px;" />`
    : "";

  const contactLine = [school.adresse, school.ville, school.telephone, school.email]
    .filter(Boolean)
    .join("  |  ");

  // jsPDF.html() CLONES the source element into its own rendering container,
  // so the source itself must stay in normal document flow (no negative
  // left/top positioning — it would be cloned too and render off-canvas,
  // producing an empty PDF). The off-screen hiding goes on the PARENT wrapper,
  // which is not part of the clone.
  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-100000px";
  host.style.top = "0";
  host.style.zIndex = "-9999";

  const root = document.createElement("div");
  root.style.width = "1600px";
  root.style.background = "#ffffff";
  root.innerHTML = `
    <div style="width:1600px;font-family:Helvetica, Arial, sans-serif;color:#1e293b;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;">
        <tr>
          <td bgcolor="${HEADER_COLOR}" style="background:${HEADER_COLOR};padding:22px 30px 18px 30px;vertical-align:middle;">
            <table border="0" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;">
              <tr>
                <td style="vertical-align:middle;">${logoHtml}</td>
                <td style="vertical-align:middle;">
                  <div style="font-size:23px;font-weight:800;color:#ffffff;letter-spacing:0.5px;">${safe(school.nom)}</div>
                  <div style="font-size:11px;color:#cbd5e1;margin-top:4px;line-height:1.5;">${contactLine ? safe(contactLine) : "&nbsp;"}</div>
                </td>
              </tr>
            </table>
          </td>
          <td bgcolor="${HEADER_COLOR}" style="background:${HEADER_COLOR};padding:22px 30px 18px 30px;text-align:right;vertical-align:middle;white-space:nowrap;">
            <div style="font-size:12px;color:#cbd5e1;">Directeur</div>
            <div style="font-size:14px;font-weight:700;color:#ffffff;margin-top:2px;">${safe(school.directeur || "—")}</div>
            <div style="font-size:12px;color:#cbd5e1;margin-top:8px;">Téléphone</div>
            <div style="font-size:14px;font-weight:700;color:#ffffff;margin-top:2px;">${safe(school.telephone || "—")}</div>
          </td>
        </tr>
        <tr>
          <td colspan="2" bgcolor="${HEADER_LIGHT}" style="background:${HEADER_LIGHT};padding:16px 30px 4px 30px;text-align:center;">
            <div style="font-size:24px;font-weight:800;color:#ffffff;text-transform:uppercase;letter-spacing:3px;">Emploi du temps</div>
          </td>
        </tr>
        <tr>
          <td colspan="2" bgcolor="${HEADER_LIGHT}" style="background:${HEADER_LIGHT};padding:8px 30px 16px 30px;text-align:center;">
            <span style="display:inline-block;background:#ffffff;color:${HEADER_COLOR};font-size:16px;font-weight:800;padding:8px 22px;border-radius:22px;margin:0 6px;">Classe : ${safe(classeName)}</span>
            <span style="display:inline-block;background:#eab308;color:${HEADER_COLOR};font-size:16px;font-weight:800;padding:8px 22px;border-radius:22px;margin:0 6px;">Année scolaire : ${safe(anneeScolaireLabel ?? "—")}</span>
          </td>
        </tr>
        <tr>
          <td colspan="2" bgcolor="#eab308" style="background:#eab308;height:4px;font-size:0;line-height:0;">&nbsp;</td>
        </tr>
      </table>

      <table style="width:100%;border-collapse:separate;border-spacing:0;margin-top:18px;background:#ffffff;">
        <thead>
          <tr>
            <th style="border:1px solid ${HEADER_LIGHT};background:${HEADER_COLOR};color:#ffffff;padding:10px 10px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;width:150px;">Horaires</th>
            ${headCells}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top:16px;border-collapse:separate;border-spacing:0;">
        <tr>
          <td style="font-size:11px;color:#64748b;">Document généré le ${today}</td>
          <td style="font-size:11px;color:#64748b;text-align:right;">${safe(school.nom)} — Direction</td>
        </tr>
      </table>
    </div>
  `;
  host.appendChild(root);
  document.body.appendChild(host);

  try {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    // width = A4 landscape width (297mm) minus horizontal margins (2 x 8mm).
    // jsPDF.html() draws the scaled content starting at x + margin.left, so a
    // full 297mm width overflows the page and the right side gets cut off.
    await doc.html(root, {
      x: 0,
      y: 0,
      width: 281,
      windowWidth: 1600,
      autoPaging: "text",
      margin: [8, 8, 8, 8],
      html2canvas: {
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
        allowTaint: true,
      },
    });
    const base = classeName.replace(/\s+/g, "_");
    if (options?.download === false) {
      return doc.output("blob");
    }
    doc.save(`Emploi_du_temps_${base}.pdf`);
  } finally {
    host.remove();
  }
}