import { Skeleton } from "@/components/ui/skeleton";

export default function VitrineSkeleton() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navbar skeleton */}
      <div className="sticky top-0 z-50 border-b bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="hidden gap-4 md:flex">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>

      {/* Hero skeleton */}
      <Skeleton className="h-[70vh] w-full" />

      {/* Content sections skeleton */}
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-16">
        <Skeleton className="mx-auto h-8 w-64" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="bg-gray-50 py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-4 gap-8 px-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center">
              <Skeleton className="mx-auto h-10 w-20" />
              <Skeleton className="mx-auto mt-2 h-4 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Footer skeleton */}
      <div className="mt-auto border-t bg-gray-900 py-12">
        <div className="mx-auto grid max-w-7xl grid-cols-3 gap-8 px-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-5 w-32 bg-gray-700" />
              <Skeleton className="h-3 w-48 bg-gray-700" />
              <Skeleton className="h-3 w-40 bg-gray-700" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
