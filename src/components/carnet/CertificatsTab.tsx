import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useCarnetSelection } from "./CarnetSelectionContext";
import {
  GraduationCap,
  Printer,
  Award,
  Eye,
  TrendingUp,
  Target,
  UserX,
  Crown,
  ChevronDown,
  ChevronRight,
  BarChart3,
  FileText,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNiveaux } from "@/hooks/useNiveaux";
import { useClasses } from "@/hooks/useClasses";
import { useBulletins } from "@/hooks/useBulletins";
import type { BulletinDTO } from "@/api/bulletins.api";
import { useSchoolSettings } from "@/hooks/useSchoolSettings";
import CertificatPrint from "./CertificatPrint";
import { KpiCard, CertificatPie } from "./statsCharts";

const TRIMESTRES = [
  { value: 1, label: "Trimestre 1" },
  { value: 2, label: "Trimestre 2" },
  { value: 3, label: "Trimestre 3" },
];

const CERT_TYPES = [
  { value: "all", label: "Tous les certificats" },
  { value: "شهادة شرف الدرجة الأولى", label: "شهادة شرف الدرجة الأولى (≥18)" },
  { value: "شهادة شرف", label: "شهادة شرف (≥16)" },
  { value: "شهادة شكر", label: "شهادة شكر (≥14)" },
  { value: "شهادة تشجيع", label: "شهادة تشجيع (≥12)" },
];

function certBadgeColor(cert: string) {
  if (cert.includes("الأولى")) return "bg-yellow-100 text-yellow-800 border-yellow-300";
  if (cert.includes("شرف")) return "bg-amber-100 text-amber-800 border-amber-300";
  if (cert.includes("شكر")) return "bg-blue-100 text-blue-800 border-blue-300";
  return "bg-green-100 text-green-800 border-green-300";
}

// Tone palette per certificat type — used for borders, hex (charts), text
function certTone(cert: string) {
  if (cert.includes("الأولى"))
    return {
      hex: "#eab308",
      border: "border-yellow-300/70",
      bg: "bg-yellow-50/60 dark:bg-yellow-950/15",
      ring: "ring-yellow-200/60",
      bar: "bg-yellow-400",
      text: "text-yellow-700 dark:text-yellow-400",
    };
  if (cert.includes("شرف"))
    return {
      hex: "#f59e0b",
      border: "border-amber-300/70",
      bg: "bg-amber-50/60 dark:bg-amber-950/15",
      ring: "ring-amber-200/60",
      bar: "bg-amber-400",
      text: "text-amber-700 dark:text-amber-400",
    };
  if (cert.includes("شكر"))
    return {
      hex: "#3b82f6",
      border: "border-blue-300/70",
      bg: "bg-blue-50/60 dark:bg-blue-950/15",
      ring: "ring-blue-200/60",
      bar: "bg-blue-400",
      text: "text-blue-700 dark:text-blue-400",
    };
  return {
    hex: "#10b981",
    border: "border-emerald-300/70",
    bg: "bg-emerald-50/60 dark:bg-emerald-950/15",
    ring: "ring-emerald-200/60",
    bar: "bg-emerald-400",
    text: "text-emerald-700 dark:text-emerald-400",
  };
}

