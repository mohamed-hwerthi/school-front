import { Loader2, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useChildPaiements } from "@/hooks/useParentPortal";
import { useLanguage, type SupportedLanguage } from "@/hooks/useLanguage";
import { formatDate, formatNumber } from "@/lib/format-locale";
import { CURRENCY } from "@/config/currency";

function fmtMoney(n: number | null | undefined, lang: SupportedLanguage): string {
  return `${formatNumber(n, lang)} ${CURRENCY}`;
}

const STATUT_KEYS: Record<string, string> = {
  PAYE: "parentPortal.payments.status.paid",
  PARTIEL: "parentPortal.payments.status.partial",
  EN_ATTENTE: "parentPortal.payments.status.pending",
  EN_RETARD: "parentPortal.payments.status.late",
};

function statutClass(statut?: string): string {
  switch (statut) {
    case "PAYE":
      return "bg-emerald-100 text-emerald-700";
    case "PARTIEL":
      return "bg-amber-100 text-amber-700";
    case "EN_RETARD":
      return "bg-red-100 text-red-700";
    default:
      return "bg-muted text-foreground";
  }
}

export function PaiementsTab({ studentId }: { studentId: string }) {
  const { t, currentLang } = useLanguage();
  const { data, isLoading } = useChildPaiements(studentId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const lignes = data?.paiements ?? [];

  // Le mode de paiement est une enum backend : on retombe sur la valeur brute
  // si un nouveau mode apparait avant d'etre traduit.
  const modeLabel = (mode?: string) => {
    if (!mode) return "—";
    const key = `parentPortal.payments.methods.${mode}`;
    const label = t(key);
    return label === key ? mode : label;
  };

  const statutLabel = (statut?: string) =>
    statut && STATUT_KEYS[statut] ? t(STATUT_KEYS[statut]) : (statut ?? "—");

  return (
    <div className="space-y-4">
      {/* Le parent veut d'abord savoir ce qu'il reste a payer. */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {[
          {
            label: t("parentPortal.payments.totalDue"),
            value: fmtMoney(data?.totalDu, currentLang),
            tone: "",
          },
          {
            label: t("parentPortal.payments.totalPaid"),
            value: fmtMoney(data?.totalPaye, currentLang),
            tone: "text-emerald-600",
          },
          {
            label: t("parentPortal.payments.remaining"),
            value: fmtMoney(data?.reste, currentLang),
            tone: (data?.reste ?? 0) > 0 ? "text-red-600" : "text-emerald-600",
          },
          {
            label: t("parentPortal.payments.unsettled"),
            value: String(data?.nbEnRetard ?? 0),
            tone: (data?.nbEnRetard ?? 0) > 0 ? "text-amber-600" : "",
          },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border p-3 text-center">
            <p className={`text-base font-bold leading-tight ${s.tone}`}>{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {lignes.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground">
          <Wallet className="mx-auto mb-3 h-10 w-10" />
          <p className="text-sm">{t("parentPortal.payments.empty")}</p>
        </div>
      ) : (
        <>
          {/* Mobile : une carte par ligne — un tableau deborderait de l'ecran. */}
          <div className="space-y-2 md:hidden">
            {lignes.map((p) => (
              <div key={p.id} className="rounded-xl border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium leading-tight">
                      {p.typeFraisNom || "—"}
                      {p.mois ? ` · ${p.mois}` : ""}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                      {p.reference || ""}
                    </p>
                  </div>
                  <Badge className={`shrink-0 ${statutClass(p.statut)}`}>
                    {statutLabel(p.statut)}
                  </Badge>
                </div>

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <span>
                    <span className="text-muted-foreground">
                      {t("parentPortal.payments.due")} :{" "}
                    </span>
                    {fmtMoney(p.montantDu, currentLang)}
                  </span>
                  <span>
                    <span className="text-muted-foreground">
                      {t("parentPortal.payments.paid")} :{" "}
                    </span>
                    {fmtMoney(p.montantPaye, currentLang)}
                  </span>
                  {p.reste > 0 && (
                    <span className="font-medium text-red-600">
                      {t("parentPortal.payments.remainingShort")} :{" "}
                      {fmtMoney(p.reste, currentLang)}
                    </span>
                  )}
                </div>

                {p.datePaiement && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("parentPortal.payments.paidOn")}{" "}
                    {formatDate(p.datePaiement, currentLang)}
                    {p.modePaiement ? ` · ${modeLabel(p.modePaiement)}` : ""}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("parentPortal.payments.feeType")}</TableHead>
                  <TableHead>{t("parentPortal.payments.month")}</TableHead>
                  <TableHead className="text-end">
                    {t("parentPortal.payments.due")}
                  </TableHead>
                  <TableHead className="text-end">
                    {t("parentPortal.payments.paid")}
                  </TableHead>
                  <TableHead className="text-end">
                    {t("parentPortal.payments.remainingShort")}
                  </TableHead>
                  <TableHead>{t("parentPortal.payments.paidOn")}</TableHead>
                  <TableHead>{t("parentPortal.payments.method")}</TableHead>
                  <TableHead className="text-center">{t("common.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lignes.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.typeFraisNom || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.mois || "—"}
                    </TableCell>
                    <TableCell className="text-end">
                      {fmtMoney(p.montantDu, currentLang)}
                    </TableCell>
                    <TableCell className="text-end">
                      {fmtMoney(p.montantPaye, currentLang)}
                    </TableCell>
                    <TableCell
                      className={`text-end ${p.reste > 0 ? "font-medium text-red-600" : ""}`}
                    >
                      {fmtMoney(p.reste, currentLang)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(p.datePaiement, currentLang)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {modeLabel(p.modePaiement)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={statutClass(p.statut)}>
                        {statutLabel(p.statut)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
