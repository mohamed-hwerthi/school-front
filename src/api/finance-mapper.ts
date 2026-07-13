import type { TypeFrais, Paiement, StatutPaiement, ModePaiement } from "@/types/finance";
import type { TypeFraisDTO, PaiementDTO, PaiementRequest } from "./finance.api";

// ─── Statut mapping (backend enum ↔ frontend label) ─────

const STATUT_TO_LABEL: Record<string, StatutPaiement> = {
  PAYE: "Payé",
  PARTIEL: "Partiel",
  EN_ATTENTE: "En attente",
  EN_RETARD: "En retard",
};

const STATUT_TO_ENUM: Record<string, string> = {
  "Payé": "PAYE",
  "Partiel": "PARTIEL",
  "En attente": "EN_ATTENTE",
  "En retard": "EN_RETARD",
};

// ─── Mode paiement mapping ──────────────────────────────

const MODE_TO_LABEL: Record<string, ModePaiement> = {
  ESPECES: "Espèces",
  VIREMENT: "Virement",
  CHEQUE: "Chèque",
  CARTE_BANCAIRE: "Carte bancaire",
  PRELEVEMENT: "Prélèvement",
};

const MODE_TO_ENUM: Record<string, string> = {
  "Espèces": "ESPECES",
  "Virement": "VIREMENT",
  "Chèque": "CHEQUE",
  "Carte bancaire": "CARTE_BANCAIRE",
  "Prélèvement": "PRELEVEMENT",
};

// ─── TypeFrais ──────────────────────────────────────────

export function typeFraisFromApi(dto: TypeFraisDTO): TypeFrais {
  return {
    id: dto.id,
    nom: dto.nom,
    montantMensuel: dto.montant,
    description: dto.description ?? "",
    actif: dto.actif,
  };
}

// ─── Paiement ───────────────────────────────────────────

export function paiementFromApi(dto: PaiementDTO): Paiement {
  return {
    id: dto.id,
    eleveId: dto.studentId,
    typeFraisId: dto.typeFraisId,
    mois: dto.mois,
    montantDu: dto.montantDu,
    montantPaye: dto.montantPaye,
    datePaiement: dto.datePaiement,
    modePaiement: dto.modePaiement ? (MODE_TO_LABEL[dto.modePaiement] ?? null) : null,
    statut: STATUT_TO_LABEL[dto.statut] ?? "En attente",
    reference: dto.reference ?? "",
    notes: dto.notes ?? "",
  };
}

export function paiementToApi(
  data: {
    eleveId: string;
    typeFraisId: string;
    mois: string;
    montantDu: number;
    montantPaye: number;
    datePaiement?: string | null;
    modePaiement?: string | null;
    statut?: string;
    reference?: string;
    notes?: string;
  },
  anneeScolaire: string
): PaiementRequest {
  return {
    studentId: data.eleveId,
    typeFraisId: data.typeFraisId,
    mois: data.mois,
    anneeScolaire,
    montantDu: data.montantDu,
    montantPaye: data.montantPaye,
    datePaiement: data.datePaiement || null,
    modePaiement: data.modePaiement
      ? (MODE_TO_ENUM[data.modePaiement] as PaiementRequest["modePaiement"])
      : null,
    statut: data.statut
      ? (STATUT_TO_ENUM[data.statut] as PaiementRequest["statut"])
      : undefined,
    reference: data.reference || undefined,
    notes: data.notes || undefined,
  };
}
