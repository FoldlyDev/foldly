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
import { useUser } from "@clerk/nextjs";
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
import { MultiStepLoader } from "@/components/ui/aceternityui";
import { Input } from "@/components/ui/aceternityui/input";
import { Label } from "@/components/ui/aceternityui/label";
import { Button } from "@/components/ui/shadcn/button";
import { Textarea } from "@/components/ui/shadcn/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
import { FileUpload } from "@/components/ui/originui";
import { MultiEmailInput } from "../inputs/MultiEmailInput";
import { ColorPickerInput } from "../inputs/ColorPickerInput";
import { Loader2, ImageIcon, CalendarIcon } from "lucide-react";
import type { FileWithPreview } from "@/hooks/utility/use-file-upload";
import { sanitizeSlug } from "@/lib/utils/security";
import {
  createLinkFormSchema,
  type CreateLinkFormData,
} from "../../lib/validation";
import { useCreateLink } from "@/hooks";
import type { Link } from "@/lib/database/schemas";

// =============================================================================
// TYPES
// =============================================================================

export interface CreateLinkFormProps {
  onCancel: () => void;
  onSuccess?: (link: Link) => void;
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
  const { user } = useUser();
  const slug = watch("slug");
  const username = user?.username || "username";

  return (
    <div className="space-y-2">
      <Label>Link URL Preview</Label>
      <div className="rounded-md border bg-muted/50 px-3 py-2">
        <p className="text-sm font-mono break-all">
          {slug ? (
            <>
              <span className="text-muted-foreground">
                foldly.com/{username}/
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

const BrandingToggle: React.FC = React.memo(() => {
  const { control, watch } = useFormContext<CreateLinkFormData>();
  const brandingEnabled = watch("brandingEnabled");

  return (
    <Card className="dark:foldly-glass foldly-glass-light ">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">Custom Branding</CardTitle>
            <CardDescription>
              {brandingEnabled
                ? "Customize your link's appearance with logo and colors"
                : "Enable to customize your link's appearance with logo and colors"}
            </CardDescription>
          </div>
          <Controller
            name="brandingEnabled"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
        </div>
      </CardHeader>
    </Card>
  );
});
BrandingToggle.displayName = "BrandingToggle";

// =============================================================================
// ADVANCED OPTIONS FIELD COMPONENTS
// =============================================================================

const CustomMessageField: React.FC = React.memo(() => {
  const {
    register,
    formState: { errors },
  } = useFormContext<CreateLinkFormData>();

  return (
    <div className="space-y-2">
      <Label htmlFor="customMessage">Custom Message</Label>
      <Textarea
        id="customMessage"
        placeholder="Add instructions or a message for uploaders (optional)"
        {...register("customMessage")}
        aria-invalid={errors.customMessage ? "true" : "false"}
        className="min-h-[100px] resize-none"
      />
      {errors.customMessage && (
        <p className="text-xs text-destructive">
          {errors.customMessage.message}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        This message will appear on the upload page
      </p>
    </div>
  );
});
CustomMessageField.displayName = "CustomMessageField";

const NotifyOnUploadToggle: React.FC = React.memo(() => {
  const { control, watch } = useFormContext<CreateLinkFormData>();
  const notifyOnUpload = watch("notifyOnUpload");

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="notifyOnUpload">Email Notifications</Label>
          <p className="text-sm text-muted-foreground">
            {notifyOnUpload
              ? "You'll receive an email when someone uploads a file"
              : "You won't receive upload notifications"}
          </p>
        </div>
        <Controller
          name="notifyOnUpload"
          control={control}
          render={({ field }) => (
            <Switch
              id="notifyOnUpload"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </div>
    </div>
  );
});
NotifyOnUploadToggle.displayName = "NotifyOnUploadToggle";

const RequireNameToggle: React.FC = React.memo(() => {
  const { control, watch } = useFormContext<CreateLinkFormData>();
  const requireName = watch("requireName");

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="requireName">Require Uploader Name</Label>
          <p className="text-sm text-muted-foreground">
            {requireName
              ? "Uploaders must provide their name before uploading"
              : "Name is optional for uploaders"}
          </p>
        </div>
        <Controller
          name="requireName"
          control={control}
          render={({ field }) => (
            <Switch
              id="requireName"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </div>
    </div>
  );
});
RequireNameToggle.displayName = "RequireNameToggle";

const ExpirationDateField: React.FC = React.memo(() => {
  const {
    control,
    formState: { errors },
  } = useFormContext<CreateLinkFormData>();
  const [open, setOpen] = React.useState(false);

  const formatDate = (date: Date | undefined | null) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="expiresAt">Link Expiration (Optional)</Label>
      <Controller
        name="expiresAt"
        control={control}
        render={({ field }) => (
          <div className="relative flex gap-2">
            <Input
              id="expiresAt"
              value={formatDate(field.value)}
              placeholder="Select expiration date"
              className="pr-10"
              readOnly
            />
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
                  type="button"
                >
                  <CalendarIcon className="size-3.5" />
                  <span className="sr-only">Select date</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto overflow-hidden p-0"
                align="end"
                alignOffset={-8}
                sideOffset={10}
              >
                <Calendar
                  mode="single"
                  selected={field.value || undefined}
                  onSelect={(date) => {
                    field.onChange(date || null);
                    setOpen(false);
                  }}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      />
      {errors.expiresAt && (
        <p className="text-xs text-destructive">{errors.expiresAt.message}</p>
      )}
      <p className="text-xs text-muted-foreground">
        The link will stop accepting uploads after this date
      </p>
    </div>
  );
});
ExpirationDateField.displayName = "ExpirationDateField";

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
      <AccordionContent className="space-y-6 pt-4">
        <CustomMessageField />
        <NotifyOnUploadToggle />
        <RequireNameToggle />
        <ExpirationDateField />
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
