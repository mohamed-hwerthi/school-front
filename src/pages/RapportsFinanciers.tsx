import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { motion } from "framer-motion";
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  Users,
  School,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CURRENCY } from "@/config/currency";
import { useRapportFinancier } from "@/hooks/useRapportsFinanciers";
import { useSchool } from "@/hooks/useSchool";
import type {
  RapportFinancierDTO,
  LigneParMois,
  LigneParClasse,
  LigneParEleve,
} from "@/api/rapports-financiers.api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const MOIS_FR: Record<string, string> = {
  Sep: "Septembre", Oct: "Octobre", Nov: "Novembre", Dec: "Decembre",
  Jan: "Janvier", Feb: "Fevrier", Mar: "Mars", Apr: "Avril",
  May: "Mai", Jun: "Juin",
};

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

function fmt(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── CSV Export ───────────────────────────────────────

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const bom = "\uFEFF";
  const csv = bom + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RapportsFinanciers() {
  const { t } = useLanguage();
  const [tab, setTab] = useState("recapitulatif");
  const [searchEleve, setSearchEleve] = useState("");
  const { data: rapport, isLoading } = useRapportFinancier();
  const { school } = useSchool();

  if (isLoading || !rapport) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">{t("reportsFinancial.loadingReport")}</p>
      </div>
    );
  }

  const r = rapport.recapitulatif;

  // ─── Export CSV handlers ───

  const exportRecapCSV = () => {
    downloadCSV("recapitulatif.csv",
      ["Indicateur", "Valeur"],
      [
        ["Total Du", fmt(r.totalDu)],
        ["Total Paye", fmt(r.totalPaye)],
        ["Total Impayes", fmt(r.totalImpayes)],
        ["Total Depenses", fmt(r.totalDepenses)],
        ["Solde Net", fmt(r.soldeNet)],
        ["Taux Recouvrement (%)", fmt(r.tauxRecouvrement)],
        ["Nb Paiements", String(r.nbPaiements)],
        ["Nb Payes", String(r.nbPayes)],
        ["Nb Partiels", String(r.nbPartiels)],
        ["Nb En Retard", String(r.nbEnRetard)],
        ["Nb En Attente", String(r.nbEnAttente)],
        ["Total Remises", fmt(r.totalRemises)],
        ["Total Penalites", fmt(r.totalPenalites)],
        ["Nb Relances", String(r.nbRelances)],
      ]
    );
  };

  const exportMoisCSV = () => {
    downloadCSV("rapport_par_mois.csv",
      ["Mois", `Du (${CURRENCY})`, `Paye (${CURRENCY})`, `Solde (${CURRENCY})`, "Nb Paiements", `Depenses (${CURRENCY})`],
      rapport.parMois.map((m) => [
        MOIS_FR[m.mois] || m.mois, fmt(m.montantDu), fmt(m.montantPaye), fmt(m.solde), String(m.nbPaiements), fmt(m.depenses),
      ])
    );
  };

  const exportClasseCSV = () => {
    downloadCSV("rapport_par_classe.csv",
      ["Classe", "Nb Eleves", `Du (${CURRENCY})`, `Paye (${CURRENCY})`, `Solde (${CURRENCY})`, "Taux (%)"],
      rapport.parClasse.map((c) => [
        c.classe, String(c.nbEleves), fmt(c.montantDu), fmt(c.montantPaye), fmt(c.solde), fmt(c.tauxRecouvrement),
      ])
    );
  };

  const exportEleveCSV = () => {
    downloadCSV("rapport_par_eleve.csv",
      ["Nom", "Prenom", "Classe", `Du (${CURRENCY})`, `Paye (${CURRENCY})`, `Solde (${CURRENCY})`, "Statut"],
      rapport.parEleve.map((e) => [
        e.nom, e.prenom, e.classe || "", fmt(e.montantDu), fmt(e.montantPaye), fmt(e.solde),
        e.statut === "A_JOUR" ? "A jour" : "En retard",
      ])
    );
  };

  // ─── PDF Export ───

  const exportPDF = () => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(91, 33, 182);
    doc.rect(0, 0, pageW, 35, "F");
    doc.setTextColor(255);
    doc.setFontSize(18);
    doc.text(school?.nom || "Rapport Financier", 14, 16);
    doc.setFontSize(10);
    doc.text("Rapport Financier - Annee 2025-2026", 14, 25);
    doc.text(`Genere le ${new Date().toLocaleDateString("fr-FR")}`, 14, 31);

    doc.setTextColor(0);
    let y = 45;

    // Recapitulatif
    doc.setFontSize(14);
    doc.text("Recapitulatif", 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [["Indicateur", "Valeur"]],
      body: [
        ["Total Du", `${fmt(r.totalDu)} ${CURRENCY}`],
        ["Total Paye", `${fmt(r.totalPaye)} ${CURRENCY}`],
        ["Total Impayes", `${fmt(r.totalImpayes)} ${CURRENCY}`],
        ["Total Depenses", `${fmt(r.totalDepenses)} ${CURRENCY}`],
        ["Solde Net", `${fmt(r.soldeNet)} ${CURRENCY}`],
        ["Taux Recouvrement", `${fmt(r.tauxRecouvrement)}%`],
        ["Remises", `${fmt(r.totalRemises)} ${CURRENCY}`],
        ["Penalites", `${fmt(r.totalPenalites)} ${CURRENCY}`],
        ["Relances", String(r.nbRelances)],
      ],
      theme: "grid",
      headStyles: { fillColor: [91, 33, 182] },
    });

    y = (doc as any).lastAutoTable.finalY + 12;

    // Par mois
    doc.setFontSize(14);
    doc.text("Rapport par mois", 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [["Mois", `Du (${CURRENCY})`, `Paye (${CURRENCY})`, `Solde (${CURRENCY})`, "Depenses"]],
      body: rapport.parMois.map((m) => [
        MOIS_FR[m.mois] || m.mois, fmt(m.montantDu), fmt(m.montantPaye), fmt(m.solde), fmt(m.depenses),
      ]),
      theme: "grid",
      headStyles: { fillColor: [91, 33, 182] },
    });

    y = (doc as any).lastAutoTable.finalY + 12;
    if (y > 250) { doc.addPage(); y = 20; }

    // Par classe
    doc.setFontSize(14);
    doc.text("Rapport par classe", 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [["Classe", "Eleves", `Du (${CURRENCY})`, `Paye (${CURRENCY})`, `Solde (${CURRENCY})`, "Taux (%)"]],
      body: rapport.parClasse.map((c) => [
        c.classe, String(c.nbEleves), fmt(c.montantDu), fmt(c.montantPaye), fmt(c.solde), fmt(c.tauxRecouvrement),
      ]),
      theme: "grid",
      headStyles: { fillColor: [91, 33, 182] },
    });

    y = (doc as any).lastAutoTable.finalY + 12;
    if (y > 200) { doc.addPage(); y = 20; }

    // Par eleve (top 30)
    doc.setFontSize(14);
    doc.text("Top debiteurs", 14, y);
    y += 4;

    const topEleves = rapport.parEleve.filter((e) => e.solde > 0).slice(0, 30);
    autoTable(doc, {
      startY: y,
      head: [["Nom", "Prenom", "Classe", `Du (${CURRENCY})`, `Paye (${CURRENCY})`, `Solde (${CURRENCY})`]],
      body: topEleves.map((e) => [
        e.nom, e.prenom, e.classe || "", fmt(e.montantDu), fmt(e.montantPaye), fmt(e.solde),
      ]),
      theme: "grid",
      headStyles: { fillColor: [91, 33, 182] },
    });

    doc.save("rapport_financier_2025-2026.pdf");
  };

  // ─── Filtered students ───

  const filteredEleves = rapport.parEleve.filter((e) => {
    if (!searchEleve) return true;
    const q = searchEleve.toLowerCase();
    return `${e.prenom} ${e.nom}`.toLowerCase().includes(q) || (e.classe || "").toLowerCase().includes(q);
  });

  // ─── Chart data ───

  const statutData = [
    { name: "Payes", value: r.nbPayes },
    { name: "Partiels", value: r.nbPartiels },
    { name: "En attente", value: r.nbEnAttente },
    { name: "En retard", value: r.nbEnRetard },
  ].filter((d) => d.value > 0);

  const summaryCards = [
    { label: t("reportsFinancial.totalCollected"), value: r.totalPaye, icon: DollarSign, color: "from-green-500 to-green-600", arrow: ArrowUpRight },
    { label: t("reportsFinancial.totalUnpaid"), value: r.totalImpayes, icon: TrendingUp, color: "from-red-500 to-red-600", arrow: ArrowDownRight },
    { label: t("reportsFinancial.netBalance"), value: r.soldeNet, icon: BarChart3, color: "from-blue-500 to-blue-600", arrow: r.soldeNet >= 0 ? ArrowUpRight : ArrowDownRight },
    { label: t("reportsFinancial.recoveryRate"), value: r.tauxRecouvrement, icon: TrendingUp, color: "from-violet-500 to-violet-600", suffix: "%", arrow: ArrowUpRight },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("reportsFinancial.title")}</h1>
          <p className="text-sm text-gray-500">{t("reportsFinancial.subtitle")} - 2025-2026</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportPDF}>
            <FileText className="me-2 h-4 w-4" /> Export PDF
          </Button>
          <Button variant="outline" onClick={() => {
            exportRecapCSV();
            exportMoisCSV();
            exportClasseCSV();
            exportEleveCSV();
          }}>
            <FileSpreadsheet className="me-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`rounded-xl bg-gradient-to-br ${c.color} p-5 text-white shadow-lg`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80">{c.label}</p>
                <p className="mt-1 text-2xl font-bold">
                  {c.suffix ? `${fmt(c.value)}${c.suffix}` : `${fmt(c.value)} ${CURRENCY}`}
                </p>
              </div>
              <c.icon className="h-10 w-10 text-white/30" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="recapitulatif">{t("reportsFinancial.summary")}</TabsTrigger>
          <TabsTrigger value="par-mois">{t("reportsFinancial.byMonth")}</TabsTrigger>
          <TabsTrigger value="par-classe">{t("reportsFinancial.byClass")}</TabsTrigger>
          <TabsTrigger value="par-eleve">{t("reportsFinancial.byStudent")}</TabsTrigger>
        </TabsList>

        {/* ─── Recapitulatif ─── */}
        <TabsContent value="recapitulatif">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Key Figures */}
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold">{t("reportsFinancial.keyFigures")}</h3>
              <div className="space-y-3 text-sm">
                {[
                  { l: t("reportsFinancial.totalDue"), v: `${fmt(r.totalDu)} ${CURRENCY}` },
                  { l: t("reportsFinancial.totalPaid"), v: `${fmt(r.totalPaye)} ${CURRENCY}` },
                  { l: t("reportsFinancial.totalUnpaid"), v: `${fmt(r.totalImpayes)} ${CURRENCY}`, c: "text-red-600 font-semibold" },
                  { l: t("reportsFinancial.totalExpenses"), v: `${fmt(r.totalDepenses)} ${CURRENCY}` },
                  { l: t("reportsFinancial.netBalance"), v: `${fmt(r.soldeNet)} ${CURRENCY}`, c: r.soldeNet >= 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold" },
                  { l: t("reportsFinancial.recoveryRate"), v: `${fmt(r.tauxRecouvrement)}%` },
                  { l: t("reportsFinancial.totalDiscounts"), v: `${fmt(r.totalRemises)} ${CURRENCY}` },
                  { l: t("reportsFinancial.totalPenalties"), v: `${fmt(r.totalPenalites)} ${CURRENCY}` },
                  { l: t("reportsFinancial.nbReminders"), v: String(r.nbRelances) },
                ].map((row) => (
                  <div key={row.l} className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">{row.l}</span>
                    <span className={row.c || "font-medium"}>{row.v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pie Chart */}
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold">{t("reportsFinancial.paymentDistribution")}</h3>
              <div className="h-72">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={statutData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {statutData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ─── Par Mois ─── */}
        <TabsContent value="par-mois">
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={exportMoisCSV}>
                <Download className="me-1 h-3.5 w-3.5" /> CSV
              </Button>
            </div>

            {/* Chart */}
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold">{t("reportsFinancial.monthlyEvolution")}</h3>
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={rapport.parMois}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mois" />
                    <YAxis />
                    <Tooltip formatter={(v: number) => `${fmt(v)} ${CURRENCY}`} />
                    <Bar dataKey="montantPaye" name="Paye" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="montantDu" name="Du" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="depenses" name="Depenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border bg-white shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-start text-xs font-semibold uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Mois</th>
                    <th className="px-4 py-3 text-end">Du ({CURRENCY})</th>
                    <th className="px-4 py-3 text-end">Paye ({CURRENCY})</th>
                    <th className="px-4 py-3 text-end">Solde ({CURRENCY})</th>
                    <th className="px-4 py-3 text-end">Depenses ({CURRENCY})</th>
                    <th className="px-4 py-3 text-end">Nb Paiements</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rapport.parMois.map((m) => (
                    <tr key={m.mois} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{MOIS_FR[m.mois] || m.mois}</td>
                      <td className="px-4 py-3 text-end">{fmt(m.montantDu)}</td>
                      <td className="px-4 py-3 text-end text-green-600 font-medium">{fmt(m.montantPaye)}</td>
                      <td className="px-4 py-3 text-end">
                        <span className={m.solde > 0 ? "text-red-600" : "text-green-600"}>{fmt(m.solde)}</span>
                      </td>
                      <td className="px-4 py-3 text-end text-red-500">{fmt(m.depenses)}</td>
                      <td className="px-4 py-3 text-end">{m.nbPaiements}</td>
                    </tr>
                  ))}
                  {/* Totals */}
                  <tr className="bg-gray-100 font-semibold">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-end">{fmt(rapport.parMois.reduce((s, m) => s + m.montantDu, 0))}</td>
                    <td className="px-4 py-3 text-end text-green-600">{fmt(rapport.parMois.reduce((s, m) => s + m.montantPaye, 0))}</td>
                    <td className="px-4 py-3 text-end">{fmt(rapport.parMois.reduce((s, m) => s + m.solde, 0))}</td>
                    <td className="px-4 py-3 text-end text-red-500">{fmt(rapport.parMois.reduce((s, m) => s + m.depenses, 0))}</td>
                    <td className="px-4 py-3 text-end">{rapport.parMois.reduce((s, m) => s + m.nbPaiements, 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ─── Par Classe ─── */}
        <TabsContent value="par-classe">
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={exportClasseCSV}>
                <Download className="me-1 h-3.5 w-3.5" /> CSV
              </Button>
            </div>

            {/* Chart */}
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold">{t("reportsFinancial.recoveryByClass")}</h3>
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={rapport.parClasse} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="classe" type="category" width={100} />
                    <Tooltip formatter={(v: number) => `${fmt(v)} ${CURRENCY}`} />
                    <Bar dataKey="montantPaye" name="Paye" fill="#10b981" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="solde" name="Reste" fill="#ef4444" radius={[0, 4, 4, 0]} />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border bg-white shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-start text-xs font-semibold uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Classe</th>
                    <th className="px-4 py-3 text-end">Eleves</th>
                    <th className="px-4 py-3 text-end">Du ({CURRENCY})</th>
                    <th className="px-4 py-3 text-end">Paye ({CURRENCY})</th>
                    <th className="px-4 py-3 text-end">Solde ({CURRENCY})</th>
                    <th className="px-4 py-3 text-end">Taux (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rapport.parClasse.map((c) => (
                    <tr key={c.classe} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-2">
                          <School className="h-4 w-4 text-gray-400" />
                          {c.classe}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-end">{c.nbEleves}</td>
                      <td className="px-4 py-3 text-end">{fmt(c.montantDu)}</td>
                      <td className="px-4 py-3 text-end text-green-600 font-medium">{fmt(c.montantPaye)}</td>
                      <td className="px-4 py-3 text-end">
                        <span className={c.solde > 0 ? "text-red-600" : "text-green-600"}>{fmt(c.solde)}</span>
                      </td>
                      <td className="px-4 py-3 text-end">
                        <Badge className={`border-0 ${c.tauxRecouvrement >= 80 ? "bg-green-100 text-green-700" : c.tauxRecouvrement >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                          {fmt(c.tauxRecouvrement)}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ─── Par Eleve ─── */}
        <TabsContent value="par-eleve">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Input
                placeholder={t("reportsFinancial.searchStudent")}
                value={searchEleve}
                onChange={(e) => setSearchEleve(e.target.value)}
                className="sm:w-72"
              />
              <Button variant="outline" size="sm" onClick={exportEleveCSV}>
                <Download className="me-1 h-3.5 w-3.5" /> CSV
              </Button>
            </div>

            <div className="rounded-xl border bg-white shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-start text-xs font-semibold uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Eleve</th>
                    <th className="px-4 py-3">Classe</th>
                    <th className="px-4 py-3 text-end">Du ({CURRENCY})</th>
                    <th className="px-4 py-3 text-end">Paye ({CURRENCY})</th>
                    <th className="px-4 py-3 text-end">Solde ({CURRENCY})</th>
                    <th className="px-4 py-3">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredEleves.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                        {t("common.noResults")}
                      </td>
                    </tr>
                  ) : (
                    filteredEleves.map((e) => (
                      <tr key={e.studentId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            {e.prenom} {e.nom}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{e.classe || "-"}</td>
                        <td className="px-4 py-3 text-end">{fmt(e.montantDu)}</td>
                        <td className="px-4 py-3 text-end text-green-600 font-medium">{fmt(e.montantPaye)}</td>
                        <td className="px-4 py-3 text-end">
                          <span className={e.solde > 0 ? "text-red-600 font-semibold" : "text-green-600"}>{fmt(e.solde)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`border-0 ${e.statut === "A_JOUR" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {e.statut === "A_JOUR" ? "A jour" : "En retard"}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
