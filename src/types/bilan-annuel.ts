/** End-of-year decision counts for one niveau. */
export interface NiveauBilan {
  niveau: string;
  total: number;
  nbPassage: number;
  nbRedoublement: number;
  nbExclusion: number;
  nbTransfert: number;
  tauxPassage: number;
}

/** Annual review: end-of-year decision counts and rates for a school year. */
export interface BilanAnnuel {
  anneeScolaire: string;
  totalDecisions: number;
  nbPassage: number;
  nbRedoublement: number;
  nbExclusion: number;
  nbTransfert: number;
  tauxPassage: number;
  tauxRedoublement: number;
  tauxExclusion: number;
  tauxTransfert: number;
  parNiveau: NiveauBilan[];
}
