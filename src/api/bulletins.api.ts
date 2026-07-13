import api from "./axios";

export interface BulletinExamenDTO {
  examenId: string;
  examenName: string;
  coeff: number;
  note: number | null;
}

export interface BulletinModuleDTO {
  moduleId: string;
  moduleName: string;
  moduleNameAr: string | null;
  sousDomaineId: string | null;
  sousDomaineName: string | null;
  sousDomaineNameAr: string | null;
  sousDomaineOrdre: number | null;
  coeff: number;
  ordre: number;
  examens: BulletinExamenDTO[];
  moyenneModule: number;
  moduleMin: number;
  moduleMax: number;
  moduleClasseAvg: number;
}

export interface BulletinDomaineDTO {
  domaineId: string;
  domaineName: string;
  domaineNameAr: string | null;
  ordre: number;
  coeff: number;
  modules: BulletinModuleDTO[];
  moyenneDomaine: number;
  recommandation: string | null;
}

export interface BulletinDTO {
  studentId: string;
  matricule: string | null;
  studentName: string;
  studentNameAr: string | null;
  classe: string;
  niveau: string;
  trimestre: number;
  version: string;
  domaines: BulletinDomaineDTO[];
  modulesHorsDomaine: BulletinModuleDTO[];
  moyenneGenerale: number;
  moyenneClasse: number;
  moyenneMin: number;
  moyenneMax: number;
  rang: number;
  totalEleves: number;
  certificatType: string | null;
  comportement: string | null;
}

// BUL-003: Template
export interface BulletinTemplateDTO {
  id?: string;
  nom: string;
  logoUrl?: string | null;
  nomEcoleFr?: string | null;
  nomEcoleAr?: string | null;
  adresse?: string | null;
  telephone?: string | null;
  email?: string | null;
  headerColor?: string | null;
  showLogo?: boolean;
  showPhotoEleve?: boolean;
  showAppreciation?: boolean;
  showRang?: boolean;
  footerText?: string | null;
  actif?: boolean;
}

// BUL-005: Stats
export interface ModuleStatsDTO {
  moduleId: string;
  moduleName: string;
  moyenne: number;
  min: number;
  max: number;
  reussis: number;
  echoues: number;
}

export interface DistributionDTO {
  range: string;
  count: number;
}

export interface StatsReussiteDTO {
  classe: string;
  trimestre: number;
  totalEleves: number;
  reussis: number;
  echoues: number;
  tauxReussite: number;
  moyenneClasse: number;
  moyenneMin: number;
  moyenneMax: number;
  modulesStats: ModuleStatsDTO[];
  distribution: DistributionDTO[];
}

// BUL-006: Attestation
export interface AttestationDTO {
  studentId: string;
  studentName: string;
  studentNameAr: string | null;
  dateOfBirth: string | null;
  birthPlace: string | null;
  registrationNumber: string | null;
  classe: string;
  niveau: string;
  anneeScolaire: string;
  schoolName: string;
  schoolNameAr: string | null;
  adresse: string | null;
  telephone: string | null;
  directeurName: string | null;
  directeurNameAr: string | null;
  dateGeneration: string;
}

// BUL-007: Comparatif
export interface ModuleAvgDTO {
  moduleId: string;
  moduleName: string;
  moyenne: number;
}

export interface ClassePerformanceDTO {
  classeId: string;
  classeName: string;
  moyenneGenerale: number;
  tauxReussite: number;
  totalEleves: number;
  reussis: number;
  modulesAvg: ModuleAvgDTO[];
}

export interface EvolutionTrimestreDTO {
  trimestre: number;
  moyenneGenerale: number;
  tauxReussite: number;
  totalEleves: number;
  reussis: number;
}

export interface ComparatifDTO {
  classesPerformance?: ClassePerformanceDTO[];
  evolution?: EvolutionTrimestreDTO[];
}

// ANN-040: Bulletin annuel
export interface ModuleAnnuelDTO {
  moduleId: string;
  moduleName: string;
  moyenneT1: number | null;
  moyenneT2: number | null;
  moyenneT3: number | null;
  moyenneAnnuelle: number | null;
}

export interface BulletinAnnuelDTO {
  studentId: string;
  studentName: string;
  studentNameAr: string | null;
  classe: string;
  niveau: string;
  version: string;
  moyenneT1: number | null;
  moyenneT2: number | null;
  moyenneT3: number | null;
  moyenneAnnuelle: number | null;
  rang: number | null;
  totalEleves: number;
  mention: string | null;
  modules: ModuleAnnuelDTO[];
}

