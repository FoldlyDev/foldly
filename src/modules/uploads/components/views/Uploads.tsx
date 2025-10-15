'use client';

import { Card } from '@/components/ui/shadcn/card';

interface LinkData {
  linkId: string;
  linkName: string;
  slug: string;
  isPublic: boolean;
  customMessage: string | null;
  requiresName: boolean;
  workspaceId: string;
  ownerUsername: string;
}

interface UploadsProps {
  linkData: LinkData;
}

/**
 * Uploads - External uploader view for shareable links
 *
 * Used when external users visit foldly.com/{username}/{slug}
 * Allows file uploads without requiring account creation
 *
 * Features (MVP):
 * - Display link name and custom message
 * - Email input (required for tracking)
 * - Optional name and message fields
 * - Drag-and-drop file upload
 * - Upload progress
 * - Success confirmation
 *
 * Access Control:
 * - Public links: Anyone can upload
 * - Dedicated links: Check permissions before allowing upload
 */
export function Uploads({ linkData }: UploadsProps) {
  const { linkName, customMessage, ownerUsername, isPublic } = linkData;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{linkName}</h1>
          <p className="text-muted-foreground">
            Shared by @{ownerUsername}
          </p>
          {customMessage && (
            <p className="mt-4 text-sm text-muted-foreground">
              {customMessage}
            </p>
          )}
        </div>

        {/* Upload Form - TODO: Implement file upload functionality */}
        <div className="space-y-6">
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center">
            <p className="text-muted-foreground">
              File upload functionality coming soon in V2
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {isPublic ? 'Public link - Anyone can upload' : 'Dedicated link - Permission required'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>Powered by Foldly - Email-centric file collection</p>
        </div>
      </Card>
    </div>
  );
}
