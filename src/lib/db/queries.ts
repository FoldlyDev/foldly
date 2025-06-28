import { db } from './index';
import {
  users,
  uploadLinks,
  files,
  type NewUser,
  type NewUploadLink,
  type NewFile,
} from './schema';
import { eq, desc, and, count } from 'drizzle-orm';

// User operations for Clerk integration
export async function createUser(data: NewUser) {
  try {
    const [newUser] = await db.insert(users).values(data).returning();
    return newUser;
  } catch (error) {
    throw new Error(
      `Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getUserById(id: string) {
  return await db.query.users.findFirst({
    where: eq(users.id, id),
    with: {
      uploadLinks: {
        orderBy: desc(uploadLinks.createdAt),
      },
    },
  });
}

export async function syncUserWithClerk(
  clerkUserId: string,
  userData: {
    email: string;
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
  }
) {
  try {
    // Try to update existing user first
    const [updatedUser] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, clerkUserId))
      .returning();

    if (updatedUser) {
      return updatedUser;
    }

    // If no user exists, create new one
    const [newUser] = await db
      .insert(users)
      .values({
        id: clerkUserId,
        ...userData,
      })
      .returning();

    return newUser;
  } catch (error) {
    throw new Error(
      `Failed to sync user with Clerk: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Upload link operations
export async function createUploadLink(data: NewUploadLink) {
  try {
    const [newLink] = await db.insert(uploadLinks).values(data).returning();
    return newLink;
  } catch (error) {
    throw new Error(
      `Failed to create upload link: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getUserUploadLinks(userId: string) {
  return await db.query.uploadLinks.findMany({
    where: eq(uploadLinks.userId, userId),
    with: {
      files: true,
    },
    orderBy: desc(uploadLinks.createdAt),
  });
}

export async function getUploadLinkBySlug(slug: string) {
  return await db.query.uploadLinks.findFirst({
    where: and(eq(uploadLinks.slug, slug), eq(uploadLinks.isActive, true)),
    with: {
      files: true,
      user: true,
    },
  });
}

// File operations
export async function createFile(data: NewFile) {
  try {
    const [newFile] = await db.insert(files).values(data).returning();
    return newFile;
  } catch (error) {
    throw new Error(
      `Failed to create file record: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getFilesByUploadLink(uploadLinkId: number) {
  return await db.query.files.findMany({
    where: eq(files.uploadLinkId, uploadLinkId),
    orderBy: desc(files.uploadedAt),
  });
}

export async function getUserFileStats(userId: string) {
  const linkCount = await db
    .select({ count: count() })
    .from(uploadLinks)
    .where(eq(uploadLinks.userId, userId));

  const fileCount = await db
    .select({ count: count() })
    .from(files)
    .innerJoin(uploadLinks, eq(files.uploadLinkId, uploadLinks.id))
    .where(eq(uploadLinks.userId, userId));

  return {
    totalLinks: linkCount[0]?.count || 0,
    totalFiles: fileCount[0]?.count || 0,
  };
}
