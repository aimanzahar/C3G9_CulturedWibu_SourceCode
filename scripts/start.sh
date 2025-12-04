#!/bin/sh

# Entrypoint for the production container.
# Deploys Convex functions (if a deploy key is provided) before starting Next.js.
# Also runs a watchdog to re-deploy if Convex becomes unavailable.

set -u

DEPLOY_TARGET="${CONVEX_PRODUCTION_URL:-${CONVEX_SELF_HOSTED_URL:-${NEXT_PUBLIC_CONVEX_URL:-""}}}"
ADMIN_KEY="${CONVEX_SELF_HOSTED_ADMIN_KEY:-}"
DEPLOY_KEY="${CONVEX_DEPLOY_KEY:-}"

# Function to deploy Convex functions
deploy_convex() {
  if [ -n "$ADMIN_KEY" ]; then
    echo "📡 Deploying Convex functions (self-hosted) to ${DEPLOY_TARGET:-"(unknown target)"}"
    if npx convex deploy --admin-key "$ADMIN_KEY" --url "$DEPLOY_TARGET" 2>&1; then
      echo "✅ Convex deploy completed (self-hosted)."
      return 0
    else
      echo "❌ Convex deploy failed."
      return 1
    fi
  elif [ -n "$DEPLOY_KEY" ]; then
    echo "📡 Deploying Convex functions (cloud) to ${DEPLOY_TARGET:-"(unknown target)"}"
    if npx convex deploy 2>&1; then
      echo "✅ Convex deploy completed."
      return 0
    else
      echo "❌ Convex deploy failed."
      return 1
    fi
  else
    echo "❌ No Convex key provided."
    return 1
  fi
}

# Watchdog function - runs in background to periodically check and re-deploy if needed
convex_watchdog() {
  # Wait for Next.js to start
  sleep 60
  
  WATCHDOG_INTERVAL="${CONVEX_WATCHDOG_INTERVAL:-300}" # Default: 5 minutes
  CONSECUTIVE_FAILURES=0
  MAX_FAILURES=3
  
  echo "🐕 Convex watchdog started (checking every ${WATCHDOG_INTERVAL}s)"
  
  while true; do
    sleep "$WATCHDOG_INTERVAL"
    
    # Check if Convex backend is reachable
    if [ -n "$DEPLOY_TARGET" ]; then
      # Try to reach the Convex version endpoint
      HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${DEPLOY_TARGET}/version" 2>/dev/null || echo "000")
      
      if [ "$HTTP_CODE" = "000" ] || [ "$HTTP_CODE" = "503" ] || [ "$HTTP_CODE" = "502" ]; then
        CONSECUTIVE_FAILURES=$((CONSECUTIVE_FAILURES + 1))
        echo "⚠️  Convex health check failed (attempt $CONSECUTIVE_FAILURES/$MAX_FAILURES, HTTP: $HTTP_CODE)"
        
        if [ "$CONSECUTIVE_FAILURES" -ge "$MAX_FAILURES" ]; then
          echo "🔄 Re-deploying Convex functions after $MAX_FAILURES consecutive failures..."
          if deploy_convex; then
            CONSECUTIVE_FAILURES=0
            echo "✅ Convex re-deployment successful"
          else
            echo "❌ Convex re-deployment failed, will retry..."
          fi
        fi
      else
        if [ "$CONSECUTIVE_FAILURES" -gt 0 ]; then
          echo "✅ Convex health check recovered (HTTP: $HTTP_CODE)"
        fi
        CONSECUTIVE_FAILURES=0
      fi
    fi
  done
}

echo "🔧 Bootstrapping Convex deployment..."

# Initial deployment
if [ -z "$ADMIN_KEY" ] && [ -z "$DEPLOY_KEY" ]; then
  echo "❌ No Convex key provided. Set CONVEX_SELF_HOSTED_ADMIN_KEY (self-hosted) or CONVEX_DEPLOY_KEY (cloud) in your Portainer stack."
  exit 1
fi

if ! deploy_convex; then
  echo "❌ Initial Convex deployment failed. Check the key and URL, then redeploy the stack."
  exit 1
fi

# Start the watchdog in background (only for self-hosted)
if [ -n "$ADMIN_KEY" ]; then
  echo "🐕 Starting Convex watchdog for self-hosted backend..."
  convex_watchdog &
fi

echo "🚀 Starting Next.js..."
exec npm start
