import { useCallback } from 'react';
import { useUploadStore } from '../stores/upload-store';
import type { LinkWithOwner } from '../types';

export function useUploadSession() {
  const { setSession } = useUploadStore();

  const initializeSession = useCallback(
    (link: LinkWithOwner) => {
      setSession({
        linkId: link.id,
        uploaderName: '',
        uploaderEmail: undefined,
        uploaderMessage: undefined,
        authenticated: false,
      });
    },
    [setSession]
  );

  return { initializeSession };
}