// =============================================================================
// USE FOLDER-LINK HOOKS - Folder ↔ Link Relationship Management
// =============================================================================
// 🎯 Folder-link queries and mutations with React Query
// Module-specific hooks for Workspace Module
// Handles linking/unlinking folders to/from shareable links

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  linkFolderToExistingLinkAction,
  linkFolderWithNewLinkAction,
  unlinkFolderAction,
  getAvailableLinksAction,
} from '../lib/actions/folder-link.actions';
import type {
  LinkFolderToExistingLinkInput,
  LinkFolderWithNewLinkInput,
  UnlinkFolderInput,
} from '@/lib/validation/folder-link-schemas';
import {
  transformActionError,
  transformQueryResult,
  createMutationErrorHandler,
  invalidateFolders,
  invalidateLinks,
} from '@/lib/utils/react-query-helpers';
import { folderKeys, linkKeys, contextKeys } from '@/lib/config/query-keys';

// =============================================================================
// QUERY HOOKS (Data Fetching)
// =============================================================================

/**
 * Get available links for workspace
 * Returns inactive links that can be reused for linking folders
 *
 * Used in:
 * - LinkFolderToExistingModal (dropdown selection)
 * - Folder context menu (conditional rendering)
 *
 * @returns Query with array of available (inactive) links
 *
 * @example
 * ```tsx
 * function LinkFolderToExistingModal() {
 *   const { data: availableLinks, isLoading } = useAvailableLinks();
 *
 *   if (isLoading) return <Skeleton />;
 *   if (!availableLinks?.length) return <EmptyState message="No inactive links available" />;
 *
 *   return (
 *     <Select>
 *       {availableLinks.map(link => (
 *         <Option key={link.id} value={link.id}>{link.name}</Option>
 *       ))}
 *     </Select>
 *   );
 * }
 * ```
 */
export function useAvailableLinks() {
  return useQuery({
    queryKey: linkKeys.available(),
    queryFn: async () => {
      const result = await getAvailableLinksAction();
      return transformQueryResult(result, 'Failed to fetch available links', []);
    },
    staleTime: 30 * 1000, // 30 seconds - links become available/unavailable frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// =============================================================================
// MUTATION HOOKS (Data Modifications)
// =============================================================================

/**
 * Link personal folder to existing inactive link
 *
 * Used in:
 * - LinkFolderToExistingModal
 * - Folder context menu "Link to Existing" action
 *
 * Features:
 * - Validates folder ownership and link availability
 * - Activates the link (isActive = true)
 * - Atomic cache invalidation (folder + link)
 * - Toast notification on success/error
 * - Non-destructive (preserves folder and link data)
 *
 * @returns Mutation for linking folder to existing link
 *
 * @example
 * ```tsx
 * function LinkFolderToExistingForm({ folder }: { folder: Folder }) {
 *   const linkToExisting = useLinkFolderToExistingLink();
 *   const [selectedLinkId, setSelectedLinkId] = useState('');
 *
 *   const handleSubmit = () => {
 *     linkToExisting.mutate({
 *       folderId: folder.id,
 *       linkId: selectedLinkId
 *     }, {
 *       onSuccess: () => {
 *         toast.success('Folder linked successfully');
 *         onClose();
 *       }
 *     });
 *   };
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 */
export function useLinkFolderToExistingLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: LinkFolderToExistingLinkInput) => {
      const result = await linkFolderToExistingLinkAction(input);
      return transformActionError(result, 'Failed to link folder');
    },
    onSuccess: async (_, variables) => {
      // Atomic cache invalidation (folder + link)
      await Promise.all([
        invalidateFolders(queryClient, variables.folderId),
        invalidateLinks(queryClient, variables.linkId),
      ]);
    },
    onError: createMutationErrorHandler('Folder linking'),
    retry: false,
  });
}

