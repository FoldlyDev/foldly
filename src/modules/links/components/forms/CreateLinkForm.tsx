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
} from "@/components/ui/animateui";
import { MultiStepLoader } from "@/components/ui/aceternityui";
import { Button } from "@/components/ui/shadcn/button";
import { DynamicContentLoader } from "@/components/layout/DynamicContentLoader";
import { sanitizeSlug } from "@/lib/utils/security";
import {
  createLinkFormSchema,
  type CreateLinkFormData,
} from "../../lib/validation";
import { useCreateLink } from "@/hooks";
import type { Link } from "@/lib/database/schemas";
import {
  BasicSettingsSection,
  AccessControlSection,
  AdvancedOptionsSection,
  BrandingToggle,
  LogoUploadSection,
  ColorPickersSection,
} from "./BaseLinkForm";

// =============================================================================
// TYPES
// =============================================================================

export interface CreateLinkFormProps {
  onCancel: () => void;
  onSuccess?: (link: Link) => void;
}

// =============================================================================
// TAB CONTENT COMPONENTS
// =============================================================================

const BasicInfoTabContent: React.FC = React.memo(() => {
  return (
    <Accordion type="single" defaultValue="basic-settings" collapsible>
      <BasicSettingsSection />
      <AccessControlSection />
      <AdvancedOptionsSection />
    </Accordion>
  );
});
BasicInfoTabContent.displayName = "BasicInfoTabContent";

const BrandingTabContent: React.FC = React.memo(() => {
  const { watch } = useFormContext<CreateLinkFormData>();
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
}

const FormActions: React.FC<FormActionsProps> = React.memo(
  ({ onCancel, isLoading }) => {
    const { formState } = useFormContext<CreateLinkFormData>();

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
        <Button
          type="submit"
          disabled={isLoading}
          onClick={() => {
            console.log("🔘 Submit button clicked");
            console.log("❌ Form errors:", formState.errors);
            console.log("✅ Form is valid:", formState.isValid);
            console.log("📋 Dirty fields:", formState.dirtyFields);
          }}
        >
          {isLoading ? (
            <DynamicContentLoader text="" size="20" speed="2.5" />
          ) : (
            "Create Link"
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

export function CreateLinkForm({
  onCancel,
  onSuccess,
}: CreateLinkFormProps) {
  // Tab state (controlled)
  const [activeTab, setActiveTab] = React.useState("basic");

  // Loading state for MultiStepLoader
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [loadingMessage, setLoadingMessage] = React.useState("");

  // React Query hook for link creation
  const createLink = useCreateLink();

  // React Hook Form setup with Zod validation
  const methods = useForm<CreateLinkFormData>({
    resolver: zodResolver(createLinkFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      isPublic: true,
      allowedEmails: [],
      passwordProtected: false,
      password: "",
      brandingEnabled: false,
      logo: [],
      accentColor: "#6c47ff",
      backgroundColor: "#ffffff",
      // Advanced Options
      customMessage: "",
      notifyOnUpload: true,
      requireName: false,
      expiresAt: null,
    },
    mode: "onBlur",
  });

  // Watch name field for slug generation
  const watchName = methods.watch("name");

  // Auto-generate slug from name using global utility
  React.useEffect(() => {
    const generatedSlug = sanitizeSlug(watchName);
    methods.setValue("slug", generatedSlug);
  }, [watchName, methods]);

  // Form submission handler
  const handleFormSubmit = async (data: CreateLinkFormData) => {
    console.log("🚀 Form submission triggered with data:", data);

    setIsSubmitting(true);
    setLoadingMessage("Creating your link...");

    try {
      // Transform form data to action input
      const input = {
        name: data.name,
        slug: data.slug,
        isPublic: data.isPublic,
        linkConfig: {
          customMessage: data.customMessage || null,
          notifyOnUpload: data.notifyOnUpload,
          requiresName: data.requireName,
          expiresAt: data.expiresAt ? data.expiresAt.toISOString() : null,
          passwordProtected: data.passwordProtected,
          password: data.passwordProtected ? data.password : null,
        },
        branding: data.brandingEnabled ? {
          enabled: true,
          colors: {
            accentColor: data.accentColor,
            backgroundColor: data.backgroundColor,
          },
        } : undefined,
        allowedEmails: !data.isPublic && data.allowedEmails.length > 0 ? data.allowedEmails : undefined,
      };

      console.log("📤 Transformed input for action:", input);

      // Create link
      const link = await createLink.mutateAsync(input);

      console.log("✅ Link created successfully:", link);

      // TODO: Upload branding logo when GCS is configured
      // if (data.brandingEnabled && data.logo.length > 0) {
      //   setLoadingMessage("Uploading branding logo...");
      //   const logoFile = data.logo[0].file as File;
      //   const buffer = Buffer.from(await logoFile.arrayBuffer());
      //   await uploadBrandingLogoAction({
      //     linkId: link.id,
      //     file: { buffer, originalName: logoFile.name, mimeType: logoFile.type, size: logoFile.size }
      //   });
      // }

      setIsSubmitting(false);
      setLoadingMessage("");

      // Call success callback
      onSuccess?.(link);
    } catch (error) {
      setIsSubmitting(false);
      setLoadingMessage("");
      // Error is already handled by React Query (onError in useCreateLink)
    }
  };

  return (
    <>
      {/* Multi-step loader overlay */}
      <MultiStepLoader
        loading={isSubmitting}
        loadingStates={[]}
        variant="simple"
        message={loadingMessage}
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
              <TabsTrigger value="basic" type="button" disabled={isSubmitting}>
                General
              </TabsTrigger>
              <TabsTrigger value="branding" type="button" disabled={isSubmitting}>
                Branding
              </TabsTrigger>
            </TabsList>

            <TabsContents>
              <TabsContent value="basic" className="space-y-4 mt-4">
                <BasicInfoTabContent />
              </TabsContent>
              <TabsContent value="branding" className="space-y-6 mt-4">
                <BrandingTabContent />
              </TabsContent>
            </TabsContents>
          </Tabs>

          <FormActions onCancel={onCancel} isLoading={isSubmitting} />
        </form>
      </FormProvider>
    </>
  );
}
