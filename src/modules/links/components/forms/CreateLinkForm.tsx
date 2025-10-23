'use client';

import * as React from 'react';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContents,
  TabsContent,
  Switch,
} from '@/components/ui/animateui';
import { Input } from '@/components/ui/aceternityui/input';
import { Label } from '@/components/ui/aceternityui/label';
import { Button } from '@/components/ui/shadcn/button';
import { FileUpload } from '@/components/ui/aceternityui/file-upload';
import { MultiEmailInput } from '../inputs/MultiEmailInput';
import { ColorPickerInput } from '../inputs/ColorPickerInput';
import { Loader2 } from 'lucide-react';

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
  const [activeTab, setActiveTab] = React.useState('basic');
  const [linkName, setLinkName] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [isPublic, setIsPublic] = React.useState(false);
  const [emails, setEmails] = React.useState<string[]>([]);
  const [accentColor, setAccentColor] = React.useState('#6c47ff');
  const [backgroundColor, setBackgroundColor] = React.useState('#ffffff');

  // TODO: Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLinkName(e.target.value);
    // TODO: Auto-generate slug logic
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Implement submit logic
    console.log('Form submitted');
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
              <Label htmlFor="slug">Link URL</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">foldly.com/username/</span>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="auto-generated"
                  className="flex-1 font-mono text-sm"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                URL-safe version of your link name
              </p>
            </div>

            {/* Link Type Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isPublic">Public Link</Label>
                  <p className="text-sm text-muted-foreground">
                    {isPublic
                      ? 'Anyone with the link can upload'
                      : 'Only specific emails can upload'}
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
                <Label>Allowed Emails</Label>
                <MultiEmailInput
                  value={emails}
                  onChange={setEmails}
                  placeholder="Enter email address..."
                />
                <p className="text-xs text-muted-foreground">
                  Add emails that can upload files to this link
                </p>
              </div>
            )}

            {/* Advanced Options Placeholder */}
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground italic">
                Advanced options (coming soon)
              </p>
            </div>
          </TabsContent>

          {/* Tab 2: Branding */}
          <TabsContent value="branding" className="space-y-4 mt-4">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Logo</Label>
              <FileUpload
                maxFiles={1}
                maxFileSize={5 * 1024 * 1024}
                accept="image/png,image/jpeg,image/webp"
                onChange={(files) => console.log('Logo uploaded:', files)}
              />
              <p className="text-xs text-muted-foreground">
                PNG, JPEG, or WebP. Max 5MB.
              </p>
            </div>

            {/* Color Pickers */}
            <div className="space-y-4">
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
