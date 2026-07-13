export function EmploiSallesSkeleton() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="h-7 w-56 rounded-lg bg-muted" />
          <div className="h-4 w-72 rounded-lg bg-muted mt-2" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-24 rounded-lg bg-muted" />
          <div className="h-9 w-32 rounded-lg bg-muted" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <div className="h-9 w-28 rounded-lg bg-muted" />
        <div className="h-9 w-36 rounded-lg bg-muted" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card p-4">
            <div className="h-9 w-9 rounded-lg bg-muted" />
            <div className="h-7 w-12 rounded-lg bg-muted mt-2.5" />
            <div className="h-3 w-20 rounded bg-muted mt-1.5" />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border/50 bg-card p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="h-10 flex-1 rounded-lg bg-muted" />
          <div className="flex gap-2">
            <div className="h-10 w-[150px] rounded-lg bg-muted" />
            <div className="h-10 w-[130px] rounded-lg bg-muted" />
            <div className="h-10 w-[130px] rounded-lg bg-muted" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <div className="border-b border-border bg-muted/30 py-3 px-4 flex gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 w-20 rounded bg-muted" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 px-4 border-b border-border/50">
            <div className="h-9 w-9 rounded-lg bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-28 rounded bg-muted" />
              <div className="h-3 w-20 rounded bg-muted" />
            </div>
            <div className="h-4 w-16 rounded bg-muted hidden sm:block" />
            <div className="h-4 w-10 rounded bg-muted hidden md:block" />
            <div className="h-6 w-20 rounded-full bg-muted" />
            <div className="flex gap-1">
              <div className="h-8 w-8 rounded bg-muted" />
              <div className="h-8 w-8 rounded bg-muted" />
              <div className="h-8 w-8 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
