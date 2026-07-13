import { useState } from "react";
import type { VitrineGalleryItem } from "@/types/vitrine";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { resolveFileUrl } from "@/api/storage.api";

interface Props {
  gallery: VitrineGalleryItem[];
  title?: string | null;
}

export default function VitrineGallery({ gallery, title }: Props) {
  const [selected, setSelected] = useState<VitrineGalleryItem | null>(null);
  const categories = [...new Set(gallery.map((g) => g.category).filter(Boolean))] as string[];
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = activeCategory
    ? gallery.filter((g) => g.category === activeCategory)
    : gallery;

  if (gallery.length === 0) return null;

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {title && (
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">{title}</h2>
        )}

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                !activeCategory ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Tous
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeCategory === cat ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelected(item)}
              className="group relative aspect-[4/3] overflow-hidden rounded-lg"
            >
              <img
                src={resolveFileUrl(item.imageUrl)}
                alt={item.caption || ""}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              {item.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <p className="text-sm text-white">{item.caption}</p>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Lightbox */}
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-4xl p-0">
            {selected && (
              <img
                src={resolveFileUrl(selected.imageUrl)}
                alt={selected.caption || ""}
                className="h-auto w-full rounded-lg"
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
