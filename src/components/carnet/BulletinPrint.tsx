import type { BulletinDTO, BulletinDomaineDTO, BulletinModuleDTO } from "@/api/bulletins.api";

interface Props {
  bulletin: BulletinDTO;
  schoolName?: string;
  schoolNameAr?: string;
  anneeScolaire?: string;
  schoolLogoUrl?: string | null;
  directorStampUrl?: string | null;
  numeroIdentifiant?: string | null;
  delegationRegionale?: string;
}

const TRIMESTRE_AR = ["الثلاثي الأول", "الثلاثي الثاني", "الثلاثي الثالث"];

// Tunisian primary "Étatique" colors (sampled from the official template)
const TEAL = "#1ca0c1";
const TEAL_DARK = "#157d9b";
const TEAL_LIGHT = "#e8f4f8";
const BORDER = "#9bd2e2";

export default function BulletinPrint({
  bulletin,
  schoolName = "المدرسة الابتدائية",
  schoolNameAr,
  anneeScolaire = "2025 / 2026",
  directorStampUrl,
  numeroIdentifiant,
  delegationRegionale = "باجة",
}: Props) {
  const b = bulletin;
  const trimestreAr = TRIMESTRE_AR[b.trimestre - 1] ?? TRIMESTRE_AR[0];
  const ecoleAr = schoolNameAr || schoolName;
  const studentDisplayName = b.studentNameAr || b.studentName;

  // year split into 2-digit segments for the dotted-fields display
  const yrParts = anneeScolaire.split(" / ");
  const y1 = (yrParts[0] || "2025").slice(-2);
  const y2 = (yrParts[1] || "2026").slice(-2);

  return (
    <div
      className="bulletin-page bg-white text-black"
      dir="rtl"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "6mm 6mm",
        fontFamily: "'Amiri', 'Noto Naskh Arabic', 'Traditional Arabic', 'Arial', serif",
        fontSize: "11px",
        lineHeight: 1.5,
        color: "#0a0a0a",
      }}
    >
      <div
        style={{
          border: `1.5px solid ${TEAL}`,
          borderRadius: "4mm",
          padding: "3mm 4mm",
          background: "#fff",
        }}
      >
        {/* ─── HEADER ROW ─── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            paddingBottom: "2mm",
            borderBottom: `1px solid ${BORDER}`,
          }}
        >
          {/* Right block (RTL start) */}
          <div style={{ width: "55%" }}>
            <div style={{ fontSize: "16px", fontWeight: "bold", color: TEAL_DARK }}>
              المندوبية الجهوية للتربية
            </div>
            <div style={{ marginTop: "2mm", fontSize: "11px" }}>
              ب{" "}
              <span
                style={{
                  display: "inline-block",
                  borderBottom: "1px dotted #555",
                  padding: "0 8mm",
                  minWidth: "30mm",
                }}
              >
                {delegationRegionale}
              </span>
            </div>
          </div>
          {/* Left block (school + year) */}
          <div style={{ width: "45%", textAlign: "end", fontSize: "11px" }}>
            <div>
              المدرسة الابتدائية :{" "}
              <span
                style={{
                  display: "inline-block",
                  borderBottom: "1px dotted #555",
                  padding: "0 4mm",
                  fontWeight: "bold",
                  minWidth: "32mm",
                }}
              >
                {ecoleAr}
              </span>
            </div>
            <div style={{ marginTop: "2mm" }}>
              السنة الدراسية :{" "}
              <span style={{ display: "inline-block", borderBottom: "1px dotted #555", padding: "0 1mm" }}>
                20....{y2}
              </span>{" "}
              /{" "}
              <span style={{ display: "inline-block", borderBottom: "1px dotted #555", padding: "0 1mm" }}>
                20....{y1}
              </span>
            </div>
          </div>
        </div>

        {/* ─── TRIMESTRE PILL (centered) ─── */}
        <div style={{ display: "flex", justifyContent: "center", margin: "3mm 0 2mm 0" }}>
          <div
            style={{
              background: TEAL_LIGHT,
              border: `1.5px solid ${TEAL}`,
              color: TEAL_DARK,
              fontWeight: "bold",
              fontSize: "15px",
              padding: "1.5mm 12mm",
              borderRadius: "5mm",
            }}
          >
            {trimestreAr}
          </div>
        </div>

        {/* ─── STUDENT INFO ROW ─── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            fontSize: "11px",
            margin: "1mm 1mm 3mm 1mm",
          }}
        >
          <div>
            <div>
              <strong>التلميذ(ة)</strong> : {studentDisplayName}
            </div>
            {numeroIdentifiant && (
              <div style={{ marginTop: "1mm" }}>
                <strong>المعرّف الوحيد</strong> : {numeroIdentifiant}
              </div>
            )}
          </div>
          <div>
            <strong>القسم</strong> : {b.classe}
          </div>
          <div>
            <strong>عدد التلاميذ المرسمين</strong> :{b.totalEleves}
          </div>
        </div>

        {/* ─── BODY: 2 columns (side panel + main) ─── */}
        <div style={{ display: "flex", gap: "3mm", alignItems: "stretch" }}>
          {/* MAIN (right visually) */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "3mm" }}>
            {b.domaines.map((d) => (
              <DomaineBlock key={d.domaineId} domaine={d} />
            ))}
            {b.modulesHorsDomaine.some((m) => (m.moyenneModule ?? 0) > 0) && (
              <DomaineBlock
                domaine={{
                  domaineId: -1,
                  domaineName: "Autres",
                  domaineNameAr: "مواد أخرى",
                  modules: b.modulesHorsDomaine,
                  moyenneDomaine: avg(b.modulesHorsDomaine.map((m) => m.moyenneModule)),
                  recommandation: null,
                }}
              />
            )}
          </div>

          {/* SIDE PANEL (left visually) */}
          <div style={{ width: "55mm", display: "flex", flexDirection: "column", gap: "2.5mm" }}>
            {/* Three stat boxes side-by-side. RTL : la première carte du DOM
                apparaît à droite. Ordre conforme au modèle officiel :
                معدل الثلاثي (droite) · أعلى · أدنى (gauche). */}
            <div style={{ display: "flex", gap: "1.5mm" }}>
              <MiniStatCard label="معدل الثلاثي" value={formatNote(b.moyenneGenerale)} tone="primary" />
              <MiniStatCard label="أعلى معدل بالقسم" value={formatNote(b.moyenneMax)} tone="good" />
              <MiniStatCard label="أدنى معدل بالقسم" value={formatNote(b.moyenneMin)} tone="bad" />
            </div>

            {/* Observation comportement */}
            <BadgePanel title="ملاحظات المدرس(ة) حول السلوك و المواطنة" minHeight="22mm">
              <div style={{ fontSize: "10px", padding: "2mm" }}>{b.comportement || ""}</div>
            </BadgePanel>

            {/* Certificat */}
            <BadgePanel title="الشهادة" minHeight="18mm">
              <div
                style={{
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: "13px",
                  padding: "5mm 1mm",
                }}
              >
                {b.certificatType || ""}
              </div>
            </BadgePanel>

            {/* Director + stamp */}
            <BadgePanel title="مدير(ة) المدرسة" minHeight="32mm">
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "2mm 1mm",
                }}
              >
                {directorStampUrl ? (
                  <img
                    src={directorStampUrl}
                    alt="ختم"
                    style={{ maxHeight: "18mm", maxWidth: "30mm", marginBottom: "1mm" }}
                  />
                ) : (
                  <div style={{ height: "16mm" }} />
                )}
                <div
                  style={{
                    fontSize: "10px",
                    width: "100%",
                    textAlign: "start",
                  }}
                >
                  التاريخ :{" "}
                  <span
                    style={{
                      display: "inline-block",
                      borderBottom: "1px dotted #777",
                      minWidth: "25mm",
                    }}
                  />
                </div>
                <div
                  style={{ fontSize: "9px", color: "#666", marginTop: "0.5mm", alignSelf: "start" }}
                >
                  (الختم و الإمضاء)
                </div>
              </div>
            </BadgePanel>

            {/* Parent signature */}
            <BadgePanel title="إمضاء الولي" minHeight="18mm">
              <div />
            </BadgePanel>
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────── Domaine block ─────────────────

