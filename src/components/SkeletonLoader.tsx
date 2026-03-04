"use client";

export function OrderFormSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Deadline banner skeleton */}
      <div className="rounded-2xl h-14 bg-cream-dark" />

      {/* Category tabs skeleton */}
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 w-28 rounded-xl bg-cream-dark shrink-0" />
        ))}
      </div>

      {/* Item cards skeleton */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 w-40 rounded bg-cream-dark" />
              <div className="h-3 w-24 rounded bg-cream-dark" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-cream-dark" />
              <div className="h-10 w-14 rounded-xl bg-cream-dark" />
              <div className="h-10 w-10 rounded-xl bg-cream-dark" />
            </div>
          </div>
        </div>
      ))}

      {/* Bottom bar skeleton */}
      <div className="h-20" />
    </div>
  );
}
