'use client';

export function SettingsSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
