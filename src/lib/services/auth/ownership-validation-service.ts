// =============================================================================
// OWNERSHIP VALIDATION SERVICE - Centralized authorization and ownership checks
// =============================================================================
// 🎯 Purpose: Single source of truth for ownership validation across all features
// 📦 Used by: All server actions that need ownership verification
// 🔧 Pattern: Service class with static methods for easy access

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/database/connection';
import { workspaces, links, files, folders, batches } from '@/lib/database/schemas';
import { eq, and, inArray } from 'drizzle-orm';
import { logger } from '@/lib/services/logging/logger';

// =============================================================================
// TYPES AND ENUMS
// =============================================================================

export enum ResourceType {
  WORKSPACE = 'workspace',
  LINK = 'link',
  FILE = 'file',
  FOLDER = 'folder',
  BATCH = 'batch',
}

export enum PermissionLevel {
  OWNER = 'owner',
  EDITOR = 'editor',
  VIEWER = 'viewer',
  PUBLIC = 'public', // For public link access
}

export interface ValidationResult {
  authorized: boolean;
  resourceOwnerId?: string;
  userId?: string;
  reason?: string;
  permissionLevel?: PermissionLevel;
}

export interface BatchValidationResult {
  allAuthorized: boolean;
  results: Map<string, ValidationResult>;
  authorizedIds: string[];
  unauthorizedIds: string[];
}

// =============================================================================
// OWNERSHIP VALIDATION SERVICE
// =============================================================================

export class OwnershipValidationService {
  /**
   * Validate ownership of any resource type
   * This is the main entry point for single resource validation
   */
  async validateOwnership(
    resourceId: string,
    resourceType: ResourceType,
    requiredLevel: PermissionLevel = PermissionLevel.OWNER
  ): Promise<ValidationResult> {
    try {
      const { userId } = await auth();
      
      if (!userId) {
        logger.warn('Ownership validation failed - no auth', { resourceId, resourceType });
        return { 
          authorized: false, 
          reason: 'Not authenticated',
          permissionLevel: PermissionLevel.PUBLIC 
        };
      }

      // Route to specific validation based on resource type
      switch (resourceType) {
        case ResourceType.WORKSPACE:
          return await this.validateWorkspaceOwnership(resourceId, userId, requiredLevel);
        
        case ResourceType.LINK:
          return await this.validateLinkOwnership(resourceId, userId, requiredLevel);
        
        case ResourceType.FILE:
          return await this.validateFileOwnership(resourceId, userId, requiredLevel);
        
        case ResourceType.FOLDER:
          return await this.validateFolderOwnership(resourceId, userId, requiredLevel);
        
        case ResourceType.BATCH:
          return await this.validateSingleBatchOwnership(resourceId, userId, requiredLevel);
        
        default:
          logger.error('Invalid resource type for validation', undefined, { resourceType });
          return { 
            authorized: false, 
            reason: 'Invalid resource type' 
          };
      }
    } catch (error) {
      logger.error('Ownership validation error', error, { resourceId, resourceType });
      return { 
        authorized: false, 
        reason: 'Validation error occurred' 
      };
    }
  }

