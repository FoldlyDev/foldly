import { eq } from 'drizzle-orm';
import { db } from '@/lib/database/connection';
import { links } from '@/lib/database/schemas';

/**
 * Service for managing folder-link relationships
 */
export class LinkFolderService {
  /**
   * Check if a folder already has a generated link
   */
  async checkFolderHasGeneratedLink(folderId: string): Promise<boolean> {
    try {
      const existingLink = await db.query.links.findFirst({
        where: eq(links.sourceFolderId, folderId),
      });
      return !!existingLink;
    } catch (error) {
      console.error('Error checking folder generated link:', error);
      return false;
    }
  }
}

export const linkFolderService = new LinkFolderService();