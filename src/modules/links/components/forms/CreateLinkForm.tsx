"use client";

import * as React from "react";
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

// =============================================================================
// TYPES
// =============================================================================

export interface CreateLinkFormProps {
  onSubmit?: (data: any) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function CreateLinkForm({
  onSubmit,
  onCancel,
  isLoading = false,
}: CreateLinkFormProps) {
  // TODO: Implement React Hook Form
  const [activeTab, setActiveTab] = React.useState("basic");
  const [linkName, setLinkName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [isPublic, setIsPublic] = React.useState(true);
  const [emails, setEmails] = React.useState<string[]>([]);
  const [passwordProtected, setPasswordProtected] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [logo, setLogo] = React.useState<FileWithPreview[]>([]);
  const [accentColor, setAccentColor] = React.useState("#6c47ff");
  const [backgroundColor, setBackgroundColor] = React.useState("#ffffff");

  // TODO: Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLinkName(e.target.value);
    // TODO: Auto-generate slug logic
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Implement submit logic
    console.log("Form submitted");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
        </TabsList>

        <TabsContents>
          {/* Tab 1: Basic Info */}
          <TabsContent value="basic" className="space-y-4 mt-4">
            <Accordion type="single" defaultValue="basic-settings" collapsible>
              {/* Basic Settings */}
              <AccordionItem value="basic-settings">
                <AccordionTrigger>Basic Settings</AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                  {/* Link Name */}
                  <div className="space-y-2">
                    <Label htmlFor="linkName">Link Name *</Label>
                    <Input
                      id="linkName"
                      value={linkName}
                      onChange={handleNameChange}
                      placeholder="e.g., Tax Documents 2024"
                      required
                    />
                  </div>

                  {/* Live URL Preview */}
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

                  {/* Link Type Toggle */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="isPublic">Who can upload files?</Label>
                        <p className="text-sm text-muted-foreground">
                          {isPublic
                            ? "Anyone with the link"
                            : "Only people you invite"}
                        </p>
                      </div>
                      <Switch
                        id="isPublic"
                        checked={isPublic}
                        onCheckedChange={setIsPublic}
                      />
                    </div>
                  </div>

                  {/* Conditional Email Input */}
                  {!isPublic && (
                    <div className="space-y-2">
                      <Label>Invite people</Label>
                      <MultiEmailInput
                        value={emails}
                        onChange={setEmails}
                        placeholder="Enter email address..."
                      />
                      <p className="text-xs text-muted-foreground">
                        Add email addresses of people you want to invite
                      </p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Access Control */}
              <AccordionItem value="access-control">
                <AccordionTrigger>Access Control</AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                  {/* Password Protection Toggle */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="passwordProtected">
                          Password Protection
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {passwordProtected
                            ? "Users must enter a password to upload"
                            : "No password required"}
                        </p>
                      </div>
                      <Switch
                        id="passwordProtected"
                        checked={passwordProtected}
                        onCheckedChange={setPasswordProtected}
                      />
                    </div>
                  </div>

                  {/* Conditional Password Input */}
                  {passwordProtected && (
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        required={passwordProtected}
                      />
                      <p className="text-xs text-muted-foreground">
                        This password will be required to access the upload link
                      </p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Advanced Options */}
              <AccordionItem value="advanced-options">
                <AccordionTrigger>Advanced Options</AccordionTrigger>
                <AccordionContent className="pt-4">
                  <p className="text-sm text-muted-foreground italic">
                    Coming soon: Link expiration, file limits, and more
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          {/* Tab 2: Branding */}
          <TabsContent value="branding" className="space-y-6 mt-4">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Logo</Label>
              <FileUpload
                maxSizeMB={5}
                accept="image/png,image/jpeg,image/webp"
                onFilesChange={setLogo}
                icon={ImageIcon}
                title="Drop your logo here"
                description="PNG, JPEG, or WebP (max. 5MB)"
                buttonText="Select logo"
                ariaLabel="Upload logo"
              />
              <p className="text-xs text-muted-foreground">
                This logo will appear on your link's upload page
              </p>
            </div>

            {/* Color Pickers */}
            <div className="space-y-6">
              <ColorPickerInput
                label="Accent Color"
                value={accentColor}
                onChange={setAccentColor}
              />
              <ColorPickerInput
                label="Background Color"
                value={backgroundColor}
                onChange={setBackgroundColor}
              />
            </div>

            <p className="text-sm text-muted-foreground">
              Customize the appearance of your link page
            </p>
          </TabsContent>
        </TabsContents>
      </Tabs>

      {/* Form Actions */}
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
    </form>
  );
}
