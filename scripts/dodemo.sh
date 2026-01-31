#!/usr/bin/env bash
# Conajra Solutions © 2026
# Author: Marwan
#
# Development demo script for testing AI receptionist voice calls via browser.
# Starts the backend server and opens the Vapi web demo interface.

set -e

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
PORT=${PORT:-3000}
DEMO_URL="http://localhost:${PORT}/demo"

echo -e "${BLUE}🚀 Starting AI Receptionist Demo${NC}"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo "Please create .env file from .env.example:"
    echo "  cp .env.example .env"
    echo "Then configure your VAPI_API_KEY and VAPI_PUBLIC_KEY"
    exit 1
fi

# Check if required env vars are set
source .env

# Ensure development mode (disables config caching for fresh configs)
export NODE_ENV=development

if [ -z "$VAPI_API_KEY" ] || [ -z "$VAPI_PUBLIC_KEY" ]; then
    echo -e "${RED}❌ Error: Missing required environment variables${NC}"
    echo "Please set VAPI_API_KEY and VAPI_PUBLIC_KEY in .env file"
    exit 1
fi

# Check if port is already in use
if lsof -Pi :${PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port ${PORT} is already in use${NC}"
    echo "Starting demo with existing server..."
    sleep 1
else
    echo -e "${GREEN}📦 Starting development server...${NC}"

    # Start the dev server in the background
    npm run dev &
    SERVER_PID=$!

    # Store PID for cleanup
    echo $SERVER_PID > .demo.pid

    # Set up cleanup on exit
    trap "echo -e '\n${YELLOW}🛑 Shutting down server...${NC}'; kill $SERVER_PID 2>/dev/null; rm -f .demo.pid; exit" EXIT INT TERM

    echo -e "${BLUE}⏳ Waiting for server to be ready...${NC}"

    # Wait for server to be ready (max 30 seconds)
    TIMEOUT=30
    ELAPSED=0
    while [ $ELAPSED -lt $TIMEOUT ]; do
        if curl -s http://localhost:${PORT}/assistant-id >/dev/null 2>&1; then
            echo -e "${GREEN}✓ Server is ready!${NC}"
            break
        fi
        sleep 1
        ELAPSED=$((ELAPSED + 1))

        # Show progress
        if [ $((ELAPSED % 5)) -eq 0 ]; then
            echo -e "${BLUE}  Still waiting... (${ELAPSED}s)${NC}"
        fi
    done

    if [ $ELAPSED -ge $TIMEOUT ]; then
        echo -e "${RED}❌ Server failed to start within ${TIMEOUT} seconds${NC}"
        kill $SERVER_PID 2>/dev/null
        rm -f .demo.pid
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}✓ Demo is ready!${NC}"
echo ""
echo -e "${BLUE}Opening browser to: ${DEMO_URL}${NC}"
echo ""
echo -e "${YELLOW}Instructions:${NC}"
echo "  1. Click 'Start Call' button in the browser"
echo "  2. Allow microphone access when prompted"
echo "  3. Start talking to the AI receptionist!"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the demo${NC}"
echo ""

# Open browser based on OS
if command -v xdg-open >/dev/null 2>&1; then
    # Linux
    xdg-open "$DEMO_URL" >/dev/null 2>&1
elif command -v open >/dev/null 2>&1; then
    # macOS
    open "$DEMO_URL"
elif command -v wslview >/dev/null 2>&1; then
    # WSL
    wslview "$DEMO_URL"
else
    echo -e "${YELLOW}⚠️  Could not auto-open browser${NC}"
    echo "Please open manually: $DEMO_URL"
fi

# If we started the server, wait for it
if [ -f .demo.pid ]; then
    wait $SERVER_PID
fi