/**
 * Create new link and link folder in one atomic operation
 * Auto-generates link name/slug from folder name
 *
 * Used in:
 * - ShareFolderModal (primary share action)
 * - Folder context menu "Share Folder" action
 *
 * Auto-generation:
 * - Link name: "{folder.name} Link" (e.g., "Client Documents Link")
 * - Link slug: "{slugify(folder.name)}-link" (e.g., "client-documents-link")
 * - Conflict resolution: Auto-increment (e.g., "client-documents-link-2")
 * - Default config: Public, no password, notify on upload
 *
 * Features:
 * - Validates folder ownership
 * - Creates link with owner + editor permissions
 * - Activates link immediately
 * - Returns created link (for copy URL action)
 * - Atomic cache invalidation (folder + links list)
 * - Toast notification on success/error
 *
 * @returns Mutation for creating link and linking folder
 *
 * @example
 * ```tsx
 * function ShareFolderModal({ folder }: { folder: Folder }) {
 *   const linkWithNew = useLinkFolderWithNewLink();
 *   const [emails, setEmails] = useState<string[]>([]);
 *
 *   const handleShare = () => {
 *     linkWithNew.mutate({
 *       folderId: folder.id,
 *       allowedEmails: emails
 *     }, {
 *       onSuccess: (link) => {
 *         toast.success('Link created and shared');
 *         // Auto-copy link URL to clipboard
 *         navigator.clipboard.writeText(`foldly.com/${link.slug}`);
 *         onClose();
 *       }
 *     });
 *   };
 *
 *   return <form onSubmit={handleShare}>...</form>;
 * }
 * ```
 */
export function useLinkFolderWithNewLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: LinkFolderWithNewLinkInput) => {
      const result = await linkFolderWithNewLinkAction(input);
      return transformActionError(result, 'Failed to create link');
    },
    onSuccess: async (link, variables) => {
      // Atomic cache invalidation (folder + links list)
      await Promise.all([
        invalidateFolders(queryClient, variables.folderId),
        queryClient.invalidateQueries({ queryKey: linkKeys.lists() }),
      ]);

      // Set the new link in cache
      queryClient.setQueryData(linkKeys.detail(link.id), link);
    },
    onError: createMutationErrorHandler('Link creation'),
    retry: false,
  });
}

/**
 * Unlink folder from shareable link (convert to personal)
 * Non-destructive: Sets folder.linkId = NULL, link.isActive = false
 * Preserves link record for potential re-use
 *
 * Used in:
 * - UnlinkFolderConfirmModal
 * - Folder context menu "Unlink Folder" action
 *
 * Features:
 * - Validates folder ownership
 * - Non-destructive (preserves both folder and link)
 * - Deactivates link (isActive = false)
 * - Link becomes available for re-use
 * - Atomic cache invalidation (folder + link)
 * - Toast notification on success/error
 * - Idempotent (returns success if folder already personal)
 *
 * @returns Mutation for unlinking folder
 *
 * @example
 * ```tsx
 * function UnlinkFolderConfirmModal({ folder }: { folder: Folder }) {
 *   const unlinkFolder = useUnlinkFolder();
 *
 *   const handleConfirm = () => {
 *     unlinkFolder.mutate({
 *       folderId: folder.id
 *     }, {
 *       onSuccess: () => {
 *         toast.success('Folder converted to personal');
 *         onClose();
 *       }
 *     });
 *   };
 *
 *   return (
 *     <Modal>
 *       <p>Unlink this folder? The shareable link will become inactive.</p>
 *       <Button onClick={handleConfirm}>Confirm</Button>
 *     </Modal>
 *   );
 * }
 * ```
 */
export function useUnlinkFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UnlinkFolderInput) => {
      const result = await unlinkFolderAction(input);
      return transformActionError(result, 'Failed to unlink folder');
    },
    onSuccess: async (_, variables) => {
      // Get folder data from cache to find linkId
      const folderData = queryClient.getQueryData(folderKeys.detail(variables.folderId));
      const linkId = folderData && typeof folderData === 'object' && 'linkId' in folderData
        ? (folderData.linkId as string | null)
        : null;

      // Atomic cache invalidation (folder + link if linkId exists)
      if (linkId) {
        await Promise.all([
          invalidateFolders(queryClient, variables.folderId),
          invalidateLinks(queryClient, linkId),
        ]);
      } else {
        // If no linkId, just invalidate folder
        await invalidateFolders(queryClient, variables.folderId);
      }
    },
    onError: createMutationErrorHandler('Folder unlinking'),
    retry: false,
  });
}