export default function CertificatsTab() {
  const { niveaux } = useNiveaux();
  const { niveauId, classeId, trimestre, setNiveauId, setClasseId, setTrimestre } = useCarnetSelection();
  const [certFilter, setCertFilter] = useState("all");
  const [previewStudent, setPreviewStudent] = useState<BulletinDTO | null>(null);
  const [statsExpanded, setStatsExpanded] = useState(false);
  const [listExpanded, setListExpanded] = useState(false);

  const { data: classes = [] } = useClasses(niveauId || undefined);
  const { data: bulletins = [], isLoading } = useBulletins(classeId, trimestre, "etatique");
  const { data: settings } = useSchoolSettings();

  // Filter students who have a certificate
  const studentsWithCert = bulletins.filter((b) => b.certificatType != null);
  const filtered =
    certFilter === "all"
      ? studentsWithCert
      : studentsWithCert.filter((b) => b.certificatType === certFilter);

  // Aggregate stats
  const totalEleves = bulletins.length;
  const totalCertifies = studentsWithCert.length;
  const sansCert = totalEleves - totalCertifies;
  const tauxCertification = totalEleves > 0 ? (totalCertifies / totalEleves) * 100 : 0;
  const moyenneCertifies = useMemo(() => {
    if (studentsWithCert.length === 0) return 0;
    const sum = studentsWithCert.reduce((s, b) => s + b.moyenneGenerale, 0);
    return sum / studentsWithCert.length;
  }, [studentsWithCert]);

  // Per-type aggregations: count + average + top student
  const perType = useMemo(() => {
    return CERT_TYPES.filter((ct) => ct.value !== "all").map((ct) => {
      const list = studentsWithCert.filter((b) => b.certificatType === ct.value);
      const avg =
        list.length > 0
          ? list.reduce((s, b) => s + b.moyenneGenerale, 0) / list.length
          : 0;
      const top = [...list].sort((a, b) => b.moyenneGenerale - a.moyenneGenerale)[0];
      return { type: ct.value, count: list.length, avg, top };
    });
  }, [studentsWithCert]);

  // Donut data
  const certificatsCounts = useMemo(
    () =>
      perType
        .filter((p) => p.count > 0)
        .map((p) => ({ type: p.type, count: p.count })),
    [perType]
  );

  const dominantType = useMemo(
    () =>
      [...perType].sort((a, b) => b.count - a.count).find((p) => p.count > 0)
        ?.type ?? "—",
    [perType]
  );

  const handlePrintOne = (b: BulletinDTO) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const el = document.getElementById(`cert-print-${b.studentId}`);
    if (!el) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="utf-8">
        <title>Certificat - ${b.studentName}</title>
        <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Amiri', serif; }
          @page { size: A5 landscape; margin: 0; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>${el.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
  };

  const handlePrintAll = () => {
    if (filtered.length === 0) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const el = document.getElementById("certs-print-all");
    if (!el) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="utf-8">
        <title>Certificats</title>
        <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Amiri', serif; }
          @page { size: A5 landscape; margin: 0; }
          .cert-page { page-break-after: always; }
          .cert-page:last-child { page-break-after: avoid; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>${el.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Select
            value={niveauId ? String(niveauId) : ""}
            onValueChange={(v) => {
              setNiveauId(v);
              setClasseId("");
            }}
          >
            <SelectTrigger className="w-[180px]">
              <GraduationCap className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
              <SelectValue placeholder="Niveau" />
            </SelectTrigger>
            <SelectContent>
              {niveaux.map((n) => (
                <SelectItem key={n.id} value={String(n.id)}>
                  {n.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={classeId ? String(classeId) : ""}
            onValueChange={(v) => setClasseId(v)}
            disabled={!niveauId}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Classe" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={trimestre ? String(trimestre) : ""}
            onValueChange={(v) => setTrimestre(Number(v))}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Trimestre" />
            </SelectTrigger>
            <SelectContent>
              {TRIMESTRES.map((t) => (
                <SelectItem key={t.value} value={String(t.value)}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={certFilter} onValueChange={setCertFilter}>
            <SelectTrigger className="w-[260px]">
              <Award className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CERT_TYPES.map((ct) => (
                <SelectItem key={ct.value} value={ct.value}>
                  {ct.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {filtered.length > 0 && (
            <Button
              onClick={handlePrintAll}
              size="sm"
              className="ms-auto gap-2"
            >
              <Printer className="h-4 w-4" />
              Imprimer tout ({filtered.length})
            </Button>
          )}
        </div>
      </motion.div>

      {/* Results */}
      {classeId && trimestre > 0 && (
        <>
          {isLoading ? (
            <div className="rounded-xl border border-border/50 bg-card p-16 shadow-sm text-center text-muted-foreground">
              Chargement...
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border/50 bg-card p-16 shadow-sm text-center text-muted-foreground"
            >
              <Award className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Aucun certificat</p>
              <p className="text-xs mt-1">
                {studentsWithCert.length === 0
                  ? "Aucun élève n'a obtenu de certificat pour ce trimestre"
                  : "Aucun certificat ne correspond au filtre sélectionné"}
              </p>
            </motion.div>
          ) : (
            <>
              {/* Stats section — collapsed by default */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.03 }}
                className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setStatsExpanded(!statsExpanded)}
                  className="w-full flex items-center gap-2 px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-start"
                >
                  {statsExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <BarChart3 className="h-4 w-4 text-amber-600" />
                  <span className="font-semibold text-sm text-foreground">Statistiques — répartition des certificats</span>
                  <span className="ms-auto text-xs text-muted-foreground tabular-nums">
                    {totalCertifies}/{totalEleves} certifiés · {tauxCertification.toFixed(0)}% · Moy. {moyenneCertifies.toFixed(2)}
                  </span>
                </button>
                {statsExpanded && (
                  <div className="p-4 space-y-3 border-t border-border">
                    {/* KPI summary */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <KpiCard
                        label="Total certifiés"
                        value={`${totalCertifies}/${totalEleves}`}
                        icon={Award}
                        color="text-amber-600"
                      />
                      <KpiCard
                        label="Taux de certification"
                        value={`${tauxCertification.toFixed(0)}%`}
                        icon={TrendingUp}
                        color={
                          tauxCertification >= 50
                            ? "text-emerald-600"
                            : "text-amber-600"
                        }
                      />
                      <KpiCard
                        label="Moyenne des certifiés"
                        value={moyenneCertifies.toFixed(2)}
                        icon={Target}
                        color="text-blue-600"
                      />
                      <KpiCard
                        label="Sans certificat"
                        value={sansCert}
                        icon={UserX}
                        color="text-red-600"
                      />
                    </div>

                    {/* Charts row: donut + per-type breakdown */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="lg:col-span-1">
                  <CertificatPie certificats={certificatsCounts} />
                </div>

                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {perType.map((p) => {
                    const tone = certTone(p.type);
                    const pct =
                      totalEleves > 0 ? (p.count / totalEleves) * 100 : 0;
                    const isDominant =
                      p.type === dominantType && p.count > 0;
                    return (
                      <div
                        key={p.type}
                        className={`relative overflow-hidden rounded-xl border ${tone.border} ${tone.bg} p-4 shadow-sm transition-all hover:shadow-md`}
                      >
                        {isDominant && (
                          <span className="absolute top-2 end-2 inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/40 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                            <Crown className="h-2.5 w-2.5" />
                            Top
                          </span>
                        )}
                        <div
                          className={`text-xs font-semibold ${tone.text} mb-1`}
                          dir="rtl"
                        >
                          {p.type}
                        </div>
                        <div className="flex items-end justify-between gap-2 mb-2">
                          <p className="font-heading text-3xl font-bold text-foreground tabular-nums leading-none">
                            {p.count}
                          </p>
                          <div className="text-end text-[11px] text-muted-foreground leading-tight">
                            <p>
                              <span className="font-semibold text-foreground tabular-nums">
                                {pct.toFixed(0)}%
                              </span>{" "}
                              de la classe
                            </p>
                            {p.count > 0 && (
                              <p className="mt-0.5">
                                Moy.{" "}
                                <span className="font-semibold text-foreground tabular-nums">
                                  {p.avg.toFixed(2)}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                          <div
                            className={`h-full ${tone.bar} transition-all duration-500 ease-out`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        {p.top && (
                          <div className="mt-2 flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">
                              1ᵉʳ
                            </span>
                            <span
                              className="font-medium text-foreground truncate"
                              title={p.top.studentName}
                            >
                              {p.top.studentName}
                            </span>
                            <span className="font-semibold text-emerald-600 tabular-nums">
                              {p.top.moyenneGenerale.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Student list — collapsed by default */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.06 }}
                className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setListExpanded(!listExpanded)}
                  className="w-full flex items-center gap-2 px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-start"
                >
                  {listExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <FileText className="h-4 w-4 text-amber-600" />
                  <span className="font-semibold text-sm text-foreground">Liste des élèves & impression</span>
                  <span className="ms-auto text-xs text-muted-foreground tabular-nums">
                    {filtered.length} élève(s)
                  </span>
                </button>
                {listExpanded && (
                <div className="overflow-x-auto border-t border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="py-3 px-4 text-center text-xs font-semibold text-muted-foreground w-12">
                        Rang
                      </th>
                      <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">
                        Élève
                      </th>
                      <th className="py-3 px-4 text-center text-xs font-semibold text-foreground">
                        Moyenne
                      </th>
                      <th className="py-3 px-4 text-center text-xs font-semibold text-muted-foreground">
                        Certificat
                      </th>
                      <th className="py-3 px-4 text-center text-xs font-semibold text-muted-foreground w-32">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...filtered]
                      .sort((a, b) => a.rang - b.rang)
                      .map((b) => (
                        <tr
                          key={b.studentId}
                          className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                        >
                          <td className="py-3 px-4 text-center font-bold text-xs">
                            {b.rang}/{b.totalEleves}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-foreground">
                              {b.studentName}
                            </div>
                            {b.studentNameAr && (
                              <div className="text-xs text-muted-foreground" dir="rtl">
                                {b.studentNameAr}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-emerald-600">
                            {b.moyenneGenerale.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center" dir="rtl">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${certBadgeColor(b.certificatType!)}`}
                            >
                              <Award className="h-3 w-3" />
                              {b.certificatType}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setPreviewStudent(b)}
                                className="h-7 gap-1 text-xs"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Aperçu
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePrintOne(b)}
                                className="h-7 gap-1 text-xs"
                              >
                                <Printer className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                </div>
                )}
              </motion.div>
            </>
          )}
        </>
      )}

      {/* Preview Dialog */}
      <Dialog
        open={previewStudent !== null}
        onOpenChange={(open) => !open && setPreviewStudent(null)}
      >
        <DialogContent className="max-w-[700px] max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex flex-row items-center justify-between">
            <DialogTitle className="text-sm">
              Certificat — {previewStudent?.studentName}
            </DialogTitle>
            <Button
              size="sm"
              onClick={() => previewStudent && handlePrintOne(previewStudent)}
              className="gap-1 text-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              Imprimer
            </Button>
          </DialogHeader>
          <div className="p-4 flex justify-center">
            {previewStudent && (
              <div id={`cert-print-${previewStudent.studentId}`}>
                <CertificatPrint bulletin={previewStudent} schoolName={settings?.schoolName} schoolNameAr={settings?.schoolNameAr ?? undefined} anneeScolaire={settings?.anneeScolaire} />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden containers for individual print */}
      {filtered.map((b) => (
        <div key={b.studentId} id={`cert-print-${b.studentId}`} className="hidden">
          <CertificatPrint bulletin={b} schoolName={settings?.schoolName} schoolNameAr={settings?.schoolNameAr ?? undefined} anneeScolaire={settings?.anneeScolaire} />
        </div>
      ))}

      {/* Hidden print-all container */}
      <div id="certs-print-all" className="hidden">
        {filtered.map((b) => (
          <CertificatPrint key={b.studentId} bulletin={b} />
        ))}
      </div>
    </div>
  );
}