  /**
   * Batch validate multiple resources of the same type
   * Optimized for performance with single database query
   */
  async validateMultipleResources(
    resourceIds: string[],
    resourceType: ResourceType,
    requiredLevel: PermissionLevel = PermissionLevel.OWNER
  ): Promise<BatchValidationResult> {
    const results = new Map<string, ValidationResult>();
    
    if (resourceIds.length === 0) {
      return {
        allAuthorized: true,
        results,
        authorizedIds: [],
        unauthorizedIds: [],
      };
    }

    try {
      const { userId } = await auth();
      
      if (!userId) {
        // Mark all as unauthorized if not authenticated
        resourceIds.forEach(id => 
          results.set(id, { 
            authorized: false, 
            reason: 'Not authenticated',
            permissionLevel: PermissionLevel.PUBLIC 
          })
        );
        
        return {
          allAuthorized: false,
          results,
          authorizedIds: [],
          unauthorizedIds: resourceIds,
        };
      }

      // Get all resources in one query based on type
      const resources = await this.getBatchResources(resourceIds, resourceType);
      
      const authorizedIds: string[] = [];
      const unauthorizedIds: string[] = [];
      
      // Process each resource
      for (const id of resourceIds) {
        const resource = resources.get(id);
        
        if (!resource) {
          results.set(id, {
            authorized: false,
            reason: 'Resource not found',
            userId,
          });
          unauthorizedIds.push(id);
          continue;
        }

        const isAuthorized = this.checkResourceOwnership(resource, userId, resourceType, requiredLevel);
        
        results.set(id, {
          authorized: isAuthorized,
          resourceOwnerId: this.getResourceOwnerId(resource, resourceType),
          userId,
          permissionLevel: isAuthorized ? PermissionLevel.OWNER : PermissionLevel.VIEWER,
        });
        
        if (isAuthorized) {
          authorizedIds.push(id);
        } else {
          unauthorizedIds.push(id);
        }
      }

      return {
        allAuthorized: unauthorizedIds.length === 0,
        results,
        authorizedIds,
        unauthorizedIds,
      };
    } catch (error) {
      logger.error('Batch ownership validation error', error, { resourceIds, resourceType });
      
      // Mark all as unauthorized on error
      resourceIds.forEach(id => 
        results.set(id, { 
          authorized: false, 
          reason: 'Validation error occurred' 
        })
      );
      
      return {
        allAuthorized: false,
        results,
        authorizedIds: [],
        unauthorizedIds: resourceIds,
      };
    }
  }

  /**
   * Check if user can perform specific action on resource
   * Maps actions to required permission levels
   */
  async canPerformAction(
    action: 'read' | 'write' | 'delete' | 'share',
    resourceId: string,
    resourceType: ResourceType
  ): Promise<boolean> {
    const requiredLevel = this.getRequiredPermissionLevel(action);
    const result = await this.validateOwnership(resourceId, resourceType, requiredLevel);
    return result.authorized;
  }

  // =============================================================================
  // PRIVATE VALIDATION METHODS
  // =============================================================================

