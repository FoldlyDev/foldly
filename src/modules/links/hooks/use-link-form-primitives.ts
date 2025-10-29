// =============================================================================
// LINK FORM PRIMITIVES - Composable Form Utilities
// =============================================================================
// 🎯 Reusable hooks for link form orchestration (create, edit, duplicate)
//
// These primitives extract common patterns across link forms without duplicating
// global utilities. They compose existing global hooks and utilities into
// higher-level form orchestration patterns.
//
// Usage:
// ```tsx
// import { useLinkFormState, useSlugAutoGeneration, useLinkLogoUpload } from './hooks';
//
// function MyLinkForm() {
//   const formState = useLinkFormState();
//   const methods = useForm({...});
//   useSlugAutoGeneration(methods);
//   const { uploadLogoAndUpdateBranding } = useLinkLogoUpload();
//   // ... rest of form logic
// }
// ```

"use client";

import { useState, useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import { sanitizeSlug } from "@/lib/utils/security";
import { useUppyUpload, useUserWorkspace } from "@/hooks";
import { useUpdateLinkBranding, useDeleteBrandingLogo } from "./use-link-branding";
import { BRANDING_BUCKET_NAME, generateBrandingPath } from "../lib/validation/link-branding-schemas";

// =============================================================================
// PRIMITIVE 1: Form State Management
// =============================================================================

export interface UseLinkFormStateOptions {
  /**
   * Initial active tab value
   * @default "basic"
   */
  initialTab?: string;
}

/**
 * Manages common form state: tab navigation and loading/submission state
 *
 * Used by all link forms (create, edit, duplicate) for consistent state management.
 *
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * function CreateLinkForm() {
 *   const { activeTab, setActiveTab, isSubmitting, setIsSubmitting, loadingMessage, setLoadingMessage } = useLinkFormState();
 *
 *   const handleSubmit = async (data) => {
 *     setIsSubmitting(true);
 *     setLoadingMessage("Creating link...");
 *     // ... submission logic
 *     setIsSubmitting(false);
 *   };
 * }
 *
 * // Edit form with different tab names
 * function EditLinkForm() {
 *   const formState = useLinkFormState({ initialTab: "general" });
 * }
 * ```
 */
export function useLinkFormState(options?: UseLinkFormStateOptions) {
  const [activeTab, setActiveTab] = useState(options?.initialTab || "basic");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  return {
    activeTab,
    setActiveTab,
    isSubmitting,
    setIsSubmitting,
    loadingMessage,
    setLoadingMessage,
  };
}

// =============================================================================
// PRIMITIVE 2: Slug Auto-Generation
// =============================================================================

export interface UseSlugAutoGenerationOptions {
  /**
   * Only update slug if the name field has been modified by the user.
   * Useful for edit forms where you don't want to overwrite existing slugs.
   * @default false
   */
  onlyIfDirty?: boolean;
}

/**
 * Auto-generates URL-safe slug from the name field using global sanitizeSlug utility
 *
 * Watches the "name" field and automatically updates "slug" field with a sanitized version.
 *
 * @param methods - React Hook Form methods (from useForm)
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * // Create form: Always generate slug
 * function CreateLinkForm() {
 *   const methods = useForm({...});
 *   useSlugAutoGeneration(methods);
 * }
 *
 * // Edit form: Only update if user modifies name
 * function EditLinkForm() {
 *   const methods = useForm({...});
 *   useSlugAutoGeneration(methods, { onlyIfDirty: true });
 * }
 * ```
 */
export function useSlugAutoGeneration(
  methods: UseFormReturn<any>,
  options?: UseSlugAutoGenerationOptions
) {
  const watchName = methods.watch("name");

  useEffect(() => {
    // Skip if onlyIfDirty is true and name hasn't been modified
    if (options?.onlyIfDirty && !methods.formState.dirtyFields.name) {
      return;
    }

    // Generate slug using global utility
    const generatedSlug = sanitizeSlug(watchName);

    // Update slug field (mark as dirty for edit forms)
    methods.setValue("slug", generatedSlug, {
      shouldDirty: options?.onlyIfDirty
    });
  }, [watchName, methods, options?.onlyIfDirty]);
}

// =============================================================================
// PRIMITIVE 3: Logo Upload Orchestration
// =============================================================================

/**
 * Orchestrates logo upload and branding update workflow
 *
 * Wraps the 4-step process:
 * 1. Delete old logo from storage (if replacing existing logo)
 * 2. Upload new logo file via Uppy (resumable upload to GCS/Supabase)
 * 3. Get public logo URL
 * 4. Update link branding with new logo URL
 *
 * Uses global hooks internally:
 * - `useDeleteBrandingLogo()` for deleting old logo
 * - `useUppyUpload()` for file upload
 * - `useUpdateLinkBranding()` for branding update
 * - `useUserWorkspace()` for workspace context
 *
 * @param config - Optional configuration
 *
 * @example
 * ```tsx
 * function CreateLinkForm() {
 *   const { logoUpload, uploadLogoAndUpdateBranding } = useLinkLogoUpload();
 *
 *   const handleSubmit = async (data) => {
 *     const link = await createLink(data);
 *
 *     if (data.logo.length > 0) {
 *       const logoUrl = await uploadLogoAndUpdateBranding({
 *         logoFile: data.logo[0].file,
 *         linkId: link.id,
 *         workspaceId: workspace.id,
 *         altText: data.name,
 *         deleteOldLogo: false, // No old logo for new links
 *       });
 *     }
 *   };
 *
 *   // Access Uppy state for progress indicators
 *   {logoUpload.isUploading && <ProgressBar progress={logoUpload.progress} />}
 * }
 * ```
 */
export function useLinkLogoUpload(config?: {
  onSuccess?: () => void;
}) {
  const { data: workspace } = useUserWorkspace();
  const updateBranding = useUpdateLinkBranding();
  const deleteLogo = useDeleteBrandingLogo();

  // Initialize Uppy upload hook (global hook from @/hooks)
  const logoUpload = useUppyUpload({
    bucket: BRANDING_BUCKET_NAME || 'foldly-link-branding',
    onSuccess: config?.onSuccess,
  });

  /**
   * Upload logo and update link branding
   *
   * @param params - Upload parameters
   * @param params.deleteOldLogo - Whether to delete existing logo before upload (prevents storage leaks)
   * @returns Logo public URL
   * @throws Error if upload or branding update fails
   */
  const uploadLogoAndUpdateBranding = async (params: {
    logoFile: File;
    linkId: string;
    workspaceId: string;
    altText: string;
    deleteOldLogo?: boolean;
  }): Promise<string> => {
    const { logoFile, linkId, workspaceId, altText, deleteOldLogo = false } = params;

    // Step 1: Delete old logo from storage (if replacing existing logo)
    if (deleteOldLogo) {
      try {
        await deleteLogo.mutateAsync({ linkId });
      } catch (error) {
        // Log but don't fail - old logo might not exist or already deleted
        console.warn("Failed to delete old logo (might not exist):", error);
      }
    }

    // Step 2: Upload new logo via Uppy (resumable upload)
    const logoUrl = await logoUpload.upload(logoFile, {
      path: generateBrandingPath(workspaceId, linkId),
      metadata: {
        workspaceId,
        linkId,
        originalFileName: logoFile.name,
      },
    });

    // Step 3: Update link branding with new logo URL
    await updateBranding.mutateAsync({
      linkId,
      branding: {
        logo: {
          url: logoUrl,
          altText,
        },
      },
    });

    return logoUrl;
  };

  return {
    /**
     * Direct access to Uppy upload state
     * Useful for progress indicators, loading states, error handling
     */
    logoUpload,

    /**
     * High-level function to upload logo and update branding in one call
     */
    uploadLogoAndUpdateBranding,
  };
}
