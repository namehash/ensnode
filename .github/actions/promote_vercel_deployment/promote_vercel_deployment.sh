#!/bin/bash

# Identifies the commit sha of the ENSIndexer image deployed to the active ENSNode environment
# and promotes the Vercel deployment with that sha to production for the given Vercel project.
# Ensures exact version matching between the active ENSNode and the production Vercel deployment.

set -euo pipefail

if [ -z "${VERCEL_PROJECT_ID:-}" ]; then
  echo "Error: VERCEL_PROJECT_ID is not set or is empty"
  exit 1
fi

if [ -z "${VERCEL_TEAM_SLUG:-}" ]; then
  echo "Error: VERCEL_TEAM_SLUG is not set or is empty"
  exit 1
fi

if [ -z "${VERCEL_TOKEN:-}" ]; then
  echo "Error: VERCEL_TOKEN is not set or is empty"
  exit 1
fi

if [ -z "${ENSNODE_ENVIRONMENT:-}" ]; then
  echo "Error: ENSNODE_ENVIRONMENT is not set or is empty"
  exit 1
fi

case "$ENSNODE_ENVIRONMENT" in
  green|blue|yellow)
    ;;
  *)
    echo "Error: ENSNODE_ENVIRONMENT must be one of: green, blue, yellow (got: $ENSNODE_ENVIRONMENT)"
    exit 1
    ;;
esac

echo "Targeting ENSNode Environment: $ENSNODE_ENVIRONMENT"
echo "Targeting Vercel Project: $VERCEL_PROJECT_ID"

# first, get the deployed ENSNode version from the ENSApi indexing-status endpoint
INDEXING_STATUS_URL="https://api.alpha.${ENSNODE_ENVIRONMENT}.ensnode.io/api/indexing-status"
ENSNODE_VERSION=$(curl \
  --silent \
  --show-error \
  --fail \
  --url "$INDEXING_STATUS_URL" | \
  jq -r '.stackInfo.ensIndexer.versionInfo.ensIndexer')

echo "Found ENSNode version: $ENSNODE_VERSION"

if [ -z "$ENSNODE_VERSION" ] || [ "$ENSNODE_VERSION" = "null" ]; then
  echo "Error: Could not resolve ENSNode version from $INDEXING_STATUS_URL"
  exit 1
fi

# the version is the image tag for the deployed ENSNode images
ENSINDEXER_IMAGE="ghcr.io/namehash/ensnode/ensindexer:${ENSNODE_VERSION}"

echo "Using ENSIndexer image: $ENSINDEXER_IMAGE"

# get commit sha from labels of the docker image
ENSINDEXER_COMMIT_SHA=$(skopeo inspect docker://$ENSINDEXER_IMAGE --override-arch amd64 --override-os linux | jq -r '.Labels."org.opencontainers.image.revision"')

echo "Found Commit SHA: $ENSINDEXER_COMMIT_SHA"

# find the vercel deployment corresponding to that sha
DEPLOYMENT_UID=$(curl --request GET \
  --url "https://api.vercel.com/v6/deployments?slug=${VERCEL_TEAM_SLUG}&projectId=${VERCEL_PROJECT_ID}&target=production&state=READY&sha=${ENSINDEXER_COMMIT_SHA}" \
  --header "Authorization: Bearer ${VERCEL_TOKEN}" | jq -r '.deployments[0].uid')

if [ -z "$DEPLOYMENT_UID" ] || [ "$DEPLOYMENT_UID" = "null" ]; then
  echo "Error: No deployment UID found for commit $ENSINDEXER_COMMIT_SHA"
  exit 1
fi

echo "Deployment UID: $DEPLOYMENT_UID"

# promote it to production
response=$(curl --silent --show-error --write-out "HTTPSTATUS:%{http_code}" --request POST \
  --url "https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/promote/${DEPLOYMENT_UID}?slug=${VERCEL_TEAM_SLUG}" \
  --header "Authorization: Bearer ${VERCEL_TOKEN}" \
  --header "Content-Type: application/json" \
  --data '{}')

body=$(echo "$response" | sed -e 's/HTTPSTATUS\:.*//g')
status=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

# Accept 2xx (success) or 409 (already current production deployment)
if [[ "$status" =~ ^20[0-9]$ ]] || [ "$status" = "409" ]; then
  if [ "$status" = "409" ]; then
    echo "Deployment already current production deployment"
  else
    echo "Promotion complete"
  fi
else
  echo "Promotion failed with status $status"
  echo "$body"
  exit 1
fi
