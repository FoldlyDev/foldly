'use server';

import { linkUploadService } from '../services';
import type { LinkWithOwner } from '../../types';
import type { ActionResult } from '@/types/actions';

interface ValidateLinkAccessParams {
  slugParts: string[];
}

export async function validateLinkAccessAction({
  slugParts,
}: ValidateLinkAccessParams): Promise<ActionResult<LinkWithOwner>> {
  // Delegate to service layer
  return linkUploadService.validateLinkAccess(slugParts);
}