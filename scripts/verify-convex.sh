#!/bin/bash

echo "=== Convex Configuration Verification ==="
echo ""

# Check if required environment variables are set
if [ -z "$NEXT_PUBLIC_CONVEX_URL" ]; then
    echo "❌ NEXT_PUBLIC_CONVEX_URL is not set"
    echo "   Example: https://your-project.convex.cloud"
    exit 1
else
    echo "✅ NEXT_PUBLIC_CONVEX_URL: $NEXT_PUBLIC_CONVEX_URL"
fi

if [ -z "$CONVEX_DEPLOY_KEY" ]; then
    echo "❌ CONVEX_DEPLOY_KEY is not set"
    echo "   Get this from: Convex Dashboard → Settings → API Keys"
    exit 1
else
    # Show only first 10 chars of the key for security
    KEY_PREVIEW=${CONVEX_DEPLOY_KEY:0:10}
    echo "✅ CONVEX_DEPLOY_KEY: ${KEY_PREVIEW}..."
fi

echo ""
echo "=== Testing Convex Connection ==="

# Test connection to Convex
echo "Pinging Convex server..."
if curl -s -f "$NEXT_PUBLIC_CONVEX_URL/" > /dev/null 2>&1; then
    echo "✅ Convex server is reachable"
else
    echo "❌ Cannot reach Convex server at $NEXT_PUBLIC_CONVEX_URL"
    exit 1
fi

echo ""
echo "=== Verifying Convex Functions ==="

# Check if convex directory exists
if [ ! -d "convex" ]; then
    echo "❌ No 'convex' directory found"
    exit 1
else
    echo "✅ Convex directory found"
    echo "   Functions:"
    ls -1 convex/*.ts 2>/dev/null | sed 's/^/     - /'
fi

echo ""
echo "✅ All checks passed! Ready to deploy."
echo ""
echo "To deploy locally, run:"
echo "  npx convex deploy"
echo ""
echo "To deploy with Docker:"
echo "  docker-compose up -d --build"