interface GradeEntry {
  note: number;
  coefficient: number;
  moduleName: string;
  trimestre: number;
}

export type { GradeEntry };

export function computeTrimestreAverage(grades: GradeEntry[], trimestre: number): number {
  const filtered = grades.filter(g => g.trimestre === trimestre);
  if (filtered.length === 0) return 0;
  const totalWeighted = filtered.reduce((sum, g) => sum + g.note * g.coefficient, 0);
  const totalCoeff = filtered.reduce((sum, g) => sum + g.coefficient, 0);
  return totalCoeff > 0 ? +(totalWeighted / totalCoeff).toFixed(1) : 0;
}

export function computeSubjectAverages(grades: GradeEntry[]): Record<string, Record<number, number>> {
  const result: Record<string, Record<number, number>> = {};
  for (const g of grades) {
    if (!result[g.moduleName]) result[g.moduleName] = {};
    if (!result[g.moduleName][g.trimestre]) {
      const subjectGrades = grades.filter(x => x.moduleName === g.moduleName && x.trimestre === g.trimestre);
      const avg = subjectGrades.reduce((s, x) => s + x.note, 0) / subjectGrades.length;
      result[g.moduleName][g.trimestre] = +avg.toFixed(1);
    }
  }
  return result;
}

export function computeTrend(t1: number, t2: number, t3: number): "improving" | "stable" | "declining" {
  const values = [t1, t2, t3].filter(v => v > 0);
  if (values.length < 2) return "stable";
  const last = values[values.length - 1];
  const prev = values[values.length - 2];
  if (last - prev > 1) return "improving";
  if (prev - last > 1) return "declining";
  return "stable";
}

export function computeMonthlyAbsences(
  absences: Array<{ date: string }>,
  months: string[] = ["Sep", "Oct", "Nov", "Dec", "Jan", "Fev", "Mar", "Avr", "Mai", "Juin"]
): Array<{ month: string; count: number }> {
  const monthMap: Record<number, string> = {
    8: "Sep", 9: "Oct", 10: "Nov", 11: "Dec",
    0: "Jan", 1: "Fev", 2: "Mar", 3: "Avr", 4: "Mai", 5: "Juin",
  };

  const counts: Record<string, number> = {};
  for (const m of months) {
    counts[m] = 0;
  }

  for (const a of absences) {
    const d = new Date(a.date);
    const monthIdx = d.getMonth();
    const label = monthMap[monthIdx];
    if (label && counts[label] !== undefined) {
      counts[label]++;
    }
  }

  return months.map(m => ({ month: m, count: counts[m] || 0 }));
}
