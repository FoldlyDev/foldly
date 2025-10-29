// =============================================================================
// USE LINK BRANDING HOOKS - Link Branding Management
// =============================================================================
// 🎯 React Query hooks for link branding operations (module-specific)
// These hooks are only used in the Links module settings/customization UI

'use client';

// TODO: Add proper user feedback when notification system is implemented
// Currently using inline error handling only (matching existing hook pattern)

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  updateLinkBrandingAction,
  deleteBrandingLogoAction,
} from '../lib/actions/branding.actions';
import type {
  UpdateLinkBrandingInput,
  DeleteBrandingLogoInput,
} from '../lib/validation/link-branding-schemas';
import { transformActionError, createMutationErrorHandler } from '@/lib/utils/react-query-helpers';
import { linkKeys } from '@/lib/config/query-keys';

// =============================================================================
// MUTATION HOOKS (Data Modifications)
// =============================================================================

/**
 * Update link branding configuration
 *
 * Used in:
 * - Links module settings (branding customization panel)
 *
 * Features:
 * - Update colors (accentColor, backgroundColor, textColor)
 * - Update descriptions and headings
 * - Toggle branding enabled/disabled
 * - Rate limited (10 requests/minute)
 * - Automatic query invalidation
 *
 * @returns Mutation for updating branding
 *
 * @example
 * ```tsx
 * function BrandingSettings({ linkId }: { linkId: string }) {
 *   const updateBranding = useUpdateLinkBranding();
 *
 *   const handleColorChange = (accentColor: string) => {
 *     updateBranding.mutate({
 *       linkId,
 *       branding: {
 *         colors: { accentColor }
 *       }
 *     });
 *   };
 *
 *   return <ColorPicker onChange={handleColorChange} />;
 * }
 * ```
 */
export function useUpdateLinkBranding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateLinkBrandingInput) => {
      const result = await updateLinkBrandingAction(data);
      return transformActionError(result, 'Failed to update branding');
    },
    retry: false, // Never retry mutations
    onSuccess: (data, variables) => {
      // TODO: Add success notification when notification system is implemented
      // Invalidate specific link cache (branding is part of link data)
      queryClient.invalidateQueries({ queryKey: linkKeys.detail(variables.linkId) });

      // Also invalidate links list in case branding affects list display
      queryClient.invalidateQueries({ queryKey: linkKeys.lists() });
    },
    onError: createMutationErrorHandler('Link branding update'),
  });
}

// NOTE: Logo upload hooks removed - now using useUppyUpload from @/hooks
// See: src/hooks/utility/use-uppy-upload.ts

/**
 * Delete branding logo
 *
 * Used in:
 * - Links module settings (remove logo button)
 *
 * Features:
 * - Deletes logo from GCS branding bucket
 * - Updates link branding (removes logo URL)
 * - Rate limited (10 requests/minute)
 * - Automatic query invalidation
 *
 * @returns Mutation for deleting logo
 *
 * @example
 * ```tsx
 * function LogoDisplay({ linkId, logoUrl }: Props) {
 *   const deleteLogo = useDeleteBrandingLogo();
 *
 *   const handleDelete = () => {
 *     if (confirm('Remove logo?')) {
 *       deleteLogo.mutate({ linkId });
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <img src={logoUrl} alt="Logo" />
 *       <button onClick={handleDelete}>Remove Logo</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useDeleteBrandingLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: DeleteBrandingLogoInput) => {
      const result = await deleteBrandingLogoAction(data);
      return transformActionError(result, 'Failed to delete logo');
    },
    retry: false, // Never retry mutations
    onSuccess: (data, variables) => {
      // TODO: Add success notification when notification system is implemented
      // Invalidate specific link cache (logo URL removed from branding)
      queryClient.invalidateQueries({ queryKey: linkKeys.detail(variables.linkId) });

      // Also invalidate links list
      queryClient.invalidateQueries({ queryKey: linkKeys.lists() });
    },
    onError: createMutationErrorHandler('Logo deletion'),
  });
}
