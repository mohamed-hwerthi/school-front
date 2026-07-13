import { Fragment, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Loader2, Printer, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useNiveaux } from "@/hooks/useNiveaux";
import { useClasses } from "@/hooks/useClasses";
import { useBulletinsAnnuels } from "@/hooks/useBulletins";

const MENTION_STYLES: Record<string, string> = {
  Excellence: "bg-purple-100 text-purple-700 border-purple-200",
  Félicitations: "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Tableau d'honneur": "bg-blue-100 text-blue-700 border-blue-200",
  Encouragements: "bg-amber-100 text-amber-700 border-amber-200",
};

function fmt(n: number | null): string {
  return n == null ? "—" : n.toFixed(2);
}

export default function BulletinsAnnuels() {
  const { niveaux } = useNiveaux();
  const [selectedNiveau, setSelectedNiveau] = useState(0);
  const { data: classes = [] } = useClasses(selectedNiveau || undefined);
  const [selectedClasse, setSelectedClasse] = useState(0);
  const [expanded, setExpanded] = useState<number | null>(null);
  const { data: bulletins = [], isLoading } = useBulletinsAnnuels(selectedClasse);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100">
              <FileText className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Bulletins annuels</h1>
              <p className="text-sm text-slate-500">Synthèse des trois trimestres par élève</p>
            </div>
          </div>
          {bulletins.length > 0 && (
            <Button variant="outline" onClick={() => window.print()} className="print:hidden">
              <Printer className="me-2 h-4 w-4" /> Imprimer
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card className="mb-6 print:hidden">
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

        {selectedClasse > 0 && isLoading && (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        {selectedClasse > 0 && !isLoading && bulletins.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-slate-500">
              <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-amber-400" />
              Aucune note saisie pour cette classe — impossible de générer les bulletins annuels.
            </CardContent>
          </Card>
        )}

        {bulletins.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Synthèse annuelle — {bulletins[0].classe} ({bulletins.length} élèves)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-14">Rang</TableHead>
                      <TableHead>Élève</TableHead>
                      <TableHead className="text-center">T1</TableHead>
                      <TableHead className="text-center">T2</TableHead>
                      <TableHead className="text-center">T3</TableHead>
                      <TableHead className="text-center">Moy. annuelle</TableHead>
                      <TableHead>Mention</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bulletins.map((b) => (
                      <Fragment key={b.studentId}>
                        <TableRow
                          className="cursor-pointer"
                          onClick={() =>
                            setExpanded(expanded === b.studentId ? null : b.studentId)
                          }
                        >
                          <TableCell className="font-semibold text-slate-400">{b.rang ?? "—"}</TableCell>
                          <TableCell className="font-medium text-slate-800">
                            <span className="inline-flex items-center gap-1">
                              {expanded === b.studentId ? (
                                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                              )}
                              {b.studentName}
                            </span>
                          </TableCell>
                          <TableCell className="text-center text-slate-600">{fmt(b.moyenneT1)}</TableCell>
                          <TableCell className="text-center text-slate-600">{fmt(b.moyenneT2)}</TableCell>
                          <TableCell className="text-center text-slate-600">{fmt(b.moyenneT3)}</TableCell>
                          <TableCell
                            className={`text-center font-bold ${
                              b.moyenneAnnuelle == null
                                ? "text-slate-400"
                                : b.moyenneAnnuelle >= 10
                                  ? "text-emerald-600"
                                  : "text-red-600"
                            }`}
                          >
                            {fmt(b.moyenneAnnuelle)}
                          </TableCell>
                          <TableCell>
                            {b.mention ? (
                              <Badge variant="outline" className={MENTION_STYLES[b.mention] ?? ""}>
                                {b.mention}
                              </Badge>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                        {expanded === b.studentId && (
                          <TableRow>
                            <TableCell colSpan={7} className="bg-slate-50 p-3">
                              <div className="mb-1 text-xs font-semibold text-slate-500">
                                Relevé annuel par matière
                              </div>
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-xs text-slate-400">
                                    <th className="text-left font-medium">Matière</th>
                                    <th className="font-medium">T1</th>
                                    <th className="font-medium">T2</th>
                                    <th className="font-medium">T3</th>
                                    <th className="font-medium">Annuelle</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {b.modules.map((m) => (
                                    <tr key={m.moduleId} className="border-t border-slate-100">
                                      <td className="py-1 text-slate-700">{m.moduleName}</td>
                                      <td className="text-center text-slate-500">{fmt(m.moyenneT1)}</td>
                                      <td className="text-center text-slate-500">{fmt(m.moyenneT2)}</td>
                                      <td className="text-center text-slate-500">{fmt(m.moyenneT3)}</td>
                                      <td className="text-center font-semibold text-slate-700">
                                        {fmt(m.moyenneAnnuelle)}
                                      </td>
                                    </tr>
                                  ))}
                                  {b.modules.length === 0 && (
                                    <tr>
                                      <td colSpan={5} className="py-2 text-center text-slate-400">
                                        Aucune matière notée
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
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
              <FileText className="h-8 w-8" />
              Sélectionnez une classe pour générer ses bulletins annuels.
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
