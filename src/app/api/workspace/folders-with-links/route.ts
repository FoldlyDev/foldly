import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/database/connection';
import { links } from '@/lib/database/schemas';
import { eq, and, isNotNull } from 'drizzle-orm';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all links with sourceFolderId (generated links)
    const generatedLinks = await db.query.links.findMany({
      where: and(
        eq(links.userId, userId),
        eq(links.linkType, 'generated'),
        isNotNull(links.sourceFolderId)
      ),
      columns: {
        sourceFolderId: true,
      },
    });

    // Extract folder IDs
    const folderIds = generatedLinks
      .map(link => link.sourceFolderId)
      .filter((id): id is string => id !== null);

    return NextResponse.json({ folderIds });
  } catch (error) {
    console.error('Error fetching folders with links:', error);
    return NextResponse.json(
      { error: 'Failed to fetch folders with links' },
      { status: 500 }
    );
  }
}