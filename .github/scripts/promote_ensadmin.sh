#!/bin/bash

# Identifies the commit sha of images deployed to the incoming active env and ensures that the appropriate
# ENSAdmin Vercel Deployment is promoted to production. This ensures exact version matching between
# the active ENSNode and the production ENSAdmin.
VERCEL_PROJECT_ID=prj_nKcHTO12hq9kcgascQMq4xokRhwp # admin.ensnode.io
VERCEL_TEAM_SLUG=namehash

set -euo pipefail

if [ -z "$VERCEL_TOKEN" ]; then
  echo "Error: VERCEL_TOKEN is not set or is empty"
  exit 1
fi

if [ -z "$RAILWAY_TOKEN" ]; then
  echo "Error: RAILWAY_TOKEN is not set or is empty"
  exit 1
fi

if [ -z "$RAILWAY_ENVIRONMENT_ID" ]; then
  echo "Error: RAILWAY_ENVIRONMENT_ID is not set or is empty"
  exit 1
fi

echo "Targeting Railway Environment: $RAILWAY_ENVIRONMENT_ID"

# first, get deployed ENSIndexer image from Railway Environment
RAILWAY_SERVICES_OUTPUT=$(curl \
  --request POST \
  --silent \
  --show-error \
  --url https://backboard.railway.app/graphql/v2 \
  --header "Authorization: Bearer $RAILWAY_TOKEN" \
  --header 'Content-Type: application/json' \
  --data "{\"query\": \"{ environment(id: \\\"$RAILWAY_ENVIRONMENT_ID\\\") { serviceInstances { edges { node { source { image } } } } } }\"}")

if [ $? -ne 0 ]; then
  echo "Error: curl command failed. Output:"
  echo "$RAILWAY_SERVICES_OUTPUT"
  exit 1
fi

# get the first ensindexer image
ENSINDEXER_IMAGE=$(echo "$RAILWAY_SERVICES_OUTPUT" | jq -r '.data.environment.serviceInstances.edges[].node.source.image | select(type == "string" and startswith("ghcr.io/namehash/ensnode/ensindexer"))' | head -n1)

echo "Found ENSIndexer image: $ENSINDEXER_IMAGE"

if [ -z "$ENSINDEXER_IMAGE" ]; then
  echo "Error: Could not find ENSIndexer image for the environment."
  exit 1
fi

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

if [[ ! "$status" =~ ^20[0-9]$ ]]; then
  echo "Promotion failed with status $status"
  echo "$body"
  exit 1
fi

echo "Promotion complete"
