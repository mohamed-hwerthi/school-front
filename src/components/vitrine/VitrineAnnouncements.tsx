import { Pin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { VitrineAnnouncement, VitrineConfig } from "@/types/vitrine";

interface Props {
  announcements: VitrineAnnouncement[];
  config: VitrineConfig;
  title?: string | null;
}

export default function VitrineAnnouncements({ announcements, config, title }: Props) {
  if (announcements.length === 0) return null;

  return (
    <section className="py-16" style={{ backgroundColor: config.primaryColor + "05" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {title && (
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">{title}</h2>
        )}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {announcements.map((ann) => (
            <Card key={ann.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{ann.title}</CardTitle>
                  {ann.pinned && (
                    <Badge variant="secondary" className="shrink-0">
                      <Pin className="mr-1 h-3 w-3" /> Important
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(ann.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </CardHeader>
              {ann.body && (
                <CardContent>
                  <div
                    className="prose prose-sm max-w-none text-gray-600"
                    dangerouslySetInnerHTML={{ __html: ann.body }}
                  />
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
