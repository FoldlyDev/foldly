'use server';

import { db } from '@/lib/database/connection';
import { links } from '@/lib/database/schemas';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import type { ActionResult } from '@/types/actions';

interface ValidatePasswordParams {
  linkId: string;
  password: string;
}

export async function validateLinkPasswordAction({
  linkId,
  password,
}: ValidatePasswordParams): Promise<ActionResult<{ isValid: boolean }>> {
  try {
    // Get link password hash
    const linkResult = await db
      .select({
        password_hash: links.password_hash,
      })
      .from(links)
      .where(eq(links.id, linkId))
      .limit(1);

    if (linkResult.length === 0) {
      return {
        success: false,
        error: 'Link not found',
      };
    }

    const { password_hash } = linkResult[0];

    if (!password_hash) {
      return {
        success: true,
        data: { isValid: true }, // No password required
      };
    }

    // Validate password
    const isValid = await bcrypt.compare(password, password_hash);

    return {
      success: true,
      data: { isValid },
    };
  } catch (error) {
    console.error('Error validating password:', error);
    return {
      success: false,
      error: 'Failed to validate password',
    };
  }
}