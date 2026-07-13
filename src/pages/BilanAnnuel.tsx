import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Loader2,
  GraduationCap,
  TrendingUp,
  RotateCcw,
  LogOut,
  ArrowRightLeft,
  Trophy,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBilanAnnuel, useBilanComparatif } from "@/hooks/useBilanAnnuel";
import { useStatsMatieres } from "@/hooks/useBulletins";
import { useNiveaux } from "@/hooks/useNiveaux";
import { useClasses } from "@/hooks/useClasses";
import { useConseilClasse } from "@/hooks/useConseilClasse";

const DECISION_META = [
  { key: "Passage", color: "#10b981", icon: TrendingUp },
  { key: "Redoublement", color: "#f59e0b", icon: RotateCcw },
  { key: "Exclusion", color: "#ef4444", icon: LogOut },
  { key: "Transfert", color: "#3b82f6", icon: ArrowRightLeft },
] as const;

const MENTION_STYLES: Record<string, string> = {
  Excellence: "bg-purple-100 text-purple-700 border-purple-200",
  Félicitations: "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Tableau d'honneur": "bg-blue-100 text-blue-700 border-blue-200",
  Encouragements: "bg-amber-100 text-amber-700 border-amber-200",
};

function fmt(n: number | null | undefined): string {
  return n == null ? "—" : n.toFixed(2);
}

