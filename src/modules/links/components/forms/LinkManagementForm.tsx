"use client";

import * as React from "react";
import {
  useForm,
  FormProvider,
  useFormContext,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContents,
  TabsContent,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/animateui";
import { MultiStepLoader } from "@/components/ui/aceternityui";
import { Button } from "@/components/ui/shadcn/button";
import { DynamicContentLoader } from "@/components/layout/DynamicContentLoader";
import {
  editLinkFormSchema,
  type EditLinkFormData,
} from "../../lib/validation";
import { useUpdateLink, useUserWorkspace } from "@/hooks";
import {
  useLinkFormState,
  useSlugAutoGeneration,
  useLinkLogoUpload,
  useUpdateLinkBranding,
} from "../../hooks";
import type { Link } from "@/lib/database/schemas";
import {
  BasicSettingsSection,
  AdvancedOptionsSection,
  BrandingToggle,
  LogoUploadSection,
  ColorPickersSection,
  LinkTypeToggle,
  LinkActiveToggle,
  PasswordProtectionToggle,
  PasswordField,
} from "./BaseLinkForm";

// =============================================================================
// TYPES
// =============================================================================

export interface LinkManagementFormProps {
  link: Link;
  onCancel: () => void;
  onSuccess?: (link: Link) => void;
  onOpenAccessControl?: () => void;
}

// =============================================================================
// TAB CONTENT COMPONENTS
// =============================================================================

const AccessControlSectionManagement: React.FC<{
  onOpenAccessControl?: () => void;
}> = React.memo(({ onOpenAccessControl }) => {
  const { watch } = useFormContext<EditLinkFormData>();
  const isPublic = watch("isPublic");

  return (
    <AccordionItem value="access-control">
      <AccordionTrigger>Access Control</AccordionTrigger>
      <AccordionContent className="space-y-6 pt-4">
        <LinkActiveToggle />
        <LinkTypeToggle />
        <PasswordProtectionToggle />
        <PasswordField />

        {/* Only show permissions management for private links */}
        {!isPublic && (
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-3">
              Manage who can access this link and their individual permissions
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={onOpenAccessControl}
              className="w-full"
            >
              Manage Permissions
            </Button>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
});
AccessControlSectionManagement.displayName = "AccessControlSectionManagement";

interface BasicInfoTabContentProps {
  onOpenAccessControl?: () => void;
}

const BasicInfoTabContent: React.FC<BasicInfoTabContentProps> = React.memo(
  ({ onOpenAccessControl }) => {
    return (
      <Accordion type="single" defaultValue="basic-settings" collapsible>
        <BasicSettingsSection />
        <AccessControlSectionManagement
          onOpenAccessControl={onOpenAccessControl}
        />
        <AdvancedOptionsSection />
      </Accordion>
    );
  }
);
BasicInfoTabContent.displayName = "BasicInfoTabContent";

const BrandingTabContent: React.FC = React.memo(() => {
  const { watch } = useFormContext<EditLinkFormData>();
  const brandingEnabled = watch("brandingEnabled");

  return (
    <div className="space-y-6">
      <BrandingToggle />

      {brandingEnabled && (
        <>
          <LogoUploadSection />
          <ColorPickersSection />
        </>
      )}
    </div>
  );
});
BrandingTabContent.displayName = "BrandingTabContent";

// =============================================================================
// FORM ACTIONS COMPONENT
// =============================================================================

interface FormActionsProps {
  onCancel: () => void;
  isLoading: boolean;
  isDirty: boolean;
}

const FormActions: React.FC<FormActionsProps> = React.memo(
  ({ onCancel, isLoading, isDirty }) => {
    return (
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !isDirty}>
          {isLoading ? (
            <DynamicContentLoader text="" size="20" speed="2.5" />
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    );
  }
);
FormActions.displayName = "FormActions";

// =============================================================================
// MAIN FORM COMPONENT
// =============================================================================

export function LinkManagementForm({
  link,
  onCancel,
  onSuccess,
  onOpenAccessControl,
}: LinkManagementFormProps) {
  // Form state management (tab navigation, loading states)
  const {
    activeTab,
    setActiveTab,
    isSubmitting,
    setIsSubmitting,
    loadingMessage,
    setLoadingMessage,
  } = useLinkFormState({ initialTab: "general" });

  // React Query hooks for link and branding updates
  const updateLink = useUpdateLink();
  const updateBranding = useUpdateLinkBranding();
  const { data: workspace } = useUserWorkspace();

  // Logo upload orchestration
  const { logoUpload, uploadLogoAndUpdateBranding } = useLinkLogoUpload({
    onSuccess: () => setLoadingMessage(""),
  });

  // React Hook Form setup with Zod validation
  const methods = useForm<EditLinkFormData>({
    resolver: zodResolver(editLinkFormSchema),
    defaultValues: {
      name: link.name,
      slug: link.slug,
      isPublic: link.isPublic,
      isActive: link.isActive,
      allowedEmails: [], // TODO: Load from permissions
      passwordProtected: link.linkConfig.passwordProtected || false,
      password: "", // Don't pre-fill password for security
      brandingEnabled: link.branding?.enabled || false,
      logo: [], // Existing logo is already uploaded
      accentColor: link.branding?.colors?.accentColor || "#6c47ff",
      backgroundColor: link.branding?.colors?.backgroundColor || "#ffffff",
      customMessage: link.linkConfig.customMessage || "",
      notifyOnUpload: link.linkConfig.notifyOnUpload ?? true,
      requireName: link.linkConfig.requiresName || false,
      expiresAt: link.linkConfig.expiresAt
        ? new Date(link.linkConfig.expiresAt)
        : null,
    },
    mode: "onBlur",
  });

  // Auto-generate slug from name when user edits name (only if dirty)
  useSlugAutoGeneration(methods, { onlyIfDirty: true });

  // Form submission handler
  const handleFormSubmit = async (data: EditLinkFormData) => {
    console.log("🚀 Form submission triggered with data:", data);

    setIsSubmitting(true);

    try {
      // Transform form data to update input
      const input = {
        linkId: link.id,
        name: data.name,
        slug: data.slug,
        isPublic: data.isPublic,
        isActive: data.isActive,
        linkConfig: {
          customMessage: data.customMessage || null,
          notifyOnUpload: data.notifyOnUpload,
          requiresName: data.requireName,
          expiresAt: data.expiresAt ? data.expiresAt.toISOString() : null,
          passwordProtected: data.passwordProtected,
          password:
            data.passwordProtected && data.password ? data.password : null,
        },
      };

      console.log("📤 Transformed input for action:", input);

      // Update link
      const updatedLink = await updateLink.mutateAsync(input);

      console.log("✅ Link updated successfully:", updatedLink);

      // Handle logo upload if user uploaded a new logo
      if (methods.formState.dirtyFields.logo && data.logo.length > 0 && workspace) {
        try {
          const logoFile = data.logo[0].file as File;

          setLoadingMessage("Uploading logo...");

          // Upload logo and update branding (orchestrated by primitive)
          // deleteOldLogo: true prevents storage leaks by removing old file
          await uploadLogoAndUpdateBranding({
            logoFile,
            linkId: link.id,
            workspaceId: workspace.id,
            altText: data.name,
            deleteOldLogo: true, // Delete existing logo before uploading new one
          });

          console.log("✅ Logo uploaded and branding updated");
        } catch (logoError) {
          console.error("❌ Logo upload failed:", logoError);
          // Don't fail the entire form if logo upload fails
          // User can retry logo upload later
        }
      }

      // Handle branding color updates if branding fields changed
      const brandingColorFieldsChanged =
        methods.formState.dirtyFields.brandingEnabled ||
        methods.formState.dirtyFields.accentColor ||
        methods.formState.dirtyFields.backgroundColor;

      if (brandingColorFieldsChanged) {
        console.log("🎨 Branding colors changed, updating branding...");

        const brandingInput = {
          linkId: link.id,
          branding: {
            enabled: data.brandingEnabled,
            colors: data.brandingEnabled
              ? {
                  accentColor: data.accentColor,
                  backgroundColor: data.backgroundColor,
                }
              : null,
          },
        };

        await updateBranding.mutateAsync(brandingInput);
        console.log("✅ Branding colors updated successfully");
      }

      // TODO: Handle permission updates separately if allowedEmails changed

      setIsSubmitting(false);
      setLoadingMessage("");

      // Call success callback
      onSuccess?.(updatedLink);
    } catch (error) {
      setIsSubmitting(false);
      // Error is already handled by React Query (onError in useUpdateLink)
    }
  };

  return (
    <>
      {/* Multi-step loader overlay */}
      <MultiStepLoader
        loading={isSubmitting || logoUpload.isUploading}
        loadingStates={[]}
        variant="simple"
        message={loadingMessage || (logoUpload.isUploading ? `Uploading logo... ${logoUpload.progress}%` : "")}
      />

      {/* Form */}
      <FormProvider {...methods}>
        <form
          onSubmit={methods.handleSubmit(handleFormSubmit)}
          className="space-y-6"
          noValidate
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general" type="button" disabled={isSubmitting}>
              General
            </TabsTrigger>
            <TabsTrigger value="branding" type="button" disabled={isSubmitting}>
              Branding
            </TabsTrigger>
          </TabsList>

          <TabsContents>
            <TabsContent value="general" className="space-y-4 mt-4">
              <BasicInfoTabContent
                onOpenAccessControl={onOpenAccessControl}
              />
            </TabsContent>
            <TabsContent value="branding" className="space-y-6 mt-4">
              <BrandingTabContent />
            </TabsContent>
          </TabsContents>
        </Tabs>

        <FormActions
          onCancel={onCancel}
          isLoading={isSubmitting || logoUpload.isUploading}
          isDirty={methods.formState.isDirty}
        />
      </form>
    </FormProvider>
    </>
  );
}
