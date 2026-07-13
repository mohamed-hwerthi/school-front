import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Loader2,
  CheckCircle2,
  User,
  Users,
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  Copy,
  Search,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { VitrineConfig } from "@/types/vitrine";
import axios from "axios";
import env from "@/config/env";
import { notify } from "@/lib/toast";

interface Props {
  config: VitrineConfig;
}

interface InscriptionResult {
  numeroDossier: string;
  nom: string;
  prenom: string;
  anneeScolaire: string;
  statut: string;
  commentaire?: string;
}

const STEPS = [
  { label: "Eleve", icon: User },
  { label: "Parent", icon: Users },
  { label: "Niveau", icon: GraduationCap },
  { label: "Confirmation", icon: CheckCircle2 },
];

function getDefaultAnneeScolaire(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

export default function VitrinePreInscription({ config }: Props) {
  const { slug } = useParams<{ slug: string }>();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<InscriptionResult | null>(null);
  const [checkMode, setCheckMode] = useState(false);
  const [checkDossier, setCheckDossier] = useState("");
  const [checkResult, setCheckResult] = useState<InscriptionResult | null>(null);
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    dateNaissance: "",
    lieuNaissance: "",
    sexe: "",
    nomParent: "",
    prenomParent: "",
    telephoneParent: "",
    emailParent: "",
    niveauId: "",
    anneeScolaire: getDefaultAnneeScolaire(),
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const canGoNext = () => {
    if (currentStep === 0) return form.nom && form.prenom && form.dateNaissance;
    if (currentStep === 1) return true; // parent info is optional
    if (currentStep === 2) return form.anneeScolaire;
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        nom: form.nom,
        prenom: form.prenom,
        dateNaissance: form.dateNaissance,
        lieuNaissance: form.lieuNaissance || undefined,
        sexe: form.sexe || undefined,
        nomParent: form.nomParent || undefined,
        prenomParent: form.prenomParent || undefined,
        telephoneParent: form.telephoneParent || undefined,
        emailParent: form.emailParent || undefined,
        niveauId: form.niveauId ? form.niveauId : undefined,
        anneeScolaire: form.anneeScolaire,
      };
      const res = await axios.post(
        `${env.API_URL}/public/inscriptions`,
        payload,
        { headers: { "X-Tenant-ID": slug } }
      );
      const data = res.data?.data ?? res.data;
      setSubmitted(data);
      notify.success("Inscription soumise avec succes !");
    } catch {
      notify.error("Erreur lors de la soumission. Veuillez reessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!checkDossier.trim()) return;
    setCheckLoading(true);
    setCheckError(null);
    setCheckResult(null);
    try {
      const res = await axios.get(
        `${env.API_URL}/public/inscriptions/numero/${checkDossier.trim()}`,
        { headers: { "X-Tenant-ID": slug } }
      );
      setCheckResult(res.data?.data ?? res.data);
    } catch {
      setCheckError("Aucune inscription trouvee avec ce numero de dossier.");
    } finally {
      setCheckLoading(false);
    }
  };

  const handleCopy = () => {
    if (submitted?.numeroDossier) {
      navigator.clipboard.writeText(submitted.numeroDossier);
      notify.success("Numero copie !");
    }
  };

  const statusLabel = (statut: string) => {
    const map: Record<string, { label: string; color: string }> = {
      SOUMISE: { label: "Soumise", color: "bg-blue-100 text-blue-700" },
      EN_REVISION: { label: "En revision", color: "bg-orange-100 text-orange-700" },
      ACCEPTEE: { label: "Acceptee", color: "bg-emerald-100 text-emerald-700" },
      REFUSEE: { label: "Refusee", color: "bg-red-100 text-red-700" },
      EN_ATTENTE: { label: "En attente", color: "bg-yellow-100 text-yellow-700" },
      LISTE_ATTENTE: { label: "Liste d'attente", color: "bg-gray-100 text-gray-700" },
    };
    return map[statut] ?? { label: statut, color: "bg-gray-100 text-gray-700" };
  };

  // ── Success State ──
  if (submitted) {
    return (
      <section className="py-16" style={{ backgroundColor: config.primaryColor + "05" }}>
        <div className="mx-auto max-w-lg px-4">
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Inscription soumise !</h2>
              <p className="text-gray-600 mb-6">
                Votre demande a ete enregistree. Conservez votre numero de dossier pour suivre l'etat.
              </p>

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Numero de dossier</span>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="font-mono text-xl font-bold">{submitted.numeroDossier}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="text-left space-y-2 bg-gray-50 rounded-lg p-4 mb-6 text-sm">
                <p><span className="text-gray-500">Eleve :</span> <span className="font-medium">{submitted.prenom} {submitted.nom}</span></p>
                <p><span className="text-gray-500">Annee :</span> <span className="font-medium">{submitted.anneeScolaire}</span></p>
                <p><span className="text-gray-500">Statut :</span> <span className="font-medium text-blue-600">Soumise</span></p>
              </div>

              <Button
                onClick={() => {
                  setSubmitted(null);
                  setForm({ nom: "", prenom: "", dateNaissance: "", lieuNaissance: "", sexe: "", nomParent: "", prenomParent: "", telephoneParent: "", emailParent: "", niveauId: "", anneeScolaire: getDefaultAnneeScolaire() });
                  setCurrentStep(0);
                }}
                className="w-full"
                style={{ backgroundColor: config.primaryColor }}
              >
                Nouvelle inscription
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16" style={{ backgroundColor: config.primaryColor + "05" }}>
      <div className="mx-auto max-w-2xl px-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Inscription en ligne</CardTitle>
            <p className="text-sm text-muted-foreground">
              Remplissez le formulaire pour inscrire votre enfant
            </p>
            <div className="mt-2">
              <Button variant="link" className="text-sm" onClick={() => setCheckMode(!checkMode)}>
                <Search className="h-3.5 w-3.5 mr-1" />
                {checkMode ? "Revenir au formulaire" : "Verifier l'etat de mon inscription"}
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {/* Check Status Mode */}
            {checkMode ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Suivi de votre inscription</p>
                    <p className="text-xs text-muted-foreground">Entrez votre numero de dossier</p>
                  </div>
                </div>

                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Ex: INS-2026-A1B2C3D4"
                    value={checkDossier}
                    onChange={(e) => setCheckDossier(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleCheckStatus} disabled={!checkDossier.trim() || checkLoading}>
                    {checkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Rechercher"}
                  </Button>
                </div>

                {checkResult && (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-gray-500">{checkResult.numeroDossier}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusLabel(checkResult.statut).color}`}>
                        {statusLabel(checkResult.statut).label}
                      </span>
                    </div>
                    <p><span className="text-gray-500">Eleve :</span> <span className="font-medium">{checkResult.prenom} {checkResult.nom}</span></p>
                    <p><span className="text-gray-500">Annee :</span> <span className="font-medium">{checkResult.anneeScolaire}</span></p>
                    {checkResult.commentaire && (
                      <p><span className="text-gray-500">Commentaire :</span> <span className="font-medium">{checkResult.commentaire}</span></p>
                    )}
                  </div>
                )}

                {checkError && <p className="text-sm text-center text-red-500">{checkError}</p>}
              </div>
            ) : (
              <>
                {/* Progress Steps */}
                <div className="flex items-center justify-between mb-8">
                  {STEPS.map((step, index) => (
                    <div key={step.label} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
                            index < currentStep
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : index === currentStep
                                ? "border-current bg-white"
                                : "border-gray-300 text-gray-300"
                          }`}
                          style={index === currentStep ? { borderColor: config.primaryColor, color: config.primaryColor } : undefined}
                        >
                          {index < currentStep ? <CheckCircle2 className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
                        </div>
                        <span className={`text-[10px] mt-1 ${index <= currentStep ? "font-medium text-gray-900" : "text-gray-400"}`}>
                          {step.label}
                        </span>
                      </div>
                      {index < STEPS.length - 1 && (
                        <div className={`h-0.5 w-8 sm:w-14 mx-1 ${index < currentStep ? "bg-emerald-500" : "bg-gray-200"}`} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Step 1: Eleve */}
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label>Nom <span className="text-red-500">*</span></Label>
                        <Input required value={form.nom} onChange={(e) => set("nom", e.target.value)} />
                      </div>
                      <div>
                        <Label>Prenom <span className="text-red-500">*</span></Label>
                        <Input required value={form.prenom} onChange={(e) => set("prenom", e.target.value)} />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label>Date de naissance <span className="text-red-500">*</span></Label>
                        <Input type="date" value={form.dateNaissance} onChange={(e) => set("dateNaissance", e.target.value)} />
                      </div>
                      <div>
                        <Label>Lieu de naissance</Label>
                        <Input value={form.lieuNaissance} onChange={(e) => set("lieuNaissance", e.target.value)} placeholder="Ville" />
                      </div>
                    </div>
                    <div>
                      <Label>Sexe</Label>
                      <Select value={form.sexe} onValueChange={(v) => set("sexe", v)}>
                        <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Masculin</SelectItem>
                          <SelectItem value="F">Feminin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end pt-4">
                      <Button onClick={() => canGoNext() && setCurrentStep(1)} disabled={!canGoNext()} style={{ backgroundColor: config.primaryColor }}>
                        Suivant <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 2: Parent */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-muted-foreground">Informations du parent / tuteur</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label>Prenom du parent</Label>
                        <Input value={form.prenomParent} onChange={(e) => set("prenomParent", e.target.value)} />
                      </div>
                      <div>
                        <Label>Nom du parent</Label>
                        <Input value={form.nomParent} onChange={(e) => set("nomParent", e.target.value)} />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label>Telephone</Label>
                        <Input type="tel" value={form.telephoneParent} onChange={(e) => set("telephoneParent", e.target.value)} />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input type="email" value={form.emailParent} onChange={(e) => set("emailParent", e.target.value)} />
                      </div>
                    </div>
                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={() => setCurrentStep(0)}>
                        <ChevronLeft className="h-4 w-4 mr-1" /> Precedent
                      </Button>
                      <Button onClick={() => setCurrentStep(2)} style={{ backgroundColor: config.primaryColor }}>
                        Suivant <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Niveau */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <Label>Annee scolaire <span className="text-red-500">*</span></Label>
                      <Input value={form.anneeScolaire} onChange={(e) => set("anneeScolaire", e.target.value)} placeholder="Ex: 2025-2026" />
                    </div>
                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={() => setCurrentStep(1)}>
                        <ChevronLeft className="h-4 w-4 mr-1" /> Precedent
                      </Button>
                      <Button onClick={() => canGoNext() && setCurrentStep(3)} disabled={!canGoNext()} style={{ backgroundColor: config.primaryColor }}>
                        Suivant <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 4: Confirmation */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                      <p className="font-medium text-gray-900 mb-2">Recapitulatif</p>
                      <p><span className="text-gray-500">Eleve :</span> {form.prenom} {form.nom}</p>
                      <p><span className="text-gray-500">Date de naissance :</span> {form.dateNaissance ? new Date(form.dateNaissance).toLocaleDateString("fr-FR") : "-"}</p>
                      {form.lieuNaissance && <p><span className="text-gray-500">Lieu :</span> {form.lieuNaissance}</p>}
                      {form.sexe && <p><span className="text-gray-500">Sexe :</span> {form.sexe === "M" ? "Masculin" : "Feminin"}</p>}
                      {(form.prenomParent || form.nomParent) && (
                        <p><span className="text-gray-500">Parent :</span> {form.prenomParent} {form.nomParent}</p>
                      )}
                      {form.telephoneParent && <p><span className="text-gray-500">Tel :</span> {form.telephoneParent}</p>}
                      {form.emailParent && <p><span className="text-gray-500">Email :</span> {form.emailParent}</p>}
                      <p><span className="text-gray-500">Annee :</span> {form.anneeScolaire}</p>
                    </div>
                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={() => setCurrentStep(2)}>
                        <ChevronLeft className="h-4 w-4 mr-1" /> Precedent
                      </Button>
                      <Button onClick={handleSubmit} disabled={loading} style={{ backgroundColor: config.primaryColor }}>
                        {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Envoi...</> : <>Soumettre <CheckCircle2 className="h-4 w-4 ml-1" /></>}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
