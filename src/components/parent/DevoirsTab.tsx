import { useState } from "react";
import {
  Loader2,
  PenTool,
  Paperclip,
  Download,
  CheckCircle2,
  AlertTriangle,
  Upload,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useChildDevoirs, useSubmitChildDevoir } from "@/hooks/useParentPortal";
import type { ChildDevoir } from "@/api/parent-portal.api";
import { uploadFile, resolveFileUrl, extractOriginalName } from "@/api/storage.api";
import { useLanguage, type SupportedLanguage } from "@/hooks/useLanguage";
import { formatDate } from "@/lib/format-locale";
import { notify } from "@/lib/toast";

function fmtDate(d: string | null | undefined, lang: SupportedLanguage): string {
  return formatDate(d, lang);
}

type Etat = {
  /** Clé i18n — la traduction se fait au rendu. */
  key: string;
  className: string;
  icon?: typeof CheckCircle2;
  /** Note affichée à côté du libellé quand la copie est corrigée. */
  suffix?: string;
};

/**
 * Etat de la copie, du point de vue du parent : « qu'est-ce que je dois
 * faire ? » plutot que le statut brut du devoir.
 */
function etatDe(devoir: ChildDevoir): Etat {
  const copie = devoir.soumission;
  const echeanceDepassee =
    !!devoir.dateLimite && new Date(devoir.dateLimite) < new Date(new Date().toDateString());

  if (copie?.corrige) {
    return {
      key: "parentPortal.homework.state.corrected",
      className: "bg-emerald-100 text-emerald-700",
      icon: CheckCircle2,
      suffix: copie.note != null ? `${copie.note}/${devoir.pointsMax ?? 20}` : undefined,
    };
  }
  if (copie) {
    return copie.enRetard
      ? {
          key: "parentPortal.homework.state.submittedLate",
          className: "bg-amber-100 text-amber-700",
        }
      : {
          key: "parentPortal.homework.state.submitted",
          className: "bg-blue-100 text-blue-700",
        };
  }
  if (echeanceDepassee) {
    return {
      key: "parentPortal.homework.state.notSubmitted",
      className: "bg-red-100 text-red-700",
      icon: AlertTriangle,
    };
  }
  return {
    key: "parentPortal.homework.state.toSubmit",
    className: "bg-muted text-foreground",
  };
}

function SubmitDialog({
  devoir,
  studentId,
  onClose,
}: {
  devoir: ChildDevoir;
  studentId: string;
  onClose: () => void;
}) {
  const { t, currentLang } = useLanguage();
  const [contenu, setContenu] = useState(devoir.soumission?.contenu ?? "");
  const [fichierUrl, setFichierUrl] = useState(devoir.soumission?.fichierUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const submit = useSubmitChildDevoir(studentId);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const info = await uploadFile(file, "soumissions");
      setFichierUrl(info.fileUrl);
    } catch (err) {
      notify.error(
        err instanceof Error ? err.message : t("parentPortal.homework.uploadError")
      );
    } finally {
      setUploading(false);
      // Permet de re-selectionner le meme fichier apres une erreur.
      e.target.value = "";
    }
  };

  const rienASoumettre = !contenu.trim() && !fichierUrl;

  const handleSubmit = () => {
    submit.mutate(
      { devoirId: devoir.id, payload: { contenu: contenu.trim(), fichierUrl } },
      { onSuccess: onClose }
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{devoir.titre}</DialogTitle>
          <DialogDescription>
            {devoir.moduleNom ? `${devoir.moduleNom} · ` : ""}
            {t("parentPortal.homework.dueOn", {
              date: fmtDate(devoir.dateLimite, currentLang),
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label htmlFor="reponse" className="mb-1.5 block text-sm font-medium">
              {t("parentPortal.homework.answer")}
            </label>
            <Textarea
              id="reponse"
              rows={6}
              value={contenu}
              onChange={(e) => setContenu(e.target.value)}
              placeholder={t("parentPortal.homework.answerPlaceholder")}
            />
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium">
              {t("parentPortal.homework.attachment")}
            </span>
            {fichierUrl ? (
              <div className="flex items-center gap-2 rounded-lg border p-2">
                <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {extractOriginalName(fichierUrl)}
                </span>
                <button
                  type="button"
                  onClick={() => setFichierUrl("")}
                  aria-label={t("parentPortal.homework.removeFile")}
                  className="rounded p-1 text-muted-foreground hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground hover:bg-muted">
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("parentPortal.homework.uploading")}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    {t("parentPortal.homework.chooseFile")}
                  </>
                )}
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFile}
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          {devoir.soumission && (
            <p className="text-xs text-muted-foreground">
              {t("parentPortal.homework.replaceHint", {
                date: fmtDate(devoir.soumission.dateSoumission, currentLang),
              })}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="min-h-[44px]">
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={rienASoumettre || uploading || submit.isPending}
            className="min-h-[44px]"
          >
            {submit.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {t("common.send")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DevoirsTab({ studentId }: { studentId: string }) {
  const { t, currentLang } = useLanguage();
  const { data: devoirs = [], isLoading } = useChildDevoirs(studentId);
  const [ouvert, setOuvert] = useState<ChildDevoir | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (devoirs.length === 0) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        <PenTool className="mx-auto mb-3 h-10 w-10" />
        <p className="text-sm">{t("parentPortal.homework.empty")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {devoirs.map((devoir) => {
        const etat = etatDe(devoir);
        const copie = devoir.soumission;
        return (
          <div key={devoir.id} className="rounded-xl border p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium leading-tight">{devoir.titre}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {[devoir.moduleNom, devoir.enseignantNom].filter(Boolean).join(" · ")}
                </p>
              </div>
              <Badge className={`shrink-0 ${etat.className}`}>
                {etat.icon && <etat.icon className="me-1 h-3 w-3" />}
                {t(etat.key)}
                {etat.suffix ? ` ${etat.suffix}` : ""}
              </Badge>
            </div>

            {devoir.description && (
              <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                {devoir.description}
              </p>
            )}

            <p className="mt-2 text-xs text-muted-foreground">
              {t("parentPortal.homework.dueOn", {
                date: fmtDate(devoir.dateLimite, currentLang),
              })}
              {devoir.pointsMax
                ? ` · ${t("parentPortal.homework.outOf", { points: devoir.pointsMax })}`
                : ""}
            </p>

            {devoir.fichierUrl && (
              <a
                href={resolveFileUrl(devoir.fichierUrl)}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <Download className="h-4 w-4" />
                {t("parentPortal.homework.statement")} ·{" "}
                {extractOriginalName(devoir.fichierUrl)}
              </a>
            )}

            {copie?.corrige && copie.commentaireCorrection && (
              <div className="mt-2 rounded-lg bg-emerald-50 p-2 text-sm text-emerald-900">
                <span className="font-medium">
                  {t("parentPortal.homework.teacherComment")} :{" "}
                </span>
                {copie.commentaireCorrection}
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {devoir.rendable ? (
                <Button
                  size="sm"
                  variant={copie ? "outline" : "default"}
                  className="min-h-[44px]"
                  onClick={() => setOuvert(devoir)}
                >
                  {copie
                    ? t("parentPortal.homework.editCopy")
                    : t("parentPortal.homework.submit")}
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {copie?.corrige
                    ? t("parentPortal.homework.correctedLocked")
                    : t("parentPortal.homework.closed")}
                </span>
              )}
              {copie?.fichierUrl && (
                <a
                  href={resolveFileUrl(copie.fichierUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-1.5 text-sm text-muted-foreground hover:underline"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  {t("parentPortal.homework.myCopy")}
                </a>
              )}
            </div>
          </div>
        );
      })}

      {ouvert && (
        <SubmitDialog
          devoir={ouvert}
          studentId={studentId}
          onClose={() => setOuvert(null)}
        />
      )}
    </div>
  );
}