export default function BilanAnnuel() {
  const { data: bilan, isLoading, isError } = useBilanAnnuel();

  // Palmarès tab
  const { niveaux } = useNiveaux();
  const [selectedNiveau, setSelectedNiveau] = useState(0);
  const { data: classes = [] } = useClasses(selectedNiveau || undefined);
  const [selectedClasse, setSelectedClasse] = useState(0);
  const { data: conseil, isLoading: conseilLoading } = useConseilClasse(selectedClasse);
  const { data: comparatif = [] } = useBilanComparatif();
  const { data: matieres = [] } = useStatsMatieres(selectedClasse);

  const kpis = useMemo(() => {
    if (!bilan) return [];
    return [
      { ...DECISION_META[0], count: bilan.nbPassage, taux: bilan.tauxPassage },
      { ...DECISION_META[1], count: bilan.nbRedoublement, taux: bilan.tauxRedoublement },
      { ...DECISION_META[2], count: bilan.nbExclusion, taux: bilan.tauxExclusion },
      { ...DECISION_META[3], count: bilan.nbTransfert, taux: bilan.tauxTransfert },
    ];
  }, [bilan]);

  const niveauChart = useMemo(
    () =>
      (bilan?.parNiveau ?? []).map((n) => ({
        niveau: n.niveau,
        Passage: n.nbPassage,
        Redoublement: n.nbRedoublement,
        Exclusion: n.nbExclusion,
        Transfert: n.nbTransfert,
      })),
    [bilan]
  );

  const pieData = useMemo(
    () => kpis.map((k) => ({ name: k.key, value: k.count })).filter((d) => d.value > 0),
    [kpis]
  );

  const ranked = useMemo(
    () => (conseil?.propositions ?? []).filter((p) => p.rang != null),
    [conseil]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100">
            <BarChart3 className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Bilan annuel</h1>
            <p className="text-sm text-slate-500">
              Statistiques de fin d'année et tableau d'honneur
            </p>
          </div>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="palmares">Palmarès</TabsTrigger>
            <TabsTrigger value="comparatif">Comparatif</TabsTrigger>
            <TabsTrigger value="matieres">Par matière</TabsTrigger>
          </TabsList>

          {/* ── Vue d'ensemble ── */}
          <TabsContent value="overview">
            {isLoading && (
              <div className="flex items-center justify-center py-16 text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}

            {isError && (
              <Card>
                <CardContent className="py-12 text-center text-slate-500">
                  <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-amber-400" />
                  Impossible de charger le bilan — vérifiez qu'une année scolaire est active.
                </CardContent>
              </Card>
            )}

            {bilan && !isLoading && (
              <>
                <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
                  <Badge variant="outline">Année : {bilan.anneeScolaire}</Badge>
                  <Badge variant="outline">{bilan.totalDecisions} décision(s)</Badge>
                </div>

                {bilan.totalDecisions === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-slate-500">
                      <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-amber-400" />
                      Aucune décision de fin d'année enregistrée pour cette année.
                      Utilisez le Conseil de classe pour les saisir.
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* KPI cards */}
                    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                      {kpis.map((k) => {
                        const Icon = k.icon;
                        return (
                          <Card key={k.key}>
                            <CardContent className="flex items-center gap-3 py-4">
                              <div
                                className="flex h-10 w-10 items-center justify-center rounded-lg"
                                style={{ backgroundColor: `${k.color}1a` }}
                              >
                                <Icon className="h-5 w-5" style={{ color: k.color }} />
                              </div>
                              <div>
                                <div className="text-xl font-bold text-slate-800">
                                  {k.count}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {k.key} · {k.taux}%
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    {/* Charts */}
                    <div className="mb-6 grid gap-6 lg:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Décisions par niveau</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={niveauChart}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="niveau" fontSize={12} />
                              <YAxis allowDecimals={false} fontSize={12} />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="Passage" fill="#10b981" />
                              <Bar dataKey="Redoublement" fill="#f59e0b" />
                              <Bar dataKey="Exclusion" fill="#ef4444" />
                              <Bar dataKey="Transfert" fill="#3b82f6" />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Répartition des décisions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={pieData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                label={(e) => `${e.name}: ${e.value}`}
                              >
                                {pieData.map((entry) => {
                                  const meta = DECISION_META.find((d) => d.key === entry.name);
                                  return (
                                    <Cell key={entry.name} fill={meta?.color ?? "#94a3b8"} />
                                  );
                                })}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Per-niveau table */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Détail par niveau</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Niveau</TableHead>
                                <TableHead className="text-center">Total</TableHead>
                                <TableHead className="text-center">Passages</TableHead>
                                <TableHead className="text-center">Redoublements</TableHead>
                                <TableHead className="text-center">Exclusions</TableHead>
                                <TableHead className="text-center">Transferts</TableHead>
                                <TableHead className="text-center">Taux passage</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {bilan.parNiveau.map((n) => (
                                <TableRow key={n.niveau}>
                                  <TableCell className="font-medium text-slate-800">
                                    {n.niveau}
                                  </TableCell>
                                  <TableCell className="text-center">{n.total}</TableCell>
                                  <TableCell className="text-center text-emerald-600">
                                    {n.nbPassage}
                                  </TableCell>
                                  <TableCell className="text-center text-amber-600">
                                    {n.nbRedoublement}
                                  </TableCell>
                                  <TableCell className="text-center text-red-600">
                                    {n.nbExclusion}
                                  </TableCell>
                                  <TableCell className="text-center text-blue-600">
                                    {n.nbTransfert}
                                  </TableCell>
                                  <TableCell className="text-center font-semibold">
                                    {n.tauxPassage}%
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </>
            )}
          </TabsContent>

          {/* ── Palmarès ── */}
          <TabsContent value="palmares">
            <Card className="mb-6">
              <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
                <div>
                  <Label>Niveau</Label>
                  <Select
                    value={selectedNiveau ? String(selectedNiveau) : ""}
                    onValueChange={(v) => {
                      setSelectedNiveau(v);
                      setSelectedClasse(0);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un niveau" />
                    </SelectTrigger>
                    <SelectContent>
                      {niveaux.map((n) => (
                        <SelectItem key={n.id} value={String(n.id)}>
                          {n.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Classe</Label>
                  <Select
                    value={selectedClasse ? String(selectedClasse) : ""}
                    onValueChange={(v) => setSelectedClasse(v)}
                    disabled={!selectedNiveau}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une classe" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {selectedClasse > 0 && conseilLoading && (
              <div className="flex items-center justify-center py-16 text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}

            {selectedClasse > 0 && !conseilLoading && conseil && ranked.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-slate-500">
                  <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-amber-400" />
                  Aucune moyenne annuelle disponible pour cette classe.
                </CardContent>
              </Card>
            )}

            {selectedClasse > 0 && !conseilLoading && conseil && ranked.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    Tableau d'honneur — {conseil.classeNom}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-14">Rang</TableHead>
                          <TableHead>Élève</TableHead>
                          <TableHead className="text-center">Moyenne annuelle</TableHead>
                          <TableHead>Mention</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ranked.map((p) => (
                          <TableRow key={p.studentId}>
                            <TableCell className="font-semibold text-slate-400">
                              {p.rang}
                            </TableCell>
                            <TableCell className="font-medium text-slate-800">
                              {p.studentName}
                            </TableCell>
                            <TableCell className="text-center font-semibold">
                              {fmt(p.moyenneAnnuelle)}
                            </TableCell>
                            <TableCell>
                              {p.mention ? (
                                <Badge
                                  variant="outline"
                                  className={MENTION_STYLES[p.mention] ?? ""}
                                >
                                  {p.mention}
                                </Badge>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedClasse === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center gap-2 py-12 text-slate-400">
                  <GraduationCap className="h-8 w-8" />
                  Sélectionnez une classe pour afficher son palmarès.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── Comparatif inter-années (ANN-023) ── */}
          <TabsContent value="comparatif">
            {comparatif.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-slate-500">
                  <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-amber-400" />
                  Aucune donnée disponible pour comparer les années.
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Évolution sur {comparatif.length} année(s)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={comparatif}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="anneeScolaire" fontSize={12} />
                      <YAxis fontSize={12} unit="%" />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="tauxPassage" name="Taux de passage" stroke="#10b981" strokeWidth={2} />
                      <Line type="monotone" dataKey="tauxRedoublement" name="Taux de redoublement" stroke="#f59e0b" strokeWidth={2} />
                      <Line type="monotone" dataKey="tauxExclusion" name="Taux d'exclusion" stroke="#ef4444" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── Taux de réussite par matière (ANN-025) ── */}
          <TabsContent value="matieres">
            <Card className="mb-6">
              <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
                <div>
                  <Label>Niveau</Label>
                  <Select
                    value={selectedNiveau ? String(selectedNiveau) : ""}
                    onValueChange={(v) => {
                      setSelectedNiveau(v);
                      setSelectedClasse(0);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un niveau" />
                    </SelectTrigger>
                    <SelectContent>
                      {niveaux.map((n) => (
                        <SelectItem key={n.id} value={String(n.id)}>
                          {n.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Classe</Label>
                  <Select
                    value={selectedClasse ? String(selectedClasse) : ""}
                    onValueChange={(v) => setSelectedClasse(v)}
                    disabled={!selectedNiveau}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une classe" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {selectedClasse > 0 && matieres.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Taux de réussite par matière</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Matière</TableHead>
                          <TableHead className="text-center">Moyenne</TableHead>
                          <TableHead className="text-center">Réussis</TableHead>
                          <TableHead className="text-center">Échoués</TableHead>
                          <TableHead className="text-center">Taux</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {matieres.map((m) => (
                          <TableRow key={m.moduleId}>
                            <TableCell className="font-medium text-slate-800">{m.moduleName}</TableCell>
                            <TableCell className="text-center text-slate-600">{m.moyenne.toFixed(2)}</TableCell>
                            <TableCell className="text-center text-emerald-600">{m.reussis}</TableCell>
                            <TableCell className="text-center text-red-600">{m.echoues}</TableCell>
                            <TableCell
                              className={`text-center font-semibold ${
                                m.taux >= 50 ? "text-emerald-600" : "text-red-600"
                              }`}
                            >
                              {m.taux}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
            {selectedClasse > 0 && matieres.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-slate-500">
                  Aucune note saisie pour cette classe.
                </CardContent>
              </Card>
            )}
            {selectedClasse === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-slate-400">
                  Sélectionnez une classe pour voir les taux par matière.
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
