import { Skeleton } from "@/components/ui/skeleton";

export function StudentProfileSkeleton() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Back button */}
      <Skeleton className="h-9 w-32 rounded-md" />

      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
        <div className="ml-auto flex gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
            <Skeleton className="h-5 w-36" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Notes section */}
      <div className="rounded-xl border border-border/50 bg-card p-5 space-y-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
}
