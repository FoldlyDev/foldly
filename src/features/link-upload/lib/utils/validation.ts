import type { LinkWithOwner } from '../../types';
import { checkStorageAvailableAction } from '../actions/check-storage';

interface ValidationResult {
  valid: boolean;
  error?: string;
}

export async function validateFiles(
  files: File[],
  link: LinkWithOwner
): Promise<ValidationResult> {
  // Check file count
  if (files.length > link.max_files) {
    return {
      valid: false,
      error: `Maximum ${link.max_files} files allowed`,
    };
  }

  // Check individual file sizes
  const maxFileSize = Math.min(link.max_file_size, link.subscription.maxFileSize);
  const oversizedFiles = files.filter(file => file.size > maxFileSize);
  
  if (oversizedFiles.length > 0) {
    return {
      valid: false,
      error: `File "${oversizedFiles[0].name}" exceeds maximum size of ${maxFileSize / (1024 * 1024)}MB`,
    };
  }

  // Check file types if restricted
  if (link.allowed_file_types && Array.isArray(link.allowed_file_types)) {
    const invalidFiles = files.filter(file => {
      const fileType = file.type;
      return !(link.allowed_file_types as string[]).includes(fileType);
    });

    if (invalidFiles.length > 0) {
      return {
        valid: false,
        error: `File type "${invalidFiles[0].type}" is not allowed`,
      };
    }
  }

  // Check storage availability
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const storageCheck = await checkStorageAvailableAction({
    userId: link.owner.id,
    requiredSpace: totalSize,
  });

  if (!storageCheck.success || !storageCheck.data?.hasSpace) {
    return {
      valid: false,
      error: 'Insufficient storage space available',
    };
  }

  return { valid: true };
}

export function validateUploaderInfo(
  name: string,
  email: string | undefined,
  requireEmail: boolean
): ValidationResult {
  if (!name || name.trim().length < 2) {
    return {
      valid: false,
      error: 'Name must be at least 2 characters',
    };
  }

  if (requireEmail) {
    if (!email) {
      return {
        valid: false,
        error: 'Email is required',
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        valid: false,
        error: 'Invalid email address',
      };
    }
  }

  return { valid: true };
}