import { Skeleton } from "@/components/ui/skeleton";

export function StudentMessagesSkeleton() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Back button */}
      <Skeleton className="h-9 w-32 rounded-md" />

      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
      </div>

      {/* Chat area */}
      <div className="rounded-xl border border-border/50 bg-card p-4 space-y-4 min-h-[400px]">
        {/* Messages */}
        <div className="space-y-3">
          <div className="flex justify-start">
            <Skeleton className="h-16 w-64 rounded-2xl" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-12 w-56 rounded-2xl" />
          </div>
          <div className="flex justify-start">
            <Skeleton className="h-20 w-72 rounded-2xl" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-12 w-48 rounded-2xl" />
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-md" />
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>
    </div>
  );
}
