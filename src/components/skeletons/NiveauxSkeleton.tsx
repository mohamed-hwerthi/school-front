export function NiveauxSkeleton() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="h-7 w-48 rounded-lg bg-muted" />
          <div className="h-4 w-72 rounded-lg bg-muted mt-2" />
        </div>
        <div className="h-9 w-36 rounded-lg bg-muted" />
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-5 w-28 rounded bg-muted" />
              <div className="h-5 w-16 rounded-full bg-muted" />
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="h-7 w-14 rounded-full bg-muted" />
              <div className="h-7 w-14 rounded-full bg-muted" />
              <div className="h-7 w-14 rounded-full bg-muted" />
            </div>
            <div className="flex gap-2">
              <div className="h-9 flex-1 rounded-lg bg-muted" />
              <div className="h-9 w-20 rounded-lg bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