// ANN-025: stats de réussite par matière
export interface MatiereStatDTO {
  moduleId: string;
  moduleName: string;
  moyenne: number;
  reussis: number;
  echoues: number;
  taux: number;
}

const BASE = "/bulletins";

export const bulletinsApi = {
  // Existing
  getAll: async (
    classeId: string,
    trimestre: number,
    version: string = "etatique"
  ): Promise<BulletinDTO[]> => {
    const res = await api.get<BulletinDTO[]>(
      `${BASE}?classeId=${classeId}&trimestre=${trimestre}&version=${version}`
    );
    return res.data;
  },

  getOne: async (
    classeId: string,
    studentId: string,
    trimestre: number,
    version: string = "etatique"
  ): Promise<BulletinDTO> => {
    const res = await api.get<BulletinDTO>(
      `${BASE}/student/${studentId}?classeId=${classeId}&trimestre=${trimestre}&version=${version}`
    );
    return res.data;
  },

  // ANN-040: Bulletin annuel (synthèse des 3 trimestres)
  getAnnuels: async (
    classeId: string,
    version: string = "etatique"
  ): Promise<BulletinAnnuelDTO[]> => {
    const res = await api.get<BulletinAnnuelDTO[]>(
      `${BASE}/annuel?classeId=${classeId}&version=${version}`
    );
    return res.data;
  },

  // ANN-025: taux de réussite par matière (annuel)
  getStatsMatieres: async (
    classeId: string,
    version: string = "etatique"
  ): Promise<MatiereStatDTO[]> => {
    const res = await api.get<MatiereStatDTO[]>(
      `${BASE}/stats-matieres?classeId=${classeId}&version=${version}`
    );
    return res.data;
  },

  // BUL-003: Templates
  getTemplates: async (): Promise<BulletinTemplateDTO[]> => {
    const res = await api.get<BulletinTemplateDTO[]>(`${BASE}/templates`);
    return res.data;
  },

  getTemplate: async (id: string): Promise<BulletinTemplateDTO> => {
    const res = await api.get<BulletinTemplateDTO>(`${BASE}/templates/${id}`);
    return res.data;
  },

  getActiveTemplate: async (): Promise<BulletinTemplateDTO | null> => {
    const res = await api.get<BulletinTemplateDTO | null>(
      `${BASE}/templates/active`
    );
    return res.data;
  },

  createTemplate: async (
    dto: BulletinTemplateDTO
  ): Promise<BulletinTemplateDTO> => {
    const res = await api.post<BulletinTemplateDTO>(`${BASE}/templates`, dto);
    return res.data;
  },

  updateTemplate: async (
    id: string,
    dto: BulletinTemplateDTO
  ): Promise<BulletinTemplateDTO> => {
    const res = await api.put<BulletinTemplateDTO>(
      `${BASE}/templates/${id}`,
      dto
    );
    return res.data;
  },

  activateTemplate: async (id: string): Promise<BulletinTemplateDTO> => {
    const res = await api.put<BulletinTemplateDTO>(
      `${BASE}/templates/${id}/activate`
    );
    return res.data;
  },

  deleteTemplate: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/templates/${id}`);
  },

  // BUL-004: Mass generate
  massGenerate: async (
    classeId: string,
    trimestreId: string
  ): Promise<BulletinDTO[]> => {
    const res = await api.get<BulletinDTO[]>(
      `${BASE}/classe/${classeId}/trimestre/${trimestreId}/mass-generate`
    );
    return res.data;
  },

  // BUL-005: Stats
  getStatsReussite: async (
    classeId: string,
    trimestreId: string
  ): Promise<StatsReussiteDTO> => {
    const res = await api.get<StatsReussiteDTO>(
      `${BASE}/stats/classe/${classeId}/trimestre/${trimestreId}`
    );
    return res.data;
  },

  // BUL-006: Attestation
  getAttestation: async (eleveId: string): Promise<AttestationDTO> => {
    const res = await api.get<AttestationDTO>(
      `${BASE}/attestation/${eleveId}`
    );
    return res.data;
  },

  // BUL-007: Comparatif
  getComparatifByNiveau: async (niveauId: string): Promise<ComparatifDTO> => {
    const res = await api.get<ComparatifDTO>(
      `${BASE}/comparatif?niveauId=${niveauId}`
    );
    return res.data;
  },

  getComparatifEvolution: async (classeId: string): Promise<ComparatifDTO> => {
    const res = await api.get<ComparatifDTO>(
      `${BASE}/comparatif/evolution?classeId=${classeId}`
    );
    return res.data;
  },
};
