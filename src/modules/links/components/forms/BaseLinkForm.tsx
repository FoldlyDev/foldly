"use client";

import * as React from "react";
import {
  Controller,
  useFormContext,
} from "react-hook-form";
import type { FieldError } from "react-hook-form";
import { useUser } from "@clerk/nextjs";
import {
  Switch,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/animateui";
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
import { SingleFileUpload } from "@/components/ui/originui/file-upload";
import { MultiEmailInput } from "../inputs/MultiEmailInput";
import { ColorPickerInput } from "../inputs/ColorPickerInput";
import { ImageIcon, CalendarIcon, Eye, EyeOff } from "lucide-react";
import type { CreateLinkFormData, EditLinkFormData } from "../../lib/validation";

// =============================================================================
// TYPES
// =============================================================================

export interface FormFieldProps {
  error?: FieldError;
}

// =============================================================================
// FIELD COMPONENTS (Smallest Units)
// =============================================================================

export const LinkNameField: React.FC = React.memo(() => {
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

export const LinkUrlPreview: React.FC = React.memo(() => {
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

export const LinkTypeToggle: React.FC = React.memo(() => {
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

export const LinkActiveToggle: React.FC = React.memo(() => {
  const { control, watch } = useFormContext<EditLinkFormData>();
  const isActive = watch("isActive");

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="isActive">Link Status</Label>
          <p className="text-sm text-muted-foreground">
            {isActive
              ? "Link is active and accepting uploads"
              : "Link is paused and not accepting uploads"}
          </p>
        </div>
        <Controller
          name="isActive"
          control={control}
          render={({ field }) => (
            <Switch
              id="isActive"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </div>
    </div>
  );
});
LinkActiveToggle.displayName = "LinkActiveToggle";

export const AllowedEmailsField: React.FC = React.memo(() => {
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
        Add initial collaborators (you can manage detailed permissions later)
      </p>
    </div>
  );
});
AllowedEmailsField.displayName = "AllowedEmailsField";

export const PasswordProtectionToggle: React.FC = React.memo(() => {
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

export const PasswordField: React.FC = React.memo(() => {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<CreateLinkFormData>();
  const passwordProtected = watch("passwordProtected");
  const [showPassword, setShowPassword] = React.useState(false);

  if (!passwordProtected) return null;

  return (
    <div className="space-y-2">
      <Label htmlFor="password">Password *</Label>
      <div className="relative">
        <Input
          id="password"
          type={showPassword ? "text" : "password"}
          placeholder="Enter password"
          {...register("password")}
          aria-invalid={errors.password ? "true" : "false"}
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>
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

export const LogoUploadField: React.FC = React.memo(() => {
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
          <SingleFileUpload
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

export const AccentColorField: React.FC = React.memo(() => {
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

export const BackgroundColorField: React.FC = React.memo(() => {
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

export const BrandingToggle: React.FC = React.memo(() => {
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

export const CustomMessageField: React.FC = React.memo(() => {
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

export const NotifyOnUploadToggle: React.FC = React.memo(() => {
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

export const RequireNameToggle: React.FC = React.memo(() => {
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

export const ExpirationDateField: React.FC = React.memo(() => {
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

export const BasicSettingsSection: React.FC = React.memo(() => {
  return (
    <AccordionItem value="basic-settings">
      <AccordionTrigger>Basic Settings</AccordionTrigger>
      <AccordionContent className="space-y-6 pt-4">
        <LinkNameField />
        <LinkUrlPreview />
      </AccordionContent>
    </AccordionItem>
  );
});
BasicSettingsSection.displayName = "BasicSettingsSection";

export const AccessControlSection: React.FC = React.memo(() => {
  return (
    <AccordionItem value="access-control">
      <AccordionTrigger>Access Control</AccordionTrigger>
      <AccordionContent className="space-y-6 pt-4">
        <LinkTypeToggle />
        <AllowedEmailsField />
        <PasswordProtectionToggle />
        <PasswordField />
      </AccordionContent>
    </AccordionItem>
  );
});
AccessControlSection.displayName = "AccessControlSection";

export const AdvancedOptionsSection: React.FC = React.memo(() => {
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

export const LogoUploadSection: React.FC = React.memo(() => {
  return <LogoUploadField />;
});
LogoUploadSection.displayName = "LogoUploadSection";

export const ColorPickersSection: React.FC = React.memo(() => {
  return (
    <div className="space-y-6">
      <AccentColorField />
      <BackgroundColorField />
    </div>
  );
});
ColorPickersSection.displayName = "ColorPickersSection";
