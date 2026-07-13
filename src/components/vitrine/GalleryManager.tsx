import { useState, useCallback } from "react";
import { Upload, Trash2, Loader2, Image as ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  useVitrineGallery,
  useAddVitrineGalleryItem,
  useDeleteVitrineGalleryItem,
  useVitrineUpload,
} from "@/hooks/useVitrineAdmin";
import { resolveFileUrl } from "@/api/storage.api";

export default function GalleryManager() {
  const { data: gallery = [], isLoading } = useVitrineGallery();
  const addItem = useAddVitrineGalleryItem();
  const deleteItem = useDeleteVitrineGalleryItem();
  const uploadImage = useVitrineUpload();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ caption: "", category: "" });
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setUploading(true);
      try {
        for (const file of Array.from(files)) {
          const url = await uploadImage.mutateAsync(file);
          await addItem.mutateAsync({
            imageUrl: url,
            caption: form.caption || file.name.replace(/\.[^.]+$/, ""),
            category: form.category || null,
            displayOrder: gallery.length,
          });
        }
        setForm({ caption: "", category: "" });
        setDialogOpen(false);
      } finally {
        setUploading(false);
      }
    },
    [uploadImage, addItem, form, gallery.length]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

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
        <h3 className="text-lg font-semibold">Galerie ({gallery.length} images)</h3>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Upload className="mr-2 h-4 w-4" /> Ajouter des images
        </Button>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex min-h-[120px] items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"
        }`}
      >
        <div className="text-center text-muted-foreground">
          <ImageIcon className="mx-auto mb-2 h-8 w-8" />
          <p className="text-sm">Glissez-d&eacute;posez des images ici</p>
          <p className="text-xs">ou utilisez le bouton ci-dessus</p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {gallery.map((item) => (
          <Card key={item.id} className="group relative overflow-hidden">
            <CardContent className="p-0">
              <img
                src={resolveFileUrl(item.imageUrl)}
                alt={item.caption || ""}
                className="aspect-square w-full object-cover"
              />
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex w-full items-center justify-between p-3">
                  <div className="text-sm text-white">
                    {item.caption && <p className="font-medium">{item.caption}</p>}
                    {item.category && <p className="text-xs text-white/70">{item.category}</p>}
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => { if (confirm("Supprimer ?")) deleteItem.mutate(item.id); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {gallery.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">Aucune image dans la galerie</p>
      )}

      {/* Upload Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => !v && setDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter des images</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Fichiers</Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFiles(e.target.files)}
                disabled={uploading}
              />
            </div>
            <div>
              <Label>L&eacute;gende (optionnel)</Label>
              <Input
                value={form.caption}
                onChange={(e) => setForm({ ...form, caption: e.target.value })}
                placeholder="Description de l'image"
              />
            </div>
            <div>
              <Label>Cat&eacute;gorie (optionnel)</Label>
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Ex: Campus, Activites, Evenements"
              />
            </div>
          </div>
          <DialogFooter>
            {uploading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Upload en cours...
              </div>
            )}
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
