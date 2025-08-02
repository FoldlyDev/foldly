'use server';

import { linkUploadService } from '../services';
import type { ActionResult } from '@/types/actions';

interface ValidatePasswordParams {
  linkId: string;
  password: string;
}

export async function validateLinkPasswordAction({
  linkId,
  password,
}: ValidatePasswordParams): Promise<ActionResult<{ isValid: boolean }>> {
  // Delegate to service layer
  return linkUploadService.validateLinkPassword(linkId, password);
}