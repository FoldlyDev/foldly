import { NextRequest, NextResponse } from 'next/server';
import {
  createLinkAction,
  fetchLinksAction,
} from '@/features/links/lib/actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🚀 API: Creating link with data:', body);

    const result = await createLinkAction(body);

    if (!result.success) {
      console.error('❌ API: Link creation failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to create link' },
        { status: 400 }
      );
    }

    console.log('✅ API: Link created successfully:', result.data?.id);
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('❌ API: Error in POST /api/links:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    // Build options object with only defined values
    const options: {
      includeInactive?: boolean;
      limit?: number;
      offset?: number;
    } = {};

    if (includeInactive) options.includeInactive = includeInactive;
    if (limitParam) options.limit = parseInt(limitParam);
    if (offsetParam) options.offset = parseInt(offsetParam);

    console.log('🚀 API: Fetching links with options:', options);

    const result = await fetchLinksAction(options);

    if (!result.success) {
      console.error('❌ API: Link fetch failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to fetch links' },
        { status: 400 }
      );
    }

    console.log(
      '✅ API: Links fetched successfully:',
      result.data?.length || 0,
      'links'
    );
    return NextResponse.json(result.data || []);
  } catch (error) {
    console.error('❌ API: Error in GET /api/links:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
