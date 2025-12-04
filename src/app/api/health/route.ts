import { NextResponse } from 'next/server';

export async function GET() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || 
                    process.env.CONVEX_SELF_HOSTED_URL || 
                    process.env.CONVEX_PRODUCTION_URL;
  
  let convexStatus = 'unknown';
  let convexError: string | null = null;
  
  // Try to ping the Convex backend
  if (convexUrl) {
    try {
      // Test if Convex HTTP endpoint is reachable
      const response = await fetch(`${convexUrl}/version`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      
      if (response.ok) {
        convexStatus = 'connected';
      } else {
        convexStatus = 'degraded';
        convexError = `HTTP ${response.status}`;
      }
    } catch (error) {
      convexStatus = 'error';
      convexError = error instanceof Error ? error.message : 'Unknown error';
    }
  } else {
    convexStatus = 'not_configured';
    convexError = 'NEXT_PUBLIC_CONVEX_URL not set';
  }

  const isHealthy = convexStatus === 'connected' || convexStatus === 'unknown';
  
  return NextResponse.json({
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    service: 'air-quality-app',
    convex: {
      status: convexStatus,
      url: convexUrl ? convexUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') : null, // Hide credentials
      error: convexError,
    },
  }, {
    status: isHealthy ? 200 : 503,
  });
}