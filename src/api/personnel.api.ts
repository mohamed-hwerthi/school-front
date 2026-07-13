import api from "./axios";
import type { Personnel } from "@/types/personnel";

const BASE = "/personnel";

// ─── Backend DTO types ──────────────────────────────────────
interface PersonnelBackend {
  id: string;
  firstName: string;
  lastName: string;
  fonction: string;
  email: string | null;
  sexe: string | null;
  telephone: string | null;
  dateNaissance: string | null;
  dateEmbauche: string | null;
  statut: string;
}

// ─── Mapping helpers ────────────────────────────────────────
function fromBackend(dto: PersonnelBackend): Personnel {
  return {
    id: dto.id,
    prenom: dto.firstName,
    nom: dto.lastName,
    fonction: dto.fonction,
    email: dto.email ?? "",
    sexe: (dto.sexe as "M" | "F") ?? "M",
    telephone: dto.telephone ?? "",
    dateNaissance: dto.dateNaissance ?? "",
    dateEmbauche: dto.dateEmbauche ?? "",
    statut: (dto.statut as Personnel["statut"]) ?? "Actif",
  };
}

function toBackend(
  data: Omit<Personnel, "id" | "dateEmbauche">
): Record<string, unknown> {
  return {
    firstName: data.prenom,
    lastName: data.nom,
    fonction: data.fonction,
    email: data.email || null,
    sexe: data.sexe,
    telephone: data.telephone || null,
    dateNaissance: data.dateNaissance || null,
    statut: data.statut,
  };
}

function partialToBackend(data: Partial<Personnel>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (data.prenom !== undefined) out.firstName = data.prenom;
  if (data.nom !== undefined) out.lastName = data.nom;
  if (data.fonction !== undefined) out.fonction = data.fonction;
  if (data.email !== undefined) out.email = data.email || null;
  if (data.sexe !== undefined) out.sexe = data.sexe;
  if (data.telephone !== undefined) out.telephone = data.telephone || null;
  if (data.dateNaissance !== undefined) out.dateNaissance = data.dateNaissance || null;
  if (data.statut !== undefined) out.statut = data.statut;
  return out;
}

// ─── API ────────────────────────────────────────────────────
// NB: the axios response interceptor already unwraps the ApiResponse<T>
// envelope, so `res.data` is the payload itself (same pattern as teachers.api).
export const personnelApi = {
  getAll: () =>
    api.get<PersonnelBackend[]>(BASE).then((res) => res.data.map(fromBackend)),

  getById: (id: string) =>
    api.get<PersonnelBackend>(`${BASE}/${id}`).then((res) => fromBackend(res.data)),

  create: (data: Omit<Personnel, "id" | "dateEmbauche">) =>
    api.post<PersonnelBackend>(BASE, toBackend(data)).then((res) => fromBackend(res.data)),

  update: (id: string, data: Partial<Personnel>) =>
    api.put<PersonnelBackend>(`${BASE}/${id}`, partialToBackend(data)).then((res) => fromBackend(res.data)),

  delete: (id: string) => api.delete(`${BASE}/${id}`),
};
