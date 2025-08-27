import { NextRequest, NextResponse } from 'next/server';
// TODO: Uncomment when actions are re-implemented with new tree
// import { validatePasswordAction } from '@/features/link-upload/lib/actions/validate-access';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { linkId, password } = body;

    if (!linkId || !password) {
      return NextResponse.json(
        { error: 'Link ID and password are required' },
        { status: 400 }
      );
    }

    // TODO: Re-implement password validation with new tree system
    // const result = await validatePasswordAction({ linkId, password });
    const result = { success: false, error: 'Password validation not yet implemented' };

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      isValid: result.data?.isValid ?? false,
    });
  } catch (error) {
    console.error('Password validation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}