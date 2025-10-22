'use client';

import { useUserLinks } from '@/hooks';
import { LinksSkeleton } from '../ui/LinksSkeleton';
import { LinkCard } from '../ui/LinkCard';

export function UserLinks() {
  const { data: links, isLoading, error } = useUserLinks();

  if (isLoading) {
    return <LinksSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-destructive">Error loading links: {error.message}</div>
      </div>
    );
  }

  if (!links || links.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Your Links</h1>
        <p className="text-muted-foreground">No links yet. Create your first link to get started.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Your Links</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {links.map((link) => (
          <LinkCard key={link.id} link={link} />
        ))}
      </div>
    </div>
  );
}
