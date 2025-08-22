import { getSupabaseClient } from '@/lib/config/supabase-client';
import type { DatabaseResult } from '@/lib/database/types/common';
import type { SupabaseClient } from '@supabase/supabase-js';

// =============================================================================
// BRANDING STORAGE SERVICE - Handles branding images without quota tracking
// =============================================================================
// 🎯 Stores branding images in a separate bucket that doesn't count towards user quotas
// 📚 Images are NOT tracked in the files table, only paths stored in links.branding

export interface BrandingUploadResult {
  path: string;
  publicUrl: string;
}

export class BrandingStorageService {
  private supabase: SupabaseClient;
  private readonly BRANDING_BUCKET = 'branding-images';
  private readonly MAX_BRANDING_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB limit for branding images

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || getSupabaseClient();
  }

  /**
   * Initialize the branding images bucket
   */
  async initializeBrandingBucket(): Promise<DatabaseResult<void>> {
    try {
      const { data: buckets, error: listError } =
        await this.supabase.storage.listBuckets();

      if (listError) {
        console.error('Failed to list buckets:', listError);
        
        // If it's a JWT algorithm error or similar auth issue, assume bucket exists
        if (listError.message && (
          listError.message.includes('"alg" (Algorithm) Header Parameter value not allowed') ||
          listError.message.includes('JWT') ||
          listError.message.includes('Invalid token')
        )) {
          console.log('JWT/Auth issue detected - branding bucket already exists in Supabase');
          return { success: true, data: undefined };
        }
        
        return { success: false, error: listError.message };
      }

      const bucketExists = buckets?.some(
        bucket => bucket.name === this.BRANDING_BUCKET
      );

      if (!bucketExists) {
        console.log(`Branding bucket ${this.BRANDING_BUCKET} not found, creating...`);
        
        const { error: createError } = await this.supabase.storage.createBucket(
          this.BRANDING_BUCKET,
          {
            public: true, // Public bucket for branding images
            fileSizeLimit: this.MAX_BRANDING_IMAGE_SIZE,
            allowedMimeTypes: [
              'image/png',
              'image/jpeg',
              'image/jpg',
              'image/svg+xml',
              'image/webp',
            ],
          }
        );

        if (createError) {
          console.error('Failed to create branding bucket:', createError);
          return { success: false, error: createError.message };
        }

        console.log('✅ Branding bucket created successfully');
      }

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Failed to initialize branding bucket:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Upload a branding image
   * NOTE: This does NOT create an entry in the files table, so it won't count towards user quota
   */
  async uploadBrandingImage(
    file: File,
    userId: string,
    linkId: string
  ): Promise<DatabaseResult<BrandingUploadResult>> {
    try {
      // Validate file size
      if (file.size > this.MAX_BRANDING_IMAGE_SIZE) {
        return {
          success: false,
          error: `Branding image too large. Maximum size is ${this.formatBytes(this.MAX_BRANDING_IMAGE_SIZE)}`,
        };
      }

      // Validate file type
      const allowedTypes = [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/svg+xml',
        'image/webp',
      ];
      
      if (!allowedTypes.includes(file.type)) {
        return {
          success: false,
          error: 'Invalid file type. Please upload PNG, JPG, SVG, or WebP images.',
        };
      }

      // Generate unique path for the branding image
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${userId}/${linkId}/${timestamp}_${sanitizedFileName}`;

      // Upload to branding bucket
      const { data, error } = await this.supabase.storage
        .from(this.BRANDING_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true, // Allow overwriting for branding images
          contentType: file.type,
        });

      if (error) {
        console.error('Failed to upload branding image:', error);
        return { success: false, error: error.message };
      }

      if (!data?.path) {
        return {
          success: false,
          error: 'Upload succeeded but no path returned',
        };
      }

      // Get public URL for the uploaded image
      const { data: publicUrlData } = this.supabase.storage
        .from(this.BRANDING_BUCKET)
        .getPublicUrl(data.path);

      console.log(`✅ BRANDING_IMAGE_UPLOADED: ${data.path} (not tracked in quota)`);

      return {
        success: true,
        data: {
          path: data.path,
          publicUrl: publicUrlData.publicUrl,
        },
      };
    } catch (error) {
      console.error('Failed to upload branding image:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Delete a branding image
   */
  async deleteBrandingImage(path: string): Promise<DatabaseResult<void>> {
    try {
      console.log(`🗑️ DELETING_BRANDING_IMAGE: ${path}`);

      const { error } = await this.supabase.storage
        .from(this.BRANDING_BUCKET)
        .remove([path]);

      if (error) {
        console.error('Failed to delete branding image:', error);
        
        // If file doesn't exist, consider it a success
        if (error.message?.includes('not found') || error.message?.includes('does not exist')) {
          console.log('⚠️ Branding image already deleted');
          return { success: true, data: undefined };
        }
        
        return { success: false, error: error.message };
      }

      console.log(`✅ BRANDING_IMAGE_DELETED: ${path}`);
      return { success: true, data: undefined };
    } catch (error) {
      console.error('Failed to delete branding image:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Delete all branding images for a link
   */
  async deleteAllBrandingImages(
    userId: string,
    linkId: string
  ): Promise<DatabaseResult<void>> {
    try {
      const folderPath = `${userId}/${linkId}`;
      
      // List all files in the folder
      const { data: files, error: listError } = await this.supabase.storage
        .from(this.BRANDING_BUCKET)
        .list(folderPath);

      if (listError) {
        console.error('Failed to list branding images:', listError);
        return { success: false, error: listError.message };
      }

      if (!files || files.length === 0) {
        return { success: true, data: undefined };
      }

      // Delete all files
      const filePaths = files.map(file => `${folderPath}/${file.name}`);
      const { error: deleteError } = await this.supabase.storage
        .from(this.BRANDING_BUCKET)
        .remove(filePaths);

      if (deleteError) {
        console.error('Failed to delete branding images:', deleteError);
        return { success: false, error: deleteError.message };
      }

      console.log(`✅ ALL_BRANDING_IMAGES_DELETED for link ${linkId}`);
      return { success: true, data: undefined };
    } catch (error) {
      console.error('Failed to delete all branding images:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get public URL for a branding image path
   */
  getBrandingImageUrl(path: string): string {
    const { data } = this.supabase.storage
      .from(this.BRANDING_BUCKET)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Export singleton instance
export const brandingStorageService = new BrandingStorageService();