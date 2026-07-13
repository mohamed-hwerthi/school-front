import type { Room } from "@/types/room";

/**
 * Backend DTO shape (EN field names).
 */
export interface ClassroomApiDTO {
  id: string;
  name: string;
  capacity: number | null;
  location: string | null;
  type: string | null;
  floor: number | null;
  equipment: string | null;
  status: string | null;
}

/**
 * Backend → Frontend (EN → FR)
 */
export function fromApi(dto: ClassroomApiDTO): Room {
  return {
    id: dto.id,
    nom: dto.name,
    type: (dto.type as Room["type"]) ?? "Salle de classe",
    capacite: dto.capacity ?? 0,
    etage: dto.floor ?? 0,
    equipements: dto.equipment
      ? dto.equipment.split(",").map((e) => e.trim()).filter(Boolean)
      : [],
    statut: (dto.status as Room["statut"]) ?? "Disponible",
  };
}

/**
 * Frontend → Backend (FR → EN)
 */
export function toApi(
  room: Omit<Room, "id">
): Omit<ClassroomApiDTO, "id"> {
  return {
    name: room.nom,
    capacity: room.capacite,
    location: null,
    type: room.type,
    floor: room.etage,
    equipment: room.equipements.join(", "),
    status: room.statut,
  };
}
