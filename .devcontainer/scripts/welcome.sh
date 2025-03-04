#!/bin/bash

# Terminal colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
MAGENTA='\033[0;35m'
RESET='\033[0m'

clear

echo -e "${GREEN}
 ███████╗███╗   ██╗███████╗███╗   ██╗ ██████╗ ██████╗ ███████╗
 ██╔════╝████╗  ██║██╔════╝████╗  ██║██╔═══██╗██╔══██╗██╔════╝
 █████╗  ██╔██╗ ██║███████╗██╔██╗ ██║██║   ██║██║  ██║█████╗  
 ██╔══╝  ██║╚██╗██║╚════██║██║╚██╗██║██║   ██║██║  ██║██╔══╝  
 ███████╗██║ ╚████║███████║██║ ╚████║╚██████╔╝██████╔╝███████╗
 ╚══════╝╚═╝  ╚═══╝╚══════╝╚═╝  ╚═══╝ ╚═════╝ ╚═════╝ ╚══════╝
                                                              
 ██████╗ ███████╗██╗   ██╗███████╗██╗      ██████╗ ██████╗ ███████╗██████╗ 
 ██╔══██╗██╔════╝██║   ██║██╔════╝██║     ██╔═══██╗██╔══██╗██╔════╝██╔══██╗
 ██║  ██║█████╗  ██║   ██║█████╗  ██║     ██║   ██║██████╔╝█████╗  ██████╔╝
 ██║  ██║██╔══╝  ╚██╗ ██╔╝██╔══╝  ██║     ██║   ██║██╔═══╝ ██╔══╝  ██╔══██╗
 ██████╔╝███████╗ ╚████╔╝ ███████╗███████╗╚██████╔╝██║     ███████╗██║  ██║
 ╚═════╝ ╚══════╝  ╚═══╝  ╚══════╝╚══════╝ ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═╝
${RESET}"

echo -e "${BLUE}Welcome to the ENSNode development environment!${RESET}"
echo -e "${YELLOW}==============================================${RESET}"
echo
echo -e "${CYAN}Infrastructure:${RESET}"

# Check PostgreSQL
if pg_isready -h localhost -q; then
  echo -e "  - PostgreSQL: ${GREEN}Running${RESET} (localhost:5432)"
else
  echo -e "  - PostgreSQL: ${YELLOW}Not Running${RESET}"
fi

echo
echo -e "${CYAN}Apps Status:${RESET}"

# Check ENSRainbow
if curl -s http://localhost:3223/health &> /dev/null; then
  echo -e "  - ENSRainbow:    ${GREEN}Running${RESET} (localhost:3223)"
else
  echo -e "  - ENSRainbow:    ${YELLOW}Not Running${RESET}"
fi

# Check ENSIndexer
if curl -s http://localhost:42069/metadata &> /dev/null; then
  echo -e "  - ENSIndexer:    ${GREEN}Running${RESET} (localhost:42069)"
else
  echo -e "  - ENSIndexer:    ${YELLOW}Not Running${RESET}"
fi

# Check ENSAdmin-Next
if curl -s http://localhost:3000 &> /dev/null; then
  echo -e "  - ENSAdmin-Next: ${GREEN}Running${RESET} (localhost:3000)"
else
  echo -e "  - ENSAdmin-Next: ${YELLOW}Not Running${RESET}"
fi

# Check ENSAdmin
if curl -s http://localhost:4173 &> /dev/null; then
  echo -e "  - ENSAdmin:      ${GREEN}Running${RESET} (localhost:4173)"
else
  echo -e "  - ENSAdmin:      ${YELLOW}Not Running${RESET}"
fi

echo
echo -e "${CYAN}App Startup Commands:${RESET}"
echo -e "  - ENSRainbow:    ${MAGENTA}cd apps/ensrainbow    ${CYAN}&&${MAGENTA} pnpm serve${RESET}"
echo -e "  - ENSIndexer:    ${MAGENTA}cd apps/ensindexer    ${CYAN}&&${MAGENTA} pnpm dev${RESET}"
echo -e "  - ENSAdmin-Next: ${MAGENTA}cd apps/ensadmin-next ${CYAN}&&${MAGENTA} pnpm dev${RESET}"
echo -e "  - ENSAdmin:      ${MAGENTA}cd apps/ensadmin      ${CYAN}&&${MAGENTA} pnpm dev${RESET}"
echo

echo -e "${CYAN}First-Time Setup:${RESET}"

# ENSRainbow Data
if [ ! -f "/workspaces/ensnode/apps/ensrainbow/ens_names.sql.gz" ]; then
  echo -e "  - ENSRainbow Data: ${RED}Missing${RESET}"
  echo -e "    ${MAGENTA}cd apps/ensrainbow && ./download-rainbow-tables.sh && pnpm ingest${RESET}"
else
  if [ ! -d "/workspaces/ensnode/apps/ensrainbow/data" ] || [ -z "$(ls -A /workspaces/ensnode/apps/ensrainbow/data 2>/dev/null)" ]; then
    echo -e "  - ENSRainbow Data: ${YELLOW}Downloaded but not ingested${RESET}"
    echo -e "    ${MAGENTA}cd apps/ensrainbow && pnpm ingest${RESET}"
  else
    echo -e "  - ENSRainbow Data: ${GREEN}Ready${RESET}"
  fi
fi

# ENSIndexer env
if [ ! -f "/workspaces/ensnode/apps/ensindexer/.env.local" ]; then
  echo -e "  - ENSIndexer Env: ${YELLOW}Missing${RESET}"
  echo -e "    ${MAGENTA}cd apps/ensindexer && cp .env.local.example .env.local${RESET}"
  echo -e "    Then edit .env.local to set DATABASE_URL=postgresql://postgres:password@localhost:5432/ponder"
else
  echo -e "  - ENSIndexer Env: ${GREEN}Ready${RESET}"
fi

# ENSAdmin-Next env
if [ ! -f "/workspaces/ensnode/apps/ensadmin-next/.env.local" ]; then
  echo -e "  - ENSAdmin-Next Env: ${YELLOW}Missing${RESET}"
  echo -e "    ${MAGENTA}cd apps/ensadmin-next && cp .env.local.example .env.local${RESET}"
else
  echo -e "  - ENSAdmin-Next Env: ${GREEN}Ready${RESET}"
fi

# ENSAdmin env
if [ ! -f "/workspaces/ensnode/apps/ensadmin/.env.local" ]; then
  echo -e "  - ENSAdmin Env: ${YELLOW}Missing${RESET}"
  echo -e "    ${MAGENTA}cd apps/ensadmin && cp .env.local.example .env.local${RESET}"
else
  echo -e "  - ENSAdmin Env: ${GREEN}Ready${RESET}"
fi

echo
echo -e "${CYAN}Dev Tips:${RESET}"
echo -e "  - Connect ${YELLOW}pgAdmin${RESET} to localhost:5432 (user: postgres, pass: password)"
echo -e "  - Access the ENSNode dashboard at ${YELLOW}http://localhost:3000${RESET} once ENSAdmin-Next is running"
echo

# Show git branch 
if command -v git &> /dev/null; then
  BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || echo "detached")
  echo -e "${BLUE}Current git branch:${RESET} ${YELLOW}${BRANCH}${RESET}"
  echo
fi
