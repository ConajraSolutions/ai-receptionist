#!/bin/bash
# Conajra Solutions © 2026
# Author: Marwan
#
# Flush Redis cache for development

set -e

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🗑️  Flushing Redis cache...${NC}"

# Check if .env exists
if [ ! -f .env ]; then
    echo "Error: .env file not found"
    exit 1
fi

# Load REDIS_URL from .env
source .env

# Flush the Redis database
redis-cli -u "$REDIS_URL" FLUSHDB

echo -e "${GREEN}✓ Cache flushed successfully${NC}"
echo ""
echo "Next server restart will load fresh configs from database."