  private async validateWorkspaceOwnership(
    workspaceId: string,
    userId: string,
    requiredLevel: PermissionLevel
  ): Promise<ValidationResult> {
    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, workspaceId),
    });
    
    if (!workspace) {
      return {
        authorized: false,
        reason: 'Workspace not found',
        userId,
      };
    }
    
    const isOwner = workspace.userId === userId;
    const authorized = this.hasRequiredPermission(
      isOwner ? PermissionLevel.OWNER : PermissionLevel.PUBLIC,
      requiredLevel
    );
    
    return {
      authorized,
      resourceOwnerId: workspace.userId,
      userId,
      permissionLevel: isOwner ? PermissionLevel.OWNER : PermissionLevel.PUBLIC,
    };
  }

  private async validateLinkOwnership(
    linkId: string,
    userId: string,
    requiredLevel: PermissionLevel
  ): Promise<ValidationResult> {
    const link = await db.query.links.findFirst({
      where: eq(links.id, linkId),
    });
    
    if (!link) {
      return {
        authorized: false,
        reason: 'Link not found',
        userId,
      };
    }
    
    const isOwner = link.userId === userId;
    const authorized = this.hasRequiredPermission(
      isOwner ? PermissionLevel.OWNER : PermissionLevel.PUBLIC,
      requiredLevel
    );
    
    return {
      authorized,
      resourceOwnerId: link.userId,
      userId,
      permissionLevel: isOwner ? PermissionLevel.OWNER : PermissionLevel.PUBLIC,
    };
  }

  private async validateFileOwnership(
    fileId: string,
    userId: string,
    requiredLevel: PermissionLevel
  ): Promise<ValidationResult> {
    const file = await db.query.files.findFirst({
      where: eq(files.id, fileId),
      with: {
        workspace: true,
        link: true,
      },
    });
    
    if (!file) {
      return {
        authorized: false,
        reason: 'File not found',
        userId,
      };
    }
    
    // Check ownership through workspace
    if (file.workspace) {
      const isOwner = file.workspace.userId === userId;
      return {
        authorized: this.hasRequiredPermission(
          isOwner ? PermissionLevel.OWNER : PermissionLevel.PUBLIC,
          requiredLevel
        ),
        resourceOwnerId: file.workspace.userId,
        userId,
        permissionLevel: isOwner ? PermissionLevel.OWNER : PermissionLevel.PUBLIC,
      };
    }
    
    // Check ownership through link
    if (file.link) {
      const isOwner = file.link.userId === userId;
      return {
        authorized: this.hasRequiredPermission(
          isOwner ? PermissionLevel.OWNER : PermissionLevel.PUBLIC,
          requiredLevel
        ),
        resourceOwnerId: file.link.userId,
        userId,
        permissionLevel: isOwner ? PermissionLevel.OWNER : PermissionLevel.PUBLIC,
      };
    }
    
    return {
      authorized: false,
      reason: 'File has no owner context',
      userId,
    };
  }

  private async validateFolderOwnership(
    folderId: string,
    userId: string,
    requiredLevel: PermissionLevel
  ): Promise<ValidationResult> {
    const folder = await db.query.folders.findFirst({
      where: eq(folders.id, folderId),
      with: {
        workspace: true,
        link: true,
      },
    });
    
    if (!folder) {
      return {
        authorized: false,
        reason: 'Folder not found',
        userId,
      };
    }
    
    // Check ownership through workspace
    if (folder.workspace) {
      const isOwner = folder.workspace.userId === userId;
      return {
        authorized: this.hasRequiredPermission(
          isOwner ? PermissionLevel.OWNER : PermissionLevel.PUBLIC,
          requiredLevel
        ),
        resourceOwnerId: folder.workspace.userId,
        userId,
        permissionLevel: isOwner ? PermissionLevel.OWNER : PermissionLevel.PUBLIC,
      };
    }
    
    // Check ownership through link
    if (folder.link) {
      const isOwner = folder.link.userId === userId;
      return {
        authorized: this.hasRequiredPermission(
          isOwner ? PermissionLevel.OWNER : PermissionLevel.PUBLIC,
          requiredLevel
        ),
        resourceOwnerId: folder.link.userId,
        userId,
        permissionLevel: isOwner ? PermissionLevel.OWNER : PermissionLevel.PUBLIC,
      };
    }
    
    return {
      authorized: false,
      reason: 'Folder has no owner context',
      userId,
    };
  }

  private async validateSingleBatchOwnership(
    batchId: string,
    userId: string,
    requiredLevel: PermissionLevel
  ): Promise<ValidationResult> {
    const batch = await db.query.batches.findFirst({
      where: eq(batches.id, batchId),
      with: {
        link: true,
      },
    });
    
    if (!batch) {
      return {
        authorized: false,
        reason: 'Batch not found',
        userId,
      };
    }
    
    // Batches are owned through their links
    if (batch.link) {
      const isOwner = batch.link.userId === userId;
      return {
        authorized: this.hasRequiredPermission(
          isOwner ? PermissionLevel.OWNER : PermissionLevel.PUBLIC,
          requiredLevel
        ),
        resourceOwnerId: batch.link.userId,
        userId,
        permissionLevel: isOwner ? PermissionLevel.OWNER : PermissionLevel.PUBLIC,
      };
    }
    
    return {
      authorized: false,
      reason: 'Batch has no owner context',
      userId,
    };
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  private async getBatchResources(
    resourceIds: string[],
    resourceType: ResourceType
  ): Promise<Map<string, any>> {
    const resourceMap = new Map();
    
    try {
      switch (resourceType) {
        case ResourceType.WORKSPACE: {
          const resources = await db.query.workspaces.findMany({
            where: inArray(workspaces.id, resourceIds),
          });
          resources.forEach(r => resourceMap.set(r.id, r));
          break;
        }
        
        case ResourceType.LINK: {
          const resources = await db.query.links.findMany({
            where: inArray(links.id, resourceIds),
          });
          resources.forEach(r => resourceMap.set(r.id, r));
          break;
        }
        
        case ResourceType.FILE: {
          const resources = await db.query.files.findMany({
            where: inArray(files.id, resourceIds),
            with: {
              workspace: true,
              link: true,
            },
          });
          resources.forEach(r => resourceMap.set(r.id, r));
          break;
        }
        
        case ResourceType.FOLDER: {
          const resources = await db.query.folders.findMany({
            where: inArray(folders.id, resourceIds),
            with: {
              workspace: true,
              link: true,
            },
          });
          resources.forEach(r => resourceMap.set(r.id, r));
          break;
        }
        
        case ResourceType.BATCH: {
          const resources = await db.query.batches.findMany({
            where: inArray(batches.id, resourceIds),
            with: {
              link: true,
            },
          });
          resources.forEach(r => resourceMap.set(r.id, r));
          break;
        }
      }
    } catch (error) {
      logger.error('Failed to fetch batch resources', error, { resourceIds, resourceType });
    }
    
    return resourceMap;
  }

  private checkResourceOwnership(
    resource: any,
    userId: string,
    resourceType: ResourceType,
    requiredLevel: PermissionLevel
  ): boolean {
    const ownerId = this.getResourceOwnerId(resource, resourceType);
    
    if (!ownerId) {
      return false;
    }
    
    const isOwner = ownerId === userId;
    const currentLevel = isOwner ? PermissionLevel.OWNER : PermissionLevel.PUBLIC;
    
    return this.hasRequiredPermission(currentLevel, requiredLevel);
  }

  private getResourceOwnerId(resource: any, resourceType: ResourceType): string | undefined {
    switch (resourceType) {
      case ResourceType.WORKSPACE:
      case ResourceType.LINK:
        return resource.userId;
      
      case ResourceType.FILE:
      case ResourceType.FOLDER:
        return resource.workspace?.userId || resource.link?.userId;
      
      case ResourceType.BATCH:
        return resource.link?.userId;
      
      default:
        return undefined;
    }
  }

  private getRequiredPermissionLevel(action: string): PermissionLevel {
    switch (action) {
      case 'delete':
      case 'share':
        return PermissionLevel.OWNER;
      
      case 'write':
        return PermissionLevel.EDITOR;
      
      case 'read':
        return PermissionLevel.VIEWER;
      
      default:
        return PermissionLevel.OWNER;
    }
  }

  private hasRequiredPermission(
    currentLevel: PermissionLevel,
    requiredLevel: PermissionLevel
  ): boolean {
    const levels = {
      [PermissionLevel.PUBLIC]: 0,
      [PermissionLevel.VIEWER]: 1,
      [PermissionLevel.EDITOR]: 2,
      [PermissionLevel.OWNER]: 3,
    };
    
    return levels[currentLevel] >= levels[requiredLevel];
  }
}

// =============================================================================
// EXPORT SINGLETON INSTANCE
// =============================================================================

export const ownershipValidator = new OwnershipValidationService();

// Export convenience functions for common use cases
export async function validateLinkOwnership(linkId: string): Promise<ValidationResult> {
  return ownershipValidator.validateOwnership(linkId, ResourceType.LINK);
}

export async function validateWorkspaceOwnership(workspaceId: string): Promise<ValidationResult> {
  return ownershipValidator.validateOwnership(workspaceId, ResourceType.WORKSPACE);
}

export async function validateFileOwnership(fileId: string): Promise<ValidationResult> {
  return ownershipValidator.validateOwnership(fileId, ResourceType.FILE);
}

export async function canDeleteResource(
  resourceId: string,
  resourceType: ResourceType
): Promise<boolean> {
  return ownershipValidator.canPerformAction('delete', resourceId, resourceType);
}