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
import { Button } from "@/components/ui/shadcn/button";
import { DynamicContentLoader } from "@/components/layout/DynamicContentLoader";
import { sanitizeSlug } from "@/lib/utils/security";
import {
  editLinkFormSchema,
  type EditLinkFormData,
} from "../../lib/validation";
import { useUpdateLink } from "@/hooks";
import { useUpdateLinkBranding } from "../../hooks";
import type { Link } from "@/lib/database/schemas";
import {
  BasicSettingsSection,
  AdvancedOptionsSection,
  BrandingToggle,
  LogoUploadSection,
  ColorPickersSection,
  LinkTypeToggle,
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
  // Tab state
  const [activeTab, setActiveTab] = React.useState("general");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // React Query hooks for link and branding updates
  const updateLink = useUpdateLink();
  const updateBranding = useUpdateLinkBranding();

  // React Hook Form setup with Zod validation
  const methods = useForm<EditLinkFormData>({
    resolver: zodResolver(editLinkFormSchema),
    defaultValues: {
      name: link.name,
      slug: link.slug,
      isPublic: link.isPublic,
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

  // Watch name field for slug generation
  const watchName = methods.watch("name");

  // Auto-generate slug from name when user edits name
  React.useEffect(() => {
    if (methods.formState.dirtyFields.name) {
      const generatedSlug = sanitizeSlug(watchName);
      methods.setValue("slug", generatedSlug, { shouldDirty: true });
    }
  }, [watchName, methods]);

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

      // Handle branding updates if branding fields changed
      const brandingFieldsChanged =
        methods.formState.dirtyFields.brandingEnabled ||
        methods.formState.dirtyFields.accentColor ||
        methods.formState.dirtyFields.backgroundColor;

      if (brandingFieldsChanged) {
        console.log("🎨 Branding fields changed, updating branding...");

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
            // Skip logo for now (GCS not set up yet)
            logo: null,
          },
        };

        await updateBranding.mutateAsync(brandingInput);
        console.log("✅ Branding updated successfully");
      }

      // TODO: Handle permission updates separately if allowedEmails changed

      setIsSubmitting(false);

      // Call success callback
      onSuccess?.(updatedLink);
    } catch (error) {
      setIsSubmitting(false);
      // Error is already handled by React Query (onError in useUpdateLink)
    }
  };

  return (
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
          isLoading={isSubmitting}
          isDirty={methods.formState.isDirty}
        />
      </form>
    </FormProvider>
  );
}
