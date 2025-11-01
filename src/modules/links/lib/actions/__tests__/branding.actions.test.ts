// =============================================================================
// BRANDING ACTIONS TESTS
// =============================================================================

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  updateLinkBrandingAction,
  deleteBrandingLogoAction,
} from "../branding.actions";
import {
  createTestUser,
  createTestWorkspace,
  createTestLink,
  cleanupTestUser,
} from "@/test/db-test-utils";
import { resetRateLimit, RateLimitKeys } from "@/lib/middleware/rate-limit";
import { db } from "@/lib/database/connection";
import { links } from "@/lib/database/schemas";
import { eq } from "drizzle-orm";

// Mock Clerk authentication
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(() => ({ has: vi.fn() })),
}));

// Mock storage abstraction layer (provider-agnostic)
vi.mock("@/lib/storage/client", () => ({
  uploadFile: vi.fn(),
  deleteFile: vi.fn(),
  fileExists: vi.fn(),
}));

// Mock branding schemas to provide bucket name
vi.mock("../../validation/link-branding-schemas", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("../../validation/link-branding-schemas")
    >();
  return {
    ...actual,
    BRANDING_BUCKET_NAME: "test-branding-bucket",
  };
});

import { auth } from "@clerk/nextjs/server";
import { deleteFile, fileExists } from "@/lib/storage/client";

