/**
 * Link Notifications - Pure utility functions for link notifications
 */

import { Link2, ExternalLink, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { showInteractiveToast } from '../components';

interface GeneratedLinkNotificationData {
  linkId: string;
  linkUrl: string;
  folderName: string;
}

/**
 * Show interactive notification for generated links
 */
export function showGeneratedLinkNotification(data: GeneratedLinkNotificationData): void {
  showInteractiveToast({
    title: 'Link Generated',
    description: `${data.folderName} - ${data.linkUrl}`,
    icon: Link2,
    iconColor: 'text-primary',
    actions: [
      {
        label: 'Visit Link',
        onClick: () => {
          window.open(data.linkUrl, '_blank');
        },
        variant: 'primary',
        icon: ExternalLink,
      },
      {
        label: 'Copy',
        onClick: async () => {
          try {
            await navigator.clipboard.writeText(data.linkUrl);
            toast.success('Link copied to clipboard');
          } catch (error) {
            console.error('Failed to copy link:', error);
            toast.error('Failed to copy link');
          }
        },
        variant: 'secondary',
        icon: Copy,
      }
    ],
    duration: 10000,
  });
}