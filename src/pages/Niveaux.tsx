import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, Plus, X, Users, Trash2, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNiveaux, useCreateNiveau, useDeleteNiveau, useAddClasse, useRemoveClasse } from "@/hooks/useNiveaux";
import { useAllStudents } from "@/hooks/useStudents";
import { NiveauxSkeleton } from "@/components/skeletons/NiveauxSkeleton";
import { notify } from "@/lib/toast";
import { useLanguage } from "@/hooks/useLanguage";
import type { Student } from "@/types/student";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35 },
  }),
};

function NiveauCard({ niveauId, nom, sections, students, index, onOpenClasse }: {
  niveauId: string;
  nom: string;
  sections: string[];
  students: Student[];
  index: number;
  onOpenClasse: (classe: string) => void;
}) {
  const [newSection, setNewSection] = useState("");
  const addClasse = useAddClasse();
  const removeClasse = useRemoveClasse();
  const deleteNiveau = useDeleteNiveau();
  const prefix = nom.match(/^(\d+)/)?.[1] || "";
  const studentCount = students.filter((s) => s.niveau === nom).length;
  const countByClasse = (classe: string) =>
    students.filter((s) => s.niveau === nom && s.classe === classe).length;

  const handleAdd = () => {
    const letter = newSection.toUpperCase().trim();
    if (!letter) return;
    if (letter.length !== 1 || !/^[A-Z]$/.test(letter)) {
      notify.warning("Veuillez entrer une seule lettre (A-Z)");
      return;
    }
    if (sections.includes(letter)) {
      notify.warning(`La section "${letter}" existe deja`);
      return;
    }
    addClasse.mutate(
      { niveauId, letter },
      {
        onSuccess: () => {
          setNewSection("");
          notify.success(`Section "${prefix}${letter}" ajoutée`);
        },
        onError: (err) => notify.error(err.message),
      }
    );
  };

  const handleRemove = (letter: string) => {
    removeClasse.mutate(
      { niveauId, letter },
      {
        onSuccess: () => notify.success(`Section "${prefix}${letter}" supprimée`),
        onError: (err) => notify.error(err.message),
      }
    );
  };

  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      className="rounded-xl border border-border/50 bg-card p-5 space-y-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <GraduationCap className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-semibold text-sm">{nom}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1 text-xs">
            <Users className="h-3 w-3" />
            {studentCount}
          </Badge>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                onClick={(e) => {
                  if (studentCount > 0) {
                    e.preventDefault();
                    notify.error("Impossible de supprimer un niveau qui contient des élèves");
                  }
                }}
                className="p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground"
                title="Supprimer ce niveau"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </AlertDialogTrigger>
            {studentCount === 0 && (
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer le niveau</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir supprimer le niveau « {nom} » et toutes ses sections ? Cette action est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => {
                      deleteNiveau.mutate(niveauId, {
                        onSuccess: () => notify.success(`Niveau "${nom}" supprimé`),
                        onError: (err) => notify.error(err.message),
                      });
                    }}
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            )}
          </AlertDialog>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 min-h-[32px]">
        {sections.length === 0 && (
          <span className="text-xs text-muted-foreground italic">Aucune section</span>
        )}
        {sections.map((letter) => {
          const classeNom = `${prefix}${letter}`;
          const count = countByClasse(classeNom);
          return (
            <Badge
              key={letter}
              variant="outline"
              className="gap-1 ps-1 pe-1 py-1 text-xs font-medium"
            >
              <button
                onClick={() => onOpenClasse(classeNom)}
                className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-primary/10 hover:text-primary transition-colors"
                title={`Voir les élèves de ${classeNom}`}
              >
                <span>{classeNom}</span>
                <span className="text-[10px] text-muted-foreground">({count})</span>
              </button>
              <button
                onClick={() => handleRemove(letter)}
                className="ms-0.5 rounded-full p-0.5 hover:bg-destructive/10 hover:text-destructive transition-colors"
                title="Supprimer la section"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          );
        })}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Nouvelle section (ex: D)"
          value={newSection}
          onChange={(e) => setNewSection(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="h-9 text-sm"
          maxLength={1}
        />
        <Button size="sm" className="h-9 px-3" onClick={handleAdd} disabled={addClasse.isPending}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}

export default function Niveaux() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { niveaux, isLoading } = useNiveaux();
  const createNiveau = useCreateNiveau();
  const { data: students = [] } = useAllStudents();
  const [newNiveauNom, setNewNiveauNom] = useState("");
  const [niveauError, setNiveauError] = useState<string | null>(null);
  const [openClasse, setOpenClasse] = useState<string | null>(null);

  if (isLoading) return <NiveauxSkeleton />;

  const studentsInOpenClasse = openClasse
    ? students
        .filter((s) => s.classe === openClasse)
        .sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`))
    : [];

  const handleAddNiveau = () => {
    const nom = newNiveauNom.trim();
    if (nom.length < 2) {
      setNiveauError("Le nom doit contenir au moins 2 caractères");
      return;
    }
    if (niveaux.some((n) => n.nom === nom)) {
      setNiveauError(`Le niveau "${nom}" existe déjà`);
      return;
    }
    setNiveauError(null);
    createNiveau.mutate(nom, {
      onSuccess: () => {
        setNewNiveauNom("");
        notify.success(`Niveau "${nom}" ajouté`);
      },
      onError: (err: Error & { response?: { data?: { message?: string } } }) => {
        setNiveauError(err.response?.data?.message ?? err.message);
      },
    });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Gestion des niveaux</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez les niveaux et leurs sections (classes A, B, C...)
          </p>
        </div>
      </div>

      {/* Add niveau */}
      <div className="max-w-md">
        <div className="flex gap-2">
          <Input
            placeholder="Nom du nouveau niveau (ex: 7ème année)"
            value={newNiveauNom}
            onChange={(e) => { setNewNiveauNom(e.target.value); if (niveauError) setNiveauError(null); }}
            onKeyDown={(e) => e.key === "Enter" && handleAddNiveau()}
            className={`h-9 text-sm ${niveauError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
            aria-invalid={!!niveauError}
          />
          <Button
            size="sm"
            className="h-9 gap-1.5 bg-gradient-primary shadow-btn"
            onClick={handleAddNiveau}
            disabled={createNiveau.isPending}
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </div>
        {niveauError && <p className="text-xs text-red-600 mt-1.5">{niveauError}</p>}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {niveaux.map((niveau, i) => (
          <NiveauCard
            key={niveau.id}
            niveauId={niveau.id}
            nom={niveau.nom}
            sections={niveau.sections}
            students={students}
            index={i}
            onOpenClasse={setOpenClasse}
          />
        ))}
      </div>

      <Dialog open={!!openClasse} onOpenChange={(o) => !o && setOpenClasse(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Élèves de la classe {openClasse}
            </DialogTitle>
            <DialogDescription>
              {studentsInOpenClasse.length} élève{studentsInOpenClasse.length > 1 ? "s" : ""} inscrit{studentsInOpenClasse.length > 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto">
            {studentsInOpenClasse.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Aucun élève dans cette classe
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {studentsInOpenClasse.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 py-2.5 px-1 hover:bg-muted/40 rounded transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold shrink-0 ${
                        s.sexe === "F" ? "bg-pink-100 text-pink-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {s.prenom?.[0]}{s.nom?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {s.nom} {s.prenom}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {s.matricule}
                          {s.statut && s.statut !== "Actif" && (
                            <span className="ms-2 text-amber-600">• {s.statut}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 gap-1.5 shrink-0"
                      onClick={() => {
                        setOpenClasse(null);
                        navigate(`/dashboard/eleves/${s.id}`);
                      }}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Profil
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