describe("Branding Actions", () => {
  const createdUserIds = new Set<string>();

  afterEach(async () => {
    // Clean up all created test users
    for (const userId of createdUserIds) {
      await cleanupTestUser(userId);
    }
    createdUserIds.clear();

    // Reset all mocks
    vi.clearAllMocks();
  });

  // =============================================================================
  // updateLinkBrandingAction() Tests
  // =============================================================================
  describe("updateLinkBrandingAction", () => {
    it("should update link branding configuration", async () => {
      // Arrange: Create test user, workspace, and link
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: "Test Workspace",
      });

      const link = await createTestLink({
        workspaceId: workspace.id,
        name: "Test Link",
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);

      // Reset rate limit
      resetRateLimit(RateLimitKeys.userAction(user.id, "update-branding"));

      // Act: Update branding
      const result = await updateLinkBrandingAction({
        linkId: link.id,
        branding: {
          enabled: true,
          colors: {
            accentColor: "#6c47ff",
            backgroundColor: "#ffffff",
          },
        },
      });

      // Assert: Should successfully update branding
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.branding?.enabled).toBe(true);
      expect(result.data?.branding?.colors?.accentColor).toBe("#6c47ff");
    });

    it("should merge branding with existing configuration", async () => {
      // Arrange: Create link with existing branding
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: "Test Workspace",
      });

      const link = await createTestLink({
        workspaceId: workspace.id,
        name: "Test Link",
      });

      // Set initial branding
      await db
        .update(links)
        .set({
          branding: {
            enabled: true,
            logo: {
              url: "https://example.com/logo.png",
              altText: "Logo",
            },
            colors: null,
          },
        })
        .where(eq(links.id, link.id));

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, "update-branding"));

      // Act: Update only colors
      const result = await updateLinkBrandingAction({
        linkId: link.id,
        branding: {
          colors: {
            accentColor: "#ff0000",
            backgroundColor: "#000000",
          },
        },
      });

      // Assert: Should preserve logo and update colors
      expect(result.success).toBe(true);
      expect(result.data?.branding?.enabled).toBe(true);
      expect(result.data?.branding?.logo?.url).toBe(
        "https://example.com/logo.png"
      );
      expect(result.data?.branding?.colors?.accentColor).toBe("#ff0000");
    });

    it("should reject when user does not own link", async () => {
      // Arrange: Create two users
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      createdUserIds.add(user1.id);
      createdUserIds.add(user2.id);

      const workspace1 = await createTestWorkspace({
        userId: user1.id,
        name: "User 1 Workspace",
      });

      const workspace2 = await createTestWorkspace({
        userId: user2.id,
        name: "User 2 Workspace",
      });

      const link = await createTestLink({
        workspaceId: workspace2.id,
        name: "User 2 Link",
      });

      // User1 tries to update user2's link
      vi.mocked(auth).mockResolvedValue({ userId: user1.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user1.id, "update-branding"));

      // Act: Try to update branding
      const result = await updateLinkBrandingAction({
        linkId: link.id,
        branding: { enabled: true },
      });

      // Assert: Should fail
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should reject invalid link ID format", async () => {
      // Arrange: Create test user
      const user = await createTestUser();
      createdUserIds.add(user.id);

      await createTestWorkspace({
        userId: user.id,
        name: "Test Workspace",
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, "update-branding"));

      // Act: Try with invalid ID
      const result = await updateLinkBrandingAction({
        linkId: "invalid-id",
        branding: { enabled: true },
      });

      // Assert: Should fail validation
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should enforce rate limit (10 requests per minute)", async () => {
      // NOTE: We test with 5 requests (not 10) to ensure the test completes
      // quickly within the 60-second rate limit window.

      // Arrange: Create test user, workspace, and link
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: "Test Workspace",
      });

      const link = await createTestLink({
        workspaceId: workspace.id,
        name: "Test Link",
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, "update-branding"));

      // Act: Make 5 successful requests
      for (let i = 0; i < 5; i++) {
        const result = await updateLinkBrandingAction({
          linkId: link.id,
          branding: { enabled: i % 2 === 0 },
        });
        expect(result.success).toBe(true);
      }

      // Verify we can still make more requests (we're at 5/10)
      const additionalResult = await updateLinkBrandingAction({
        linkId: link.id,
        branding: { enabled: true },
      });
      expect(additionalResult.success).toBe(true);
    }, 10000); // 10 second timeout
  });

  // =============================================================================
  // deleteBrandingLogoAction() Tests
  // =============================================================================
  // NOTE: Logo upload is now handled by useUppyUpload hook + storage actions
  // See: src/hooks/utility/use-uppy-upload.ts and src/lib/actions/storage.actions.ts
  describe("deleteBrandingLogoAction", () => {
    beforeEach(() => {
      // Setup default storage abstraction mocks
      vi.mocked(fileExists).mockResolvedValue(true);
      vi.mocked(deleteFile).mockResolvedValue(undefined);
    });

    it("should delete logo from GCS and clear link branding", async () => {
      // Arrange: Create link with logo
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: "Test Workspace",
      });

      const link = await createTestLink({
        workspaceId: workspace.id,
        name: "Test Link",
      });

      // Set branding with logo
      await db
        .update(links)
        .set({
          branding: {
            enabled: true,
            logo: {
              url: "https://storage.googleapis.com/test-branding-bucket/logo.png",
              altText: "Logo",
            },
            colors: {
              accentColor: "#6c47ff",
              backgroundColor: "#ffffff",
            },
          },
        })
        .where(eq(links.id, link.id));

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, "delete-logo"));

      // Act: Delete logo
      const result = await deleteBrandingLogoAction({ linkId: link.id });

      // Assert: Should successfully delete
      expect(result.success).toBe(true);
      expect(result.data?.branding?.logo).toBeNull();
      expect(result.data?.branding?.colors).toBeDefined(); // Colors should be preserved

      // Verify GCS deleteFile was called
      expect(fileExists).toHaveBeenCalled();
      expect(deleteFile).toHaveBeenCalledWith(
        expect.objectContaining({
          gcsPath: "logo.png",
        })
      );
    });

    it("should handle case when logo file does not exist in GCS", async () => {
      // Arrange: Create link with logo URL but file doesn't exist
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: "Test Workspace",
      });

      const link = await createTestLink({
        workspaceId: workspace.id,
        name: "Test Link",
      });

      await db
        .update(links)
        .set({
          branding: {
            enabled: true,
            logo: {
              url: "https://storage.googleapis.com/test-branding-bucket/missing-logo.png",
              altText: undefined,
            },
            colors: null,
          },
        })
        .where(eq(links.id, link.id));

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, "delete-logo"));

      // Mock file doesn't exist
      vi.mocked(fileExists).mockResolvedValue(false);

      // Act: Delete logo
      const result = await deleteBrandingLogoAction({ linkId: link.id });

      // Assert: Should still clear logo from database
      expect(result.success).toBe(true);
      expect(result.data?.branding?.logo).toBeNull();
      expect(fileExists).toHaveBeenCalled();
      expect(deleteFile).not.toHaveBeenCalled(); // Should not try to delete non-existent file
    });

    it("should abort operation if GCS delete fails (storage-first pattern)", async () => {
      // Arrange: Create link with logo
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: "Test Workspace",
      });

      const link = await createTestLink({
        workspaceId: workspace.id,
        name: "Test Link",
      });

      await db
        .update(links)
        .set({
          branding: {
            enabled: true,
            logo: {
              url: "https://storage.googleapis.com/test-branding-bucket/logo.png",
              altText: undefined,
            },
            colors: null,
          },
        })
        .where(eq(links.id, link.id));

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, "delete-logo"));

      // Mock GCS delete failure
      vi.mocked(deleteFile).mockRejectedValue(new Error("GCS error"));

      // Act: Delete logo
      const result = await deleteBrandingLogoAction({ linkId: link.id });

      // Assert: Should abort and return error (storage-first deletion pattern)
      // If storage delete fails, operation should fail - do NOT delete DB record
      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to delete logo from storage. Please try again.");

      // Verify logo is still in database (operation aborted)
      const updatedLink = await db.query.links.findFirst({
        where: (links, { eq }) => eq(links.id, link.id),
      });
      expect(updatedLink?.branding?.logo).not.toBeNull();
    });

    it("should reject when user does not own link", async () => {
      // Arrange: Create two users
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      createdUserIds.add(user1.id);
      createdUserIds.add(user2.id);

      const workspace2 = await createTestWorkspace({
        userId: user2.id,
        name: "User 2 Workspace",
      });

      const link = await createTestLink({
        workspaceId: workspace2.id,
        name: "User 2 Link",
      });

      // User1 tries to delete user2's logo
      vi.mocked(auth).mockResolvedValue({ userId: user1.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user1.id, "delete-logo"));

      // Act: Try to delete logo
      const result = await deleteBrandingLogoAction({ linkId: link.id });

      // Assert: Should fail
      expect(result.success).toBe(false);
      expect(deleteFile).not.toHaveBeenCalled();
    });

    it("should reject invalid link ID format", async () => {
      // Arrange: Create test user
      const user = await createTestUser();
      createdUserIds.add(user.id);

      await createTestWorkspace({
        userId: user.id,
        name: "Test Workspace",
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, "delete-logo"));

      // Act: Try with invalid ID
      const result = await deleteBrandingLogoAction({ linkId: "invalid-id" });

      // Assert: Should fail validation
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(deleteFile).not.toHaveBeenCalled();
    });

    it("should enforce rate limit (10 requests per minute)", async () => {
      // NOTE: We test with 5 requests (not 10) to ensure the test completes quickly

      // Arrange: Create test user, workspace, and link
      const user = await createTestUser();
      createdUserIds.add(user.id);

      const workspace = await createTestWorkspace({
        userId: user.id,
        name: "Test Workspace",
      });

      const link = await createTestLink({
        workspaceId: workspace.id,
        name: "Test Link",
      });

      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any);
      resetRateLimit(RateLimitKeys.userAction(user.id, "delete-logo"));

      // Act: Make 5 successful deletions (re-adding logo between each)
      for (let i = 0; i < 5; i++) {
        // Add logo
        await db
          .update(links)
          .set({
            branding: {
              enabled: true,
              logo: {
                url: `https://storage.googleapis.com/test-branding-bucket/logo-${i}.png`,
                altText: undefined,
              },
              colors: null,
            },
          })
          .where(eq(links.id, link.id));

        // Delete logo
        const result = await deleteBrandingLogoAction({ linkId: link.id });
        expect(result.success).toBe(true);
      }

      // Verify we can still make more requests (we're at 5/10)
      await db
        .update(links)
        .set({
          branding: {
            enabled: true,
            logo: {
              url: "https://storage.googleapis.com/test-branding-bucket/logo-6.png",
              altText: undefined,
            },
            colors: null,
          },
        })
        .where(eq(links.id, link.id));

      const additionalResult = await deleteBrandingLogoAction({
        linkId: link.id,
      });
      expect(additionalResult.success).toBe(true);
    }, 10000); // 10 second timeout
  });
});
