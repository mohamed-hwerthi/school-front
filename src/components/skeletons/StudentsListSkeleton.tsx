import { Skeleton } from "@/components/ui/skeleton";

export function StudentsListSkeleton() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-7 w-12" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border/50 bg-card p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <Skeleton className="h-10 flex-1 rounded-md" />
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-10 w-[150px] rounded-md" />
            <Skeleton className="h-10 w-[130px] rounded-md" />
            <Skeleton className="h-10 w-[130px] rounded-md" />
          </div>
        </div>
        <Skeleton className="h-3 w-28 mt-3" />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="border-b border-border bg-muted/30 py-3 px-4 flex gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16 hidden sm:block" />
          <Skeleton className="h-4 w-20 hidden md:block" />
          <Skeleton className="h-4 w-20 hidden lg:block" />
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-20 ml-auto" />
        </div>
        {/* Table Rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border-b border-border/50 last:border-0 py-3 px-4 flex items-center gap-4">
            <div className="flex items-center gap-3 min-w-[180px]">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
            <Skeleton className="h-5 w-10 hidden sm:block" />
            <Skeleton className="h-4 w-20 hidden md:block" />
            <Skeleton className="h-4 w-24 hidden lg:block" />
            <Skeleton className="h-5 w-14 rounded-full" />
            <div className="ml-auto flex gap-1">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
