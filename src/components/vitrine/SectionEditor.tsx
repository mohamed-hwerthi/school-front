import { useState } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical, Plus, Trash2, Edit2, Eye, EyeOff, Loader2,
  Type, Image, BarChart3, MousePointerClick, MessageSquare, MapPin, Layout, Mail,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import RichTextEditor from "./RichTextEditor";
import {
  useVitrineSections,
  useCreateVitrineSection,
  useUpdateVitrineSection,
  useDeleteVitrineSection,
} from "@/hooks/useVitrineAdmin";
import type { VitrineSection } from "@/types/vitrine";

const SECTION_TYPES = [
  { value: "hero", label: "Banniere Hero", icon: Layout },
  { value: "text", label: "Bloc Texte", icon: Type },
  { value: "gallery", label: "Galerie", icon: Image },
  { value: "stats", label: "Statistiques", icon: BarChart3 },
  { value: "cta", label: "Appel a l'action", icon: MousePointerClick },
  { value: "announcements", label: "Annonces", icon: MessageSquare },
  { value: "map", label: "Carte / Contact", icon: MapPin },
  { value: "contact", label: "Formulaire de contact", icon: Mail },
] as const;

interface Props {
  pageId: string;
  pageTitle: string;
  onBack: () => void;
}

export default function SectionEditor({ pageId, pageTitle, onBack }: Props) {
  const { data: sections = [], isLoading } = useVitrineSections(pageId);
  const createSection = useCreateVitrineSection();
  const updateSection = useUpdateVitrineSection();
  const deleteSection = useDeleteVitrineSection();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editSection, setEditSection] = useState<VitrineSection | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const section = sections[oldIndex];
    updateSection.mutate({ id: section.id, dto: { ...section, displayOrder: newIndex } });
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>&larr; Retour</Button>
          <h3 className="text-lg font-semibold">Sections : {pageTitle}</h3>
          <Badge variant="secondary">{sections.length} sections</Badge>
        </div>
        <Button size="sm" onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Ajouter
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {sections.map((section) => (
              <SortableSectionCard
                key={section.id}
                section={section}
                onEdit={() => setEditSection(section)}
                onToggleVisibility={() =>
                  updateSection.mutate({ id: section.id, dto: { ...section, visible: !section.visible } })
                }
                onDelete={() => {
                  if (confirm("Supprimer cette section ?")) deleteSection.mutate(section.id);
                }}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {sections.length === 0 && (
        <p className="py-12 text-center text-muted-foreground">
          Aucune section. Cliquez sur "Ajouter" pour commencer.
        </p>
      )}

      {/* Add Dialog */}
      <AddSectionDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        pageId={pageId}
        nextOrder={sections.length}
      />

      {/* Edit Dialog */}
      {editSection && (
        <EditSectionDialog
          section={editSection}
          onClose={() => setEditSection(null)}
        />
      )}
    </div>
  );
}

// ======================== SORTABLE CARD ========================

function SortableSectionCard({
  section,
  onEdit,
  onToggleVisibility,
  onDelete,
}: {
  section: VitrineSection;
  onEdit: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const typeInfo = SECTION_TYPES.find((t) => t.value === section.sectionType);
  const Icon = typeInfo?.icon || Type;

  return (
    <Card ref={setNodeRef} style={style}>
      <CardContent className="flex items-center gap-3 p-3">
        <button {...attributes} {...listeners} className="cursor-grab touch-none">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>
        <Icon className="h-5 w-5 text-muted-foreground" />
        <div className="flex-1">
          <p className="text-sm font-medium">{section.title || typeInfo?.label || section.sectionType}</p>
          <p className="text-xs text-muted-foreground">{typeInfo?.label}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit}><Edit2 className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={onToggleVisibility}>
            {section.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ======================== ADD SECTION DIALOG ========================

function AddSectionDialog({
  open,
  onClose,
  pageId,
  nextOrder,
}: {
  open: boolean;
  onClose: () => void;
  pageId: string;
  nextOrder: number;
}) {
  const createSection = useCreateVitrineSection();
  const [type, setType] = useState<string>("text");
  const [title, setTitle] = useState("");

  const handleCreate = () => {
    createSection.mutate(
      {
        pageId,
        dto: {
          sectionType: type as VitrineSection["sectionType"],
          title: title || null,
          content: getDefaultContent(type),
          displayOrder: nextOrder,
          visible: true,
        },
      },
      {
        onSuccess: () => {
          setType("text");
          setTitle("");
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter une section</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Type de section</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SECTION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Titre (optionnel)</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre de la section" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleCreate} disabled={createSection.isPending}>
            {createSection.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ======================== EDIT SECTION DIALOG ========================

function EditSectionDialog({ section, onClose }: { section: VitrineSection; onClose: () => void }) {
  const updateSection = useUpdateVitrineSection();
  const [title, setTitle] = useState(section.title || "");
  const [content, setContent] = useState<Record<string, unknown>>(section.content || {});

  const handleSave = () => {
    updateSection.mutate(
      { id: section.id, dto: { ...section, title: title || null, content } },
      { onSuccess: onClose }
    );
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier la section</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Titre</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          {/* Type-specific editor */}
          {section.sectionType === "text" && (
            <div>
              <Label>Contenu</Label>
              <RichTextEditor
                content={(content.body as string) || ""}
                onChange={(html) => setContent({ ...content, body: html })}
              />
            </div>
          )}

          {section.sectionType === "hero" && (
            <>
              <div>
                <Label>Sous-titre</Label>
                <Input
                  value={(content.subtitle as string) || ""}
                  onChange={(e) => setContent({ ...content, subtitle: e.target.value })}
                />
              </div>
              <div>
                <Label>Texte du bouton</Label>
                <Input
                  value={(content.buttonText as string) || ""}
                  onChange={(e) => setContent({ ...content, buttonText: e.target.value })}
                />
              </div>
              <div>
                <Label>Lien du bouton</Label>
                <Input
                  value={(content.buttonLink as string) || ""}
                  onChange={(e) => setContent({ ...content, buttonLink: e.target.value })}
                  placeholder="/a-propos"
                />
              </div>
            </>
          )}

          {section.sectionType === "cta" && (
            <>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={(content.description as string) || ""}
                  onChange={(e) => setContent({ ...content, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label>Texte du bouton</Label>
                <Input
                  value={(content.buttonText as string) || ""}
                  onChange={(e) => setContent({ ...content, buttonText: e.target.value })}
                />
              </div>
              <div>
                <Label>Lien du bouton</Label>
                <Input
                  value={(content.buttonLink as string) || ""}
                  onChange={(e) => setContent({ ...content, buttonLink: e.target.value })}
                />
              </div>
            </>
          )}

          {section.sectionType === "stats" && (
            <StatsEditor
              stats={(content.stats as Array<{ label: string; value: string }>) || []}
              onChange={(stats) => setContent({ ...content, stats })}
            />
          )}

          {section.sectionType === "map" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Latitude</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={(content.latitude as number) || 33.5731}
                  onChange={(e) => setContent({ ...content, latitude: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={(content.longitude as number) || -7.5898}
                  onChange={(e) => setContent({ ...content, longitude: parseFloat(e.target.value) })}
                />
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave} disabled={updateSection.isPending}>
            {updateSection.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ======================== STATS EDITOR ========================

function StatsEditor({
  stats,
  onChange,
}: {
  stats: Array<{ label: string; value: string }>;
  onChange: (stats: Array<{ label: string; value: string }>) => void;
}) {
  const addStat = () => onChange([...stats, { label: "", value: "" }]);
  const removeStat = (i: number) => onChange(stats.filter((_, idx) => idx !== i));
  const updateStat = (i: number, field: "label" | "value", val: string) => {
    const updated = [...stats];
    updated[i] = { ...updated[i], [field]: val };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <Label>Statistiques</Label>
      {stats.map((stat, i) => (
        <div key={i} className="flex items-end gap-2">
          <div className="flex-1">
            <Label className="text-xs">Valeur</Label>
            <Input value={stat.value} onChange={(e) => updateStat(i, "value", e.target.value)} placeholder="150+" />
          </div>
          <div className="flex-1">
            <Label className="text-xs">Label</Label>
            <Input value={stat.label} onChange={(e) => updateStat(i, "label", e.target.value)} placeholder="Eleves" />
          </div>
          <Button variant="ghost" size="icon" onClick={() => removeStat(i)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addStat}>
        <Plus className="mr-2 h-4 w-4" /> Ajouter une stat
      </Button>
    </div>
  );
}

// ======================== HELPERS ========================

function getDefaultContent(type: string): Record<string, unknown> {
  switch (type) {
    case "hero":
      return { subtitle: "", buttonText: "En savoir plus", buttonLink: "/a-propos" };
    case "text":
      return { body: "<p>Votre contenu ici...</p>" };
    case "stats":
      return { stats: [{ label: "Eleves", value: "200+" }, { label: "Enseignants", value: "20+" }] };
    case "cta":
      return { description: "", buttonText: "Contactez-nous", buttonLink: "/contact" };
    case "map":
      return { latitude: 33.5731, longitude: -7.5898 };
    case "contact":
      return {};
    default:
      return {};
  }
}
