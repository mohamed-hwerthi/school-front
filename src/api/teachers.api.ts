import api from "./axios";
import type { Teacher } from "@/types/teacher";

const BASE = "/teachers";

// ─── Backend DTO types ──────────────────────────────────────
interface TeacherBackend {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  specialization: string;
  sexe: string;
  telephone: string | null;
  dateNaissance: string | null;
  dateEmbauche: string | null;
  statut: string;
}

// ─── Mapping helpers ────────────────────────────────────────
function fromBackend(dto: TeacherBackend): Teacher {
  return {
    id: dto.id,
    prenom: dto.firstName,
    nom: dto.lastName,
    email: dto.email ?? "",
    specialite: dto.specialization,
    sexe: (dto.sexe as "M" | "F") ?? "M",
    telephone: dto.telephone ?? "",
    dateNaissance: dto.dateNaissance ?? "",
    dateEmbauche: dto.dateEmbauche ?? "",
    statut: (dto.statut as Teacher["statut"]) ?? "Actif",
  };
}

function toBackend(
  data: Omit<Teacher, "id" | "dateEmbauche">
): Record<string, unknown> {
  return {
    firstName: data.prenom,
    lastName: data.nom,
    email: data.email || null,
    specialization: data.specialite,
    sexe: data.sexe,
    telephone: data.telephone || null,
    dateNaissance: data.dateNaissance || null,
    statut: data.statut,
  };
}

function partialToBackend(data: Partial<Teacher>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (data.prenom !== undefined) out.firstName = data.prenom;
  if (data.nom !== undefined) out.lastName = data.nom;
  if (data.email !== undefined) out.email = data.email || null;
  if (data.specialite !== undefined) out.specialization = data.specialite;
  if (data.sexe !== undefined) out.sexe = data.sexe;
  if (data.telephone !== undefined) out.telephone = data.telephone || null;
  if (data.dateNaissance !== undefined) out.dateNaissance = data.dateNaissance || null;
  if (data.statut !== undefined) out.statut = data.statut;
  return out;
}

// ─── API ────────────────────────────────────────────────────
export const teachersApi = {
  getAll: () =>
    api.get<TeacherBackend[]>(BASE).then((res) => res.data.map(fromBackend)),

  getById: (id: string) =>
    api.get<TeacherBackend>(`${BASE}/${id}`).then((res) => fromBackend(res.data)),

  create: (data: Omit<Teacher, "id" | "dateEmbauche">) =>
    api.post<TeacherBackend>(BASE, toBackend(data)).then((res) => fromBackend(res.data)),

  update: (id: string, data: Partial<Teacher>) =>
    api.put<TeacherBackend>(`${BASE}/${id}`, partialToBackend(data)).then((res) => fromBackend(res.data)),

  delete: (id: string) => api.delete(`${BASE}/${id}`),

  importBulk: (teachers: Omit<Teacher, "id" | "dateEmbauche">[]) =>
    api
      .post<TeacherBackend[]>(`${BASE}/import`, teachers.map(toBackend))
      .then((res) => res.data.map(fromBackend)),
};
