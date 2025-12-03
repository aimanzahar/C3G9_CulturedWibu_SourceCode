#!/bin/sh

# Entrypoint for the production container.
# Deploys Convex functions (if a deploy key is provided) before starting Next.js.

set -u

echo "🔧 Bootstrapping Convex deployment..."

DEPLOY_TARGET="${CONVEX_PRODUCTION_URL:-${CONVEX_SELF_HOSTED_URL:-${NEXT_PUBLIC_CONVEX_URL:-""}}}"

if [ -z "${CONVEX_DEPLOY_KEY:-}" ]; then
  echo "❌ CONVEX_DEPLOY_KEY is not set. Set it in your Portainer stack to deploy Convex functions."
  echo "   Convex functions will be missing and the app cannot serve data without it."
  exit 1
fi

echo "📡 Deploying Convex functions to ${DEPLOY_TARGET:-"(unknown target)"}"
if npx convex deploy; then
  echo "✅ Convex deploy completed."
else
  echo "❌ Convex deploy failed. Check your key/URL and redeploy the stack."
  exit 1
fi

echo "🚀 Starting Next.js..."
exec npm start
