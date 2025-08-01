export const filesQueryKeys = {
  all: ['files'] as const,
  linksWithFiles: () => [...filesQueryKeys.all, 'links-with-files'] as const,
  linkFiles: (linkId: string) => [...filesQueryKeys.all, 'link', linkId, 'files'] as const,
  workspace: () => ['workspace'] as const,
  storage: () => ['storage'] as const,
} as const;