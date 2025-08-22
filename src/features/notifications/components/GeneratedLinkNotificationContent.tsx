'use client';

import { useRouter } from 'next/navigation';
import { Link2, ExternalLink, Copy, XIcon } from 'lucide-react';
import { toast } from 'sonner';

interface GeneratedLinkNotificationContentProps {
  toastId: string | number;
  linkId: string;
  linkUrl: string;
  folderName: string;
}

export function GeneratedLinkNotificationContent({
  toastId,
  linkId,
  linkUrl,
  folderName,
}: GeneratedLinkNotificationContentProps) {
  const router = useRouter();
  
  const handleViewLink = () => {
    // Open the actual link in a new tab
    window.open(linkUrl, '_blank');
    toast.dismiss(toastId);
  };
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(linkUrl);
      toast.success('Link copied to clipboard');
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error('Failed to copy link');
    }
  };
  
  const handleDismiss = () => {
    toast.dismiss(toastId);
  };

  return (
    <div className="flex flex-col gap-3 w-full max-w-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Link2 className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">Link Generated</p>
            <p className="text-sm text-muted-foreground truncate">
              {folderName}
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>
      
      {/* Link URL */}
      <div className="bg-muted/50 rounded-md px-3 py-2">
        <p className="text-xs text-muted-foreground truncate font-mono">
          {linkUrl}
        </p>
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleViewLink}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <ExternalLink className="w-4 h-4" />
          Visit Link
        </button>
        <button
          onClick={handleCopyLink}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors text-sm font-medium"
        >
          <Copy className="w-4 h-4" />
          Copy
        </button>
      </div>
    </div>
  );
}