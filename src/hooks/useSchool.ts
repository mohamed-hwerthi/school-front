import { createContext, useContext, type ReactNode } from "react";
import React from "react";
import { useSchoolSettings, useUpdateSchoolSettings } from "./useSchoolSettings";
import type { SchoolInfo } from "@/types/school";
import type { SchoolSettingsDTO } from "@/api/settings.api";

interface SchoolContextValue {
  school: SchoolInfo;
  updateSchool: (data: Partial<SchoolInfo>) => Promise<void>;
  isLoading: boolean;
  isSaving: boolean;
}

const SchoolContext = createContext<SchoolContextValue | null>(null);

function toSchoolInfo(dto: SchoolSettingsDTO): SchoolInfo {
  return {
    nom: dto.schoolName ?? "",
    nomAr: dto.schoolNameAr ?? "",
    logo: dto.logo ?? "",
    adresse: dto.adresse ?? "",
    ville: dto.ville ?? "",
    villeAr: dto.villeAr ?? "",
    telephone: dto.telephone ?? "",
    email: dto.email ?? "",
    siteWeb: dto.siteWeb ?? "",
    directeur: dto.directeurName ?? "",
    anneeCreation: dto.anneeCreation ?? "",
    description: dto.description ?? "",
  };
}

function toDTO(data: Partial<SchoolInfo>, current: SchoolSettingsDTO): SchoolSettingsDTO {
  return {
    ...current,
    schoolName: data.nom ?? current.schoolName,
    schoolNameAr: data.nomAr ?? current.schoolNameAr,
    logo: data.logo ?? current.logo,
    adresse: data.adresse ?? current.adresse,
    ville: data.ville ?? current.ville,
    villeAr: data.villeAr ?? current.villeAr,
    telephone: data.telephone ?? current.telephone,
    email: data.email ?? current.email,
    siteWeb: data.siteWeb ?? current.siteWeb,
    directeurName: data.directeur ?? current.directeurName,
    anneeCreation: data.anneeCreation ?? current.anneeCreation,
    description: data.description ?? current.description,
  };
}

const DEFAULT_DTO: SchoolSettingsDTO = {
  schoolName: "",
  schoolNameAr: null,
  anneeScolaire: "",
  adresse: null,
  telephone: null,
  directeurName: null,
  directeurNameAr: null,
  logo: null,
  ville: null,
  villeAr: null,
  email: null,
  siteWeb: null,
  anneeCreation: null,
  description: null,
};

export function SchoolProvider({ children }: { children: ReactNode }) {
  const { data: settings, isLoading } = useSchoolSettings();
  const mutation = useUpdateSchoolSettings();

  const currentDTO = settings ?? DEFAULT_DTO;
  const school = toSchoolInfo(currentDTO);

  const updateSchool = async (data: Partial<SchoolInfo>) => {
    const dto = toDTO(data, currentDTO);
    await mutation.mutateAsync(dto);
  };

  const value: SchoolContextValue = {
    school,
    updateSchool,
    isLoading,
    isSaving: mutation.isPending,
  };

  return React.createElement(SchoolContext.Provider, { value }, children);
}

export function useSchool() {
  const ctx = useContext(SchoolContext);
  if (!ctx) {
    throw new Error("useSchool must be used within a SchoolProvider");
  }
  return ctx;
}
