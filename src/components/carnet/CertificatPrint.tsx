import type { BulletinDTO } from "@/api/bulletins.api";

interface Props {
  bulletin: BulletinDTO;
  schoolName?: string;
  schoolNameAr?: string;
  anneeScolaire?: string;
}

function certGradient(cert: string): string {
  if (cert.includes("الأولى")) return "linear-gradient(135deg, #ffd700 0%, #ffecb3 50%, #ffd700 100%)";
  if (cert.includes("شرف")) return "linear-gradient(135deg, #f0c27f 0%, #fff8e1 50%, #f0c27f 100%)";
  if (cert.includes("شكر")) return "linear-gradient(135deg, #90caf9 0%, #e3f2fd 50%, #90caf9 100%)";
  return "linear-gradient(135deg, #a5d6a7 0%, #e8f5e9 50%, #a5d6a7 100%)";
}

function certBorderColor(cert: string): string {
  if (cert.includes("الأولى")) return "#b8860b";
  if (cert.includes("شرف")) return "#cd853f";
  if (cert.includes("شكر")) return "#4682b4";
  return "#2e8b57";
}

export default function CertificatPrint({
  bulletin,
  schoolName = "المدرسة الابتدائية",
  schoolNameAr,
  anneeScolaire = "2025 / 2026",
}: Props) {
  const b = bulletin;
  const cert = b.certificatType;
  if (!cert) return null;

  const trimestreAr = ["الثلاثي الأول", "الثلاثي الثاني", "الثلاثي الثالث"][
    b.trimestre - 1
  ];
  const borderColor = certBorderColor(cert);

  return (
    <div
      className="cert-page"
      dir="rtl"
      style={{
        width: "210mm",
        height: "148mm",
        padding: "6mm",
        fontFamily: "'Amiri', 'Traditional Arabic', 'Arial', serif",
        fontSize: "12px",
        lineHeight: 1.8,
        background: certGradient(cert),
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative border */}
      <div
        style={{
          position: "absolute",
          inset: "4mm",
          border: `3px double ${borderColor}`,
          borderRadius: "8px",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "7mm",
          border: `1px solid ${borderColor}`,
          borderRadius: "6px",
          pointerEvents: "none",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          padding: "10mm 12mm 6mm",
          textAlign: "center",
        }}
      >
        {/* School Name */}
        <div style={{ fontSize: "11px", color: "#555" }}>
          الجمهورية التونسية ـ وزارة التربية
        </div>
        <div style={{ fontSize: "14px", fontWeight: "bold", marginTop: "1mm" }}>
          {schoolNameAr || schoolName}
        </div>

        {/* Certificate Title */}
        <div
          style={{
            fontSize: "28px",
            fontWeight: "bold",
            color: borderColor,
            marginTop: "6mm",
            letterSpacing: "2px",
          }}
        >
          {cert}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "12px",
            color: "#555",
            marginTop: "3mm",
          }}
        >
          تُسند إلى التلميذ(ة)
        </div>

        {/* Student Name */}
        <div
          style={{
            fontSize: "22px",
            fontWeight: "bold",
            color: "#1a1a1a",
            marginTop: "3mm",
            borderBottom: `2px solid ${borderColor}`,
            display: "inline-block",
            paddingBottom: "2mm",
            paddingLeft: "10mm",
            paddingRight: "10mm",
          }}
        >
          {b.studentNameAr || b.studentName}
        </div>

        {/* Details */}
        <div style={{ fontSize: "12px", marginTop: "5mm", color: "#333" }}>
          بالقسم <strong>{b.classe}</strong>
          {" "}وذلك لتحصله(ا) على معدل{" "}
          <strong
            style={{
              fontSize: "16px",
              color: borderColor,
            }}
          >
            {b.moyenneGenerale.toFixed(2)}
          </strong>
          {" "}/ 20
          {" "}خلال <strong>{trimestreAr}</strong>
          {" "}للسنة الدراسية <strong>{anneeScolaire}</strong>
        </div>

        {/* Rank */}
        <div style={{ fontSize: "11px", marginTop: "2mm", color: "#555" }}>
          الترتيب: {b.rang} من {b.totalEleves} تلميذا
        </div>

        {/* Signatures */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "10mm",
            fontSize: "11px",
          }}
        >
          <div style={{ textAlign: "center", width: "40%" }}>
            <div style={{ fontWeight: "bold" }}>المعلم(ة)</div>
            <div
              style={{
                marginTop: "8mm",
                borderTop: "1px dotted #999",
                paddingTop: "1mm",
              }}
            >
              ............................
            </div>
          </div>
          <div style={{ textAlign: "center", width: "40%" }}>
            <div style={{ fontWeight: "bold" }}>مدير(ة) المدرسة</div>
            <div
              style={{
                marginTop: "8mm",
                borderTop: "1px dotted #999",
                paddingTop: "1mm",
              }}
            >
              ............................
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
