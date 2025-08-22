'use server';

import { linkUploadService } from '../services';
import type { ActionResult } from '@/types/actions';

interface ValidatePasswordParams {
  linkId: string;
  password: string;
}

interface ValidatePasswordResult {
  isValid: boolean;
}

export async function validatePasswordAction({
  linkId,
  password,
}: ValidatePasswordParams): Promise<ActionResult<ValidatePasswordResult>> {
  try {
    console.log('🔐 validatePasswordAction: Validating password for linkId:', linkId);

    // Delegate to service layer
    const result = await linkUploadService.validateLinkPassword(linkId, password);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to validate password',
      };
    }

    console.log('✅ validatePasswordAction: Password validation result:', {
      linkId,
      isValid: result.data.isValid,
    });

    return {
      success: true,
      data: {
        isValid: result.data.isValid,
      },
    };
  } catch (error) {
    console.error('❌ validatePasswordAction: Unexpected error:', error);
    return {
      success: false,
      error: 'Failed to validate password',
    };
  }
}