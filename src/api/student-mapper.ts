import type { Student } from "@/types/student";

/**
 * Backend DTO shape (EN field names).
 */
export interface StudentApiDTO {
  id: string;
  firstName: string;
  lastName: string;
  firstNameAr: string | null;
  lastNameAr: string | null;
  sex: string;
  dateOfBirth: string | null;
  birthPlace: string | null;
  address: string | null;
  registrationNumber: string | null;
  email: string | null;
  classe: string | null;
  niveau: string | null;
  enrollmentDate: string | null;
  status: string;
  isBlocked: boolean;
  parentLastName: string | null;
  parentFirstName: string | null;
  parentPhone: string | null;
  parentEmail: string | null;
  notes: string | null;
}

/**
 * Backend → Frontend (EN → FR)
 */
export function fromApi(dto: StudentApiDTO): Student {
  return {
    id: dto.id,
    nom: dto.lastName,
    prenom: dto.firstName,
    nomAr: dto.lastNameAr ?? "",
    prenomAr: dto.firstNameAr ?? "",
    sexe: (dto.sex as "M" | "F") ?? "M",
    dateNaissance: dto.dateOfBirth ?? "",
    lieuNaissance: dto.birthPlace ?? "",
    adresse: dto.address ?? "",
    matricule: dto.registrationNumber ?? "",
    classe: dto.classe ?? "",
    niveau: dto.niveau ?? "",
    dateInscription: dto.enrollmentDate ?? "",
    statut: (dto.status as Student["statut"]) ?? "Actif",
    estBloque: dto.isBlocked ?? false,
    nomParent: dto.parentLastName ?? "",
    prenomParent: dto.parentFirstName ?? "",
    telephoneParent: dto.parentPhone ?? "",
    emailParent: dto.parentEmail ?? "",
    notes: dto.notes ?? undefined,
  };
}

/**
 * Frontend → Backend (FR → EN)
 */
export function toApi(
  student: Omit<Student, "id" | "dateInscription"> & { dateInscription?: string }
): Omit<StudentApiDTO, "id"> {
  return {
    firstName: student.prenom,
    lastName: student.nom,
    firstNameAr: student.prenomAr || null,
    lastNameAr: student.nomAr || null,
    sex: student.sexe,
    dateOfBirth: student.dateNaissance || null,
    birthPlace: student.lieuNaissance || null,
    address: student.adresse || null,
    registrationNumber: student.matricule || null,
    email: null,
    classe: student.classe || null,
    niveau: student.niveau || null,
    enrollmentDate: student.dateInscription || null,
    status: student.statut,
    isBlocked: student.estBloque,
    parentLastName: student.nomParent || null,
    parentFirstName: student.prenomParent || null,
    parentPhone: student.telephoneParent || null,
    parentEmail: student.emailParent || null,
    notes: student.notes || null,
  };
}
