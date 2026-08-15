export type SchoolInfo = {
  nom: string;
  nomAr: string;
  logo: string;
  adresse: string;
  /** Adresse en arabe — imprimee sur l'attestation de presence arabe. */
  adresseAr: string;
  telephone: string;
  email: string;
  siteWeb: string;
  directeur: string;
  /** Nom du directeur en arabe — imprimé au pied des attestations. */
  directeurAr: string;
  /** Délégation régionale de l'éducation — imprimée en en-tête des bulletins. */
  delegationRegionale: string;
  delegationRegionaleAr: string;
  anneeCreation: string;
  description: string;
};
