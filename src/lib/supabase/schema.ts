// Supabase Database Schema for Foldly MVP
// Simplified design with root folder support and no folder colors

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string; // UUID - Clerk user ID
          email: string;
          username: string;
          first_name: string | null;
          last_name: string | null;
          avatar_url: string | null;
          subscription_tier: 'free' | 'pro' | 'business' | 'enterprise';
          storage_used: number;
          storage_limit: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          username: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: 'free' | 'pro' | 'business' | 'enterprise';
          storage_used?: number;
          storage_limit?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: 'free' | 'pro' | 'business' | 'enterprise';
          storage_used?: number;
          storage_limit?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      workspaces: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
        };
      };
      links: {
        Row: {
          id: string;
          user_id: string;
          workspace_id: string;
          slug: string;
          topic: string | null;
          link_type: 'base' | 'custom' | 'generated';
          title: string;
          description: string | null;
          require_email: boolean;
          require_password: boolean;
          password_hash: string | null;
          is_public: boolean;
          is_active: boolean;
          max_files: number;
          max_file_size: number;
          expires_at: string | null;
          brand_enabled: boolean;
          brand_color: string | null;
          total_uploads: number;
          total_files: number;
          total_size: number;
          last_upload_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          workspace_id: string;
          slug: string;
          topic?: string | null;
          link_type?: 'base' | 'custom' | 'generated';
          title: string;
          description?: string | null;
          require_email?: boolean;
          require_password?: boolean;
          password_hash?: string | null;
          is_public?: boolean;
          is_active?: boolean;
          max_files?: number;
          max_file_size?: number;
          expires_at?: string | null;
          brand_enabled?: boolean;
          brand_color?: string | null;
          total_uploads?: number;
          total_files?: number;
          total_size?: number;
          last_upload_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          workspace_id?: string;
          slug?: string;
          topic?: string | null;
          link_type?: 'base' | 'custom' | 'generated';
          title?: string;
          description?: string | null;
          require_email?: boolean;
          require_password?: boolean;
          password_hash?: string | null;
          is_public?: boolean;
          is_active?: boolean;
          max_files?: number;
          max_file_size?: number;
          expires_at?: string | null;
          brand_enabled?: boolean;
          brand_color?: string | null;
          total_uploads?: number;
          total_files?: number;
          total_size?: number;
          last_upload_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      folders: {
        Row: {
          id: string;
          user_id: string;
          workspace_id: string;
          parent_folder_id: string | null;
          link_id: string | null;
          name: string;
          path: string;
          depth: number;
          is_archived: boolean;
          is_public: boolean;
          sort_order: number;
          file_count: number;
          total_size: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          workspace_id: string;
          parent_folder_id?: string | null;
          link_id?: string | null;
          name: string;
          path: string;
          depth?: number;
          is_archived?: boolean;
          is_public?: boolean;
          sort_order?: number;
          file_count?: number;
          total_size?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          workspace_id?: string;
          parent_folder_id?: string | null;
          link_id?: string | null;
          name?: string;
          path?: string;
          depth?: number;
          is_archived?: boolean;
          is_public?: boolean;
          sort_order?: number;
          file_count?: number;
          total_size?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      batches: {
        Row: {
          id: string;
          link_id: string;
          user_id: string;
          folder_id: string | null;
          uploader_name: string;
          uploader_email: string | null;
          uploader_message: string | null;
          name: string | null;
          display_name: string | null;
          status: 'uploading' | 'processing' | 'completed' | 'failed';
          total_files: number;
          processed_files: number;
          total_size: number;
          upload_completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          link_id: string;
          user_id: string;
          folder_id?: string | null;
          uploader_name: string;
          uploader_email?: string | null;
          uploader_message?: string | null;
          name?: string | null;
          display_name?: string | null;
          status?: 'uploading' | 'processing' | 'completed' | 'failed';
          total_files?: number;
          processed_files?: number;
          total_size?: number;
          upload_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          link_id?: string;
          user_id?: string;
          folder_id?: string | null;
          uploader_name?: string;
          uploader_email?: string | null;
          uploader_message?: string | null;
          name?: string | null;
          display_name?: string | null;
          status?: 'uploading' | 'processing' | 'completed' | 'failed';
          total_files?: number;
          processed_files?: number;
          total_size?: number;
          upload_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      files: {
        Row: {
          id: string;
          link_id: string;
          batch_id: string;
          user_id: string;
          folder_id: string | null; // NULL for root folder files
          file_name: string;
          original_name: string;
          file_size: number;
          mime_type: string;
          extension: string | null;
          storage_path: string;
          storage_provider: string;
          checksum: string | null;
          is_safe: boolean;
          virus_scan_result: string;
          processing_status: 'pending' | 'processing' | 'completed' | 'failed';
          thumbnail_path: string | null;
          is_organized: boolean;
          needs_review: boolean;
          download_count: number;
          last_accessed_at: string | null;
          uploaded_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          link_id: string;
          batch_id: string;
          user_id: string;
          folder_id?: string | null;
          file_name: string;
          original_name: string;
          file_size: number;
          mime_type: string;
          extension?: string | null;
          storage_path: string;
          storage_provider?: string;
          checksum?: string | null;
          is_safe?: boolean;
          virus_scan_result?: string;
          processing_status?: 'pending' | 'processing' | 'completed' | 'failed';
          thumbnail_path?: string | null;
          is_organized?: boolean;
          needs_review?: boolean;
          download_count?: number;
          last_accessed_at?: string | null;
          uploaded_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          link_id?: string;
          batch_id?: string;
          user_id?: string;
          folder_id?: string | null;
          file_name?: string;
          original_name?: string;
          file_size?: number;
          mime_type?: string;
          extension?: string | null;
          storage_path?: string;
          storage_provider?: string;
          checksum?: string | null;
          is_safe?: boolean;
          virus_scan_result?: string;
          processing_status?: 'pending' | 'processing' | 'completed' | 'failed';
          thumbnail_path?: string | null;
          is_organized?: boolean;
          needs_review?: boolean;
          download_count?: number;
          last_accessed_at?: string | null;
          uploaded_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      link_type: 'base' | 'custom' | 'generated';
      file_processing_status: 'pending' | 'processing' | 'completed' | 'failed';
      batch_status: 'uploading' | 'processing' | 'completed' | 'failed';
      subscription_tier: 'free' | 'pro' | 'business' | 'enterprise';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Type helpers for easier usage
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Specific table types
export type User = Tables<'users'>;
export type Workspace = Tables<'workspaces'>;
export type Link = Tables<'links'>;
export type Folder = Tables<'folders'>;
export type Batch = Tables<'batches'>;
export type File = Tables<'files'>;

// Insert types
export type UserInsert = TablesInsert<'users'>;
export type WorkspaceInsert = TablesInsert<'workspaces'>;
export type LinkInsert = TablesInsert<'links'>;
export type FolderInsert = TablesInsert<'folders'>;
export type BatchInsert = TablesInsert<'batches'>;
export type FileInsert = TablesInsert<'files'>;

// Update types
export type UserUpdate = TablesUpdate<'users'>;
export type WorkspaceUpdate = TablesUpdate<'workspaces'>;
export type LinkUpdate = TablesUpdate<'links'>;
export type FolderUpdate = TablesUpdate<'folders'>;
export type BatchUpdate = TablesUpdate<'batches'>;
export type FileUpdate = TablesUpdate<'files'>;