interface DomaineBlockProps {
  domaine: Pick<
    BulletinDomaineDTO,
    "domaineId" | "domaineName" | "domaineNameAr" | "modules" | "moyenneDomaine" | "recommandation"
  > & { coeff?: number };
}

function DomaineBlock({ domaine }: DomaineBlockProps) {
  const recommandation = domaine.recommandation || "";
  const modules = domaine.modules;

  // Group modules by sous-domaine. Modules with no sous-domaine fall into a single bucket key=null.
  const groups: { key: number | null; nameAr: string | null; nameFr: string | null; ordre: number; modules: BulletinModuleDTO[] }[] = [];
  for (const m of modules) {
    const k = m.sousDomaineId ?? null;
    let g = groups.find((x) => x.key === k);
    if (!g) {
      g = {
        key: k,
        nameAr: m.sousDomaineNameAr ?? null,
        nameFr: m.sousDomaineName ?? null,
        ordre: m.sousDomaineOrdre ?? 999,
        modules: [],
      };
      groups.push(g);
    }
    g.modules.push(m);
  }
  groups.sort((a, b) => a.ordre - b.ordre);

  const hasSousDomaines = groups.some((g) => g.key !== null);

  // Total visual rows in the body: module rows + sub-domain header rows (only for non-null groups)
  const totalRows =
    modules.length + (hasSousDomaines ? groups.filter((g) => g.key !== null).length : 0);

  return (
    <div style={{ borderRadius: "2mm", overflow: "hidden", border: `1px solid ${TEAL}` }}>
      {/* Domain header bar */}
      <div
        style={{
          background: TEAL,
          color: "white",
          textAlign: "center",
          fontWeight: "bold",
          fontSize: "12.5px",
          padding: "1.2mm 2mm",
        }}
      >
        {formatDomaineTitle(domaine.domaineNameAr, domaine.domaineName)}
        {domaine.coeff != null && (
          <span style={{ fontWeight: "normal", fontSize: "10px", opacity: 0.85 }}>
            {" "}
            (coeff {domaine.coeff})
          </span>
        )}
      </div>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "10px",
          tableLayout: "fixed",
          background: "#fff",
        }}
      >
        <colgroup>
          <col style={{ width: "22%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "10%" }} />
          <col />
          <col style={{ width: "11%" }} />
          <col style={{ width: "11%" }} />
        </colgroup>
        <thead>
          <tr style={{ background: TEAL_LIGHT, color: TEAL_DARK }}>
            <th style={thStyle}>المادة</th>
            <th style={thStyle}>العدد /20</th>
            <th style={thStyle}>معدل المجال</th>
            <th style={thStyle}>توصيات المدرس(ة)</th>
            <th style={thStyle}>أدنى معدل في القسم</th>
            <th style={thStyle}>أعلى معدل في القسم</th>
          </tr>
        </thead>
        <tbody>
          {modules.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ ...tdStyle, textAlign: "center", color: "#888", padding: "4mm" }}>
                —
              </td>
            </tr>
          ) : (
            (() => {
              const rows: React.ReactNode[] = [];
              let visualRowIdx = 0; // counts every <tr> rendered (incl. sub-domain headers)
              groups.forEach((g) => {
                // Sub-domain header row (only when sub-domains are meaningful)
                if (hasSousDomaines && g.key !== null) {
                  const isFirstVisualRow = visualRowIdx === 0;
                  rows.push(
                    <tr key={`sd-${g.key}`}>
                      <td
                        colSpan={2}
                        style={{
                          ...tdStyle,
                          fontWeight: "bold",
                          color: TEAL_DARK,
                          fontSize: "10.5px",
                          padding: "1mm 1.5mm",
                          background: "#f4fafc",
                        }}
                      >
                        • {g.nameAr || g.nameFr}
                      </td>
                      {isFirstVisualRow && (
                        <>
                          <td
                            rowSpan={totalRows}
                            style={{
                              ...tdStyle,
                              textAlign: "center",
                              fontWeight: "bold",
                              fontSize: "13px",
                              verticalAlign: "middle",
                              color: domaine.moyenneDomaine >= 10 ? "#1b5e20" : "#b71c1c",
                              background: "#fafafa",
                            }}
                          >
                            {formatNote(domaine.moyenneDomaine)}
                          </td>
                          <td
                            rowSpan={totalRows}
                            style={{ ...tdStyle, fontSize: "10.5px", verticalAlign: "middle", lineHeight: 1.5 }}
                          >
                            {recommandation}
                          </td>
                        </>
                      )}
                      <td style={{ ...tdStyle, background: "#f4fafc" }} />
                      <td style={{ ...tdStyle, background: "#f4fafc" }} />
                    </tr>
                  );
                  visualRowIdx++;
                }
                g.modules.forEach((mod) => {
                  const isFirstVisualRow = visualRowIdx === 0;
                  rows.push(
                    <ModuleRow
                      key={`m-${mod.moduleId}`}
                      mod={mod}
                      isFirst={isFirstVisualRow}
                      rowSpan={totalRows}
                      moyenneDomaine={domaine.moyenneDomaine}
                      recommandation={recommandation}
                    />
                  );
                  visualRowIdx++;
                });
              });
              return rows;
            })()
          )}
        </tbody>
      </table>
    </div>
  );
}

function ModuleRow({
  mod,
  isFirst,
  rowSpan,
  moyenneDomaine,
  recommandation,
}: {
  mod: BulletinModuleDTO;
  isFirst: boolean;
  rowSpan: number;
  moyenneDomaine: number;
  recommandation: string;
}) {
  const note = mod.moyenneModule;
  const hasNote = note != null && note > 0;
  return (
    <tr>
      <td style={{ ...tdStyle, fontWeight: 600, color: TEAL_DARK, fontSize: "10.5px" }}>
        {mod.moduleNameAr || mod.moduleName}
      </td>
      <td
        style={{
          ...tdStyle,
          textAlign: "center",
          fontWeight: "bold",
          color: hasNote ? (note >= 10 ? "#1b5e20" : "#b71c1c") : "#888",
        }}
      >
        {hasNote ? formatNote(note) : "—"}
      </td>
      {isFirst && (
        <td
          rowSpan={rowSpan}
          style={{
            ...tdStyle,
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "13px",
            verticalAlign: "middle",
            color: moyenneDomaine >= 10 ? "#1b5e20" : "#b71c1c",
            background: "#fafafa",
          }}
        >
          {formatNote(moyenneDomaine)}
        </td>
      )}
      {isFirst && (
        <td
          rowSpan={rowSpan}
          style={{
            ...tdStyle,
            fontSize: "10.5px",
            verticalAlign: "middle",
            lineHeight: 1.5,
          }}
        >
          {recommandation}
        </td>
      )}
      <td style={{ ...tdStyle, textAlign: "center" }}>{formatNote(mod.moduleMin)}</td>
      <td style={{ ...tdStyle, textAlign: "center" }}>{formatNote(mod.moduleMax)}</td>
    </tr>
  );
}

// ───────────────── Side panel cards ─────────────────

function MiniStatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "good" | "bad" | "primary";
}) {
  const valColor = tone === "good" ? "#1b5e20" : tone === "bad" ? "#b71c1c" : TEAL_DARK;
  return (
    <div
      style={{
        flex: 1,
        border: `1px solid ${TEAL}`,
        borderRadius: "1.5mm",
        background: TEAL_LIGHT,
        textAlign: "center",
        overflow: "hidden",
        minHeight: "16mm",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          fontSize: "8.5px",
          color: TEAL_DARK,
          padding: "0.8mm 0.5mm",
          fontWeight: 600,
          lineHeight: 1.2,
          minHeight: "8mm",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "15px",
          fontWeight: "bold",
          color: valColor,
          background: "#fff",
          padding: "1.5mm 0.5mm",
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function BadgePanel({
  title,
  children,
  minHeight,
}: {
  title: string;
  children: React.ReactNode;
  minHeight?: string;
}) {
  return (
    <div
      style={{
        border: `1px solid ${TEAL}`,
        borderRadius: "1.5mm",
        background: "#fff",
        position: "relative",
        paddingTop: "5mm",
        minHeight,
      }}
    >
      {/* Floating pill label at top center */}
      <div
        style={{
          position: "absolute",
          top: "-3mm",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            background: TEAL_LIGHT,
            border: `1px solid ${TEAL}`,
            borderRadius: "3mm",
            padding: "0.6mm 4mm",
            fontSize: "9px",
            color: TEAL_DARK,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </span>
      </div>
      <div style={{ padding: "1mm" }}>{children}</div>
    </div>
  );
}

// ───────────────── Helpers ─────────────────

function formatNote(val: number | null | undefined): string {
  if (val == null || Number.isNaN(val)) return "—";
  return val.toFixed(2);
}

/** Build "مجال X" without doubling the prefix when the data already includes it. */
function formatDomaineTitle(nameAr: string | null, nameFr: string): string {
  const raw = (nameAr || nameFr || "").trim();
  if (!raw) return "مجال";
  // Avoid "مجال مجال X" if the stored value already starts with "مجال"
  return raw.startsWith("مجال") ? raw : `مجال ${raw}`;
}

function avg(values: number[]): number {
  const filtered = values.filter((v) => !Number.isNaN(v));
  if (filtered.length === 0) return 0;
  return filtered.reduce((a, b) => a + b, 0) / filtered.length;
}

const thStyle: React.CSSProperties = {
  border: `1px solid ${BORDER}`,
  padding: "1.2mm 1.5mm",
  fontSize: "9.5px",
  fontWeight: "bold",
  textAlign: "center",
  whiteSpace: "normal",
};

const tdStyle: React.CSSProperties = {
  border: `1px solid ${BORDER}`,
  padding: "1.2mm 1.5mm",
  fontSize: "10.5px",
  verticalAlign: "middle",
};
