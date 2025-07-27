// =============================================================================
// DEBUG BILLING API - Test Endpoint for Billing Plan Detection
// =============================================================================
// 🎯 API endpoint to debug and test the corrected billing plan detection

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { debugPlanDetection, isUserOnProPlan, testFeatureAccess, billingSystemHealthCheck } from '@/lib/debug-plan-detection';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - please sign in to test billing' },
        { status: 401 }
      );
    }

    // Get comprehensive debug information
    const [debugInfo, proCheck, featureAccess, healthCheck] = await Promise.all([
      debugPlanDetection(),
      isUserOnProPlan(),
      testFeatureAccess(),
      billingSystemHealthCheck(),
    ]);

    const response = {
      userId,
      debugInfo,
      quickProCheck: proCheck,
      featureAccess,
      systemHealth: healthCheck,
      summary: {
        isAuthenticated: true,
        hasClerkBilling: debugInfo.clerkAuthStatus.hasHasMethod,
        detectedPlan: debugInfo.planDetection.detectedPlan,
        isOnProPlan: proCheck.isPro,
        hasErrors: !!(debugInfo.clerkAuthStatus.authError || debugInfo.planDetection.planDetectionError),
        systemHealthy: healthCheck.isHealthy,
        recommendations: debugInfo.recommendations,
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Debug billing endpoint error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to debug billing',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Optional POST endpoint for testing specific plan scenarios
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { testPlan } = body;

    if (!testPlan || !['free', 'pro', 'business'].includes(testPlan)) {
      return NextResponse.json(
        { error: 'Invalid testPlan. Must be "free", "pro", or "business"' },
        { status: 400 }
      );
    }

    // This would be used to test different plan scenarios
    // For now, just return the current state
    const debugInfo = await debugPlanDetection();
    
    return NextResponse.json({
      message: `Testing plan detection for: ${testPlan}`,
      currentDetection: debugInfo.planDetection.detectedPlan,
      matches: debugInfo.planDetection.detectedPlan === testPlan,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to test plan detection' },
      { status: 500 }
    );
  }
}