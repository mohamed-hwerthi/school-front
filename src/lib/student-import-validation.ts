/**
 * Per-row validation for student Excel/CSV imports.
 *
 * Each row is validated independently. Errors are returned as a map
 * `{ field → message }` so the preview UI can highlight individual cells
 * with a tooltip explaining the problem.
 *
 * Severity is split:
 *   - "blocker" — the row will be rejected (UI disables the import button)
 *   - "warning" — non-fatal, the row will still be imported but flagged
 */

import type { Student } from "@/types/student";
import { STATUTS } from "@/types/student";

export type ImportRow = Omit<Student, "id" | "dateInscription">;

export type CellError = {
  message: string;
  severity: "blocker" | "warning";
};

export type RowErrors = Partial<Record<keyof ImportRow, CellError>>;

export interface ValidationContext {
  /** Niveau labels (e.g. "1ère année") accepted by the system. */
  niveauNoms: string[];
  /** Matricule values seen earlier in the same file — for duplicate detection. */
  matriculesSeen: Set<string>;
  /** Email values seen earlier in the same file — for duplicate detection. */
  emailsSeen: Set<string>;
  /** Parent emails seen earlier — non-blocking warning when duplicated. */
  parentEmailsSeen: Set<string>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Tunisian phone: optional +216, 8 digits, allow spaces/dashes
const PHONE_TN_RE = /^(?:\+?216[\s-]?)?\d{2}[\s-]?\d{3}[\s-]?\d{3}$/;
// ISO date YYYY-MM-DD
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
// Classe: digits + optional letter, e.g. "1A", "12B", "9"
const CLASSE_RE = /^\d{1,2}[A-Z]?$/;

const STUDENT_AGE_MIN = 3;
const STUDENT_AGE_MAX = 30;

function isBlank(v: unknown): boolean {
  return v == null || String(v).trim() === "";
}

function ageFromIsoDate(iso: string): number | null {
  if (!DATE_RE.test(iso)) return null;
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

/**
 * Validate one row. Mutates the seen-sets so subsequent rows can detect
 * duplicates.
 */
export function validateRow(row: ImportRow, ctx: ValidationContext): RowErrors {
  const errors: RowErrors = {};

  // ── Required fields ─────────────────────────────────────
  if (isBlank(row.prenom)) {
    errors.prenom = { severity: "blocker", message: "Prénom obligatoire" };
  }
  if (isBlank(row.nom)) {
    errors.nom = { severity: "blocker", message: "Nom obligatoire" };
  }
  if (isBlank(row.classe)) {
    errors.classe = { severity: "blocker", message: "Classe obligatoire" };
  } else if (!CLASSE_RE.test(row.classe.trim().toUpperCase())) {
    errors.classe = {
      severity: "blocker",
      message: 'Format invalide (ex. "1A", "9B")',
    };
  }
  if (isBlank(row.niveau)) {
    errors.niveau = { severity: "blocker", message: "Niveau obligatoire" };
  } else if (ctx.niveauNoms.length > 0 && !ctx.niveauNoms.includes(row.niveau)) {
    errors.niveau = {
      severity: "blocker",
      message: `Niveau inconnu — attendu : ${ctx.niveauNoms.slice(0, 3).join(", ")}…`,
    };
  }

  // ── Sexe ────────────────────────────────────────────────
  if (isBlank(row.sexe)) {
    errors.sexe = { severity: "blocker", message: "Sexe obligatoire (M ou F)" };
  } else if (row.sexe !== "M" && row.sexe !== "F") {
    errors.sexe = { severity: "blocker", message: "Doit être exactement M ou F" };
  }

  // ── Date naissance ──────────────────────────────────────
  if (!isBlank(row.dateNaissance)) {
    if (!DATE_RE.test(row.dateNaissance)) {
      errors.dateNaissance = {
        severity: "blocker",
        message: "Format attendu YYYY-MM-DD",
      };
    } else {
      const age = ageFromIsoDate(row.dateNaissance);
      if (age == null) {
        errors.dateNaissance = { severity: "blocker", message: "Date invalide" };
      } else if (age < STUDENT_AGE_MIN || age > STUDENT_AGE_MAX) {
        errors.dateNaissance = {
          severity: "warning",
          message: `Âge ${age} ans hors plage attendue (${STUDENT_AGE_MIN}-${STUDENT_AGE_MAX})`,
        };
      }
    }
  }

  // ── Statut ──────────────────────────────────────────────
  if (!isBlank(row.statut) && !STATUTS.includes(row.statut as (typeof STATUTS)[number])) {
    errors.statut = {
      severity: "blocker",
      message: `Doit être : ${STATUTS.join(" / ")}`,
    };
  }

  // ── Email élève (optionnel) ─────────────────────────────
  if (!isBlank(row.email)) {
    if (!EMAIL_RE.test(row.email!)) {
      errors.email = { severity: "blocker", message: "Email invalide" };
    } else {
      const lower = row.email!.toLowerCase();
      if (ctx.emailsSeen.has(lower)) {
        errors.email = {
          severity: "blocker",
          message: "Email en double dans ce fichier",
        };
      } else {
        ctx.emailsSeen.add(lower);
      }
    }
  }

  // ── Email parent (optionnel) ────────────────────────────
  if (!isBlank(row.emailParent)) {
    if (!EMAIL_RE.test(row.emailParent)) {
      errors.emailParent = { severity: "blocker", message: "Email parent invalide" };
    } else {
      const lower = row.emailParent.toLowerCase();
      if (ctx.parentEmailsSeen.has(lower)) {
        errors.emailParent = {
          severity: "warning",
          message: "Email parent en double — fratrie probable",
        };
      } else {
        ctx.parentEmailsSeen.add(lower);
      }
    }
  }

  // ── Téléphone parent ────────────────────────────────────
  if (!isBlank(row.telephoneParent) && !PHONE_TN_RE.test(row.telephoneParent.trim())) {
    errors.telephoneParent = {
      severity: "warning",
      message: "Format téléphone tunisien attendu (8 chiffres, +216 optionnel)",
    };
  }

  // ── Matricule ───────────────────────────────────────────
  if (!isBlank(row.matricule)) {
    const mat = row.matricule.trim();
    if (ctx.matriculesSeen.has(mat)) {
      errors.matricule = {
        severity: "blocker",
        message: "Matricule en double dans ce fichier",
      };
    } else {
      ctx.matriculesSeen.add(mat);
    }
  }

  return errors;
}

/** True when at least one cell error has severity "blocker". */
export function hasBlockingErrors(errs: RowErrors): boolean {
  return Object.values(errs).some((e) => e?.severity === "blocker");
}

/** Convenience for UI counters. */
export function summarizeErrors(allErrors: RowErrors[]): {
  blocking: number;
  warning: number;
  clean: number;
} {
  let blocking = 0;
  let warning = 0;
  let clean = 0;
  for (const e of allErrors) {
    const cells = Object.values(e);
    if (cells.length === 0) {
      clean++;
    } else if (cells.some((c) => c?.severity === "blocker")) {
      blocking++;
    } else {
      warning++;
    }
  }
  return { blocking, warning, clean };
}
