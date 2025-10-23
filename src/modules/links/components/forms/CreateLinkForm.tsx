"use client";

import * as React from "react";
import {
  useForm,
  Controller,
  FormProvider,
  useFormContext,
} from "react-hook-form";
import type { FieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContents,
  TabsContent,
  Switch,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/animateui";
import { Input } from "@/components/ui/aceternityui/input";
import { Label } from "@/components/ui/aceternityui/label";
import { Button } from "@/components/ui/shadcn/button";
import { FileUpload } from "@/components/ui/originui";
import { MultiEmailInput } from "../inputs/MultiEmailInput";
import { ColorPickerInput } from "../inputs/ColorPickerInput";
import { Loader2, ImageIcon } from "lucide-react";
import type { FileWithPreview } from "@/hooks/utility/use-file-upload";
import { sanitizeSlug } from "@/lib/utils/security";
import {
  createLinkFormSchema,
  type CreateLinkFormData,
} from "../../lib/validation";

// =============================================================================
// TYPES
// =============================================================================

export interface CreateLinkFormProps {
  onSubmit: (data: CreateLinkFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

interface FormFieldProps {
  error?: FieldError;
}

// =============================================================================
// FIELD COMPONENTS (Smallest Units)
// =============================================================================

const LinkNameField: React.FC = React.memo(() => {
  const {
    register,
    formState: { errors },
  } = useFormContext<CreateLinkFormData>();

  return (
    <div className="space-y-2">
      <Label htmlFor="name">Link Name *</Label>
      <Input
        id="name"
        placeholder="e.g., Tax Documents 2024"
        {...register("name")}
        aria-invalid={errors.name ? "true" : "false"}
      />
      {errors.name && (
        <p className="text-xs text-destructive">{errors.name.message}</p>
      )}
    </div>
  );
});
LinkNameField.displayName = "LinkNameField";

const LinkUrlPreview: React.FC = React.memo(() => {
  const { watch } = useFormContext<CreateLinkFormData>();
  const slug = watch("slug");

  return (
    <div className="space-y-2">
      <Label>Link URL Preview</Label>
      <div className="rounded-md border bg-muted/50 px-3 py-2">
        <p className="text-sm font-mono break-all">
          {slug ? (
            <>
              <span className="text-muted-foreground">
                foldly.com/username/
              </span>
              <span className="text-foreground">{slug}</span>
            </>
          ) : (
            <span className="text-muted-foreground italic">
              URL will be generated from link name
            </span>
          )}
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        Auto-generated URL-safe version of your link name
      </p>
    </div>
  );
});
LinkUrlPreview.displayName = "LinkUrlPreview";

const LinkTypeToggle: React.FC = React.memo(() => {
  const { control, watch } = useFormContext<CreateLinkFormData>();
  const isPublic = watch("isPublic");

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="isPublic">Who can upload files?</Label>
          <p className="text-sm text-muted-foreground">
            {isPublic ? "Anyone with the link" : "Only people you invite"}
          </p>
        </div>
        <Controller
          name="isPublic"
          control={control}
          render={({ field }) => (
            <Switch
              id="isPublic"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </div>
    </div>
  );
});
LinkTypeToggle.displayName = "LinkTypeToggle";

const AllowedEmailsField: React.FC = React.memo(() => {
  const {
    control,
    watch,
    formState: { errors },
  } = useFormContext<CreateLinkFormData>();
  const isPublic = watch("isPublic");

  if (isPublic) return null;

  return (
    <div className="space-y-2">
      <Label>Invite people</Label>
      <Controller
        name="allowedEmails"
        control={control}
        render={({ field }) => (
          <MultiEmailInput
            value={field.value}
            onChange={field.onChange}
            placeholder="Enter email address..."
          />
        )}
      />
      {errors.allowedEmails && (
        <p className="text-xs text-destructive">
          {errors.allowedEmails.message}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Add email addresses of people you want to invite
      </p>
    </div>
  );
});
AllowedEmailsField.displayName = "AllowedEmailsField";

const PasswordProtectionToggle: React.FC = React.memo(() => {
  const { control, watch } = useFormContext<CreateLinkFormData>();
  const passwordProtected = watch("passwordProtected");

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="passwordProtected">Password Protection</Label>
          <p className="text-sm text-muted-foreground">
            {passwordProtected
              ? "Users must enter a password to upload"
              : "No password required"}
          </p>
        </div>
        <Controller
          name="passwordProtected"
          control={control}
          render={({ field }) => (
            <Switch
              id="passwordProtected"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </div>
    </div>
  );
});
PasswordProtectionToggle.displayName = "PasswordProtectionToggle";

const PasswordField: React.FC = React.memo(() => {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<CreateLinkFormData>();
  const passwordProtected = watch("passwordProtected");

  if (!passwordProtected) return null;

  return (
    <div className="space-y-2">
      <Label htmlFor="password">Password *</Label>
      <Input
        id="password"
        type="password"
        placeholder="Enter password"
        {...register("password")}
        aria-invalid={errors.password ? "true" : "false"}
      />
      {errors.password && (
        <p className="text-xs text-destructive">{errors.password.message}</p>
      )}
      <p className="text-xs text-muted-foreground">
        This password will be required to access the upload link
      </p>
    </div>
  );
});
PasswordField.displayName = "PasswordField";

const LogoUploadField: React.FC = React.memo(() => {
  const {
    control,
    formState: { errors },
  } = useFormContext<CreateLinkFormData>();

  return (
    <div className="space-y-2">
      <Label>Logo</Label>
      <Controller
        name="logo"
        control={control}
        render={({ field }) => (
          <FileUpload
            maxSizeMB={5}
            accept="image/png,image/jpeg,image/webp"
            onFilesChange={field.onChange}
            icon={ImageIcon}
            title="Drop your logo here"
            description="PNG, JPEG, or WebP (max. 5MB)"
            buttonText="Select logo"
            ariaLabel="Upload logo"
          />
        )}
      />
      {errors.logo && (
        <p className="text-xs text-destructive">
          {errors.logo.message as string}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        This logo will appear on your link's upload page
      </p>
    </div>
  );
});
LogoUploadField.displayName = "LogoUploadField";

const AccentColorField: React.FC = React.memo(() => {
  const {
    control,
    formState: { errors },
  } = useFormContext<CreateLinkFormData>();

  return (
    <Controller
      name="accentColor"
      control={control}
      render={({ field }) => (
        <div className="space-y-2">
          <ColorPickerInput
            label="Accent Color"
            value={field.value}
            onChange={field.onChange}
          />
          {errors.accentColor && (
            <p className="text-xs text-destructive">
              {errors.accentColor.message}
            </p>
          )}
        </div>
      )}
    />
  );
});
AccentColorField.displayName = "AccentColorField";

const BackgroundColorField: React.FC = React.memo(() => {
  const {
    control,
    formState: { errors },
  } = useFormContext<CreateLinkFormData>();

  return (
    <Controller
      name="backgroundColor"
      control={control}
      render={({ field }) => (
        <div className="space-y-2">
          <ColorPickerInput
            label="Background Color"
            value={field.value}
            onChange={field.onChange}
          />
          {errors.backgroundColor && (
            <p className="text-xs text-destructive">
              {errors.backgroundColor.message}
            </p>
          )}
        </div>
      )}
    />
  );
});
BackgroundColorField.displayName = "BackgroundColorField";

// =============================================================================
// SECTION COMPONENTS (Accordion Sections)
// =============================================================================

const BasicSettingsSection: React.FC = React.memo(() => {
  return (
    <AccordionItem value="basic-settings">
      <AccordionTrigger>Basic Settings</AccordionTrigger>
      <AccordionContent className="space-y-6 pt-4">
        <LinkNameField />
        <LinkUrlPreview />
        <LinkTypeToggle />
        <AllowedEmailsField />
      </AccordionContent>
    </AccordionItem>
  );
});
BasicSettingsSection.displayName = "BasicSettingsSection";

const AccessControlSection: React.FC = React.memo(() => {
  return (
    <AccordionItem value="access-control">
      <AccordionTrigger>Access Control</AccordionTrigger>
      <AccordionContent className="space-y-6 pt-4">
        <PasswordProtectionToggle />
        <PasswordField />
      </AccordionContent>
    </AccordionItem>
  );
});
AccessControlSection.displayName = "AccessControlSection";

const AdvancedOptionsSection: React.FC = React.memo(() => {
  return (
    <AccordionItem value="advanced-options">
      <AccordionTrigger>Advanced Options</AccordionTrigger>
      <AccordionContent className="pt-4">
        <p className="text-sm text-muted-foreground italic">
          Coming soon: Link expiration, file limits, and more
        </p>
      </AccordionContent>
    </AccordionItem>
  );
});
AdvancedOptionsSection.displayName = "AdvancedOptionsSection";

const LogoUploadSection: React.FC = React.memo(() => {
  return <LogoUploadField />;
});
LogoUploadSection.displayName = "LogoUploadSection";

const ColorPickersSection: React.FC = React.memo(() => {
  return (
    <div className="space-y-6">
      <AccentColorField />
      <BackgroundColorField />
    </div>
  );
});
ColorPickersSection.displayName = "ColorPickersSection";

// =============================================================================
// TAB CONTENT COMPONENTS (Content for each tab)
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
  return (
    <>
      <LogoUploadSection />
      <ColorPickersSection />
      <p className="text-sm text-muted-foreground">
        Customize the appearance of your link page
      </p>
    </>
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
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
          Create Link
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
  onSubmit,
  onCancel,
  isLoading = false,
}: CreateLinkFormProps) {
  // Tab state (controlled)
  const [activeTab, setActiveTab] = React.useState("basic");

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
      logo: [],
      accentColor: "#6c47ff",
      backgroundColor: "#ffffff",
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
  const handleFormSubmit = (data: CreateLinkFormData) => {
    onSubmit(data);
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
            <TabsTrigger value="basic" type="button">
              General
            </TabsTrigger>
            <TabsTrigger value="branding" type="button">
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

        <FormActions onCancel={onCancel} isLoading={isLoading} />
      </form>
    </FormProvider>
  );
}
