'use client';

export function LinksSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}
