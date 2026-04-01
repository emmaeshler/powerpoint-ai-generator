#!/bin/bash

# ============================================================
#  Emma's Awesome PPT Generator – PowerPoint App Setup Script
#  Run this once after cloning the repo to get up and running.
# ============================================================

set -e  # Exit on any error

# ── Colors & helpers ─────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

info()    { echo -e "${CYAN}ℹ ${NC} $1"; }
success() { echo -e "${GREEN}✔ ${NC} $1"; }
warn()    { echo -e "${YELLOW}⚠ ${NC} $1"; }
fail()    { echo -e "${RED}✖ ${NC} $1"; exit 1; }
header()  { echo -e "\n${BOLD}$1${NC}\n"; }

# ── Welcome ──────────────────────────────────────────────────
clear
echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║  Emma's Awesome PPT Generator – Setup       ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  This script will help you set up the app locally."
echo -e "  It will check prerequisites, install dependencies,"
echo -e "  and start the development server for you."
echo ""

# ── Step 1: Check prerequisites ──────────────────────────────
header "Step 1 of 4 — Checking prerequisites..."

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    success "Node.js found: $NODE_VERSION"

    # Check minimum version (need >= 18)
    NODE_MAJOR=$(echo "$NODE_VERSION" | sed 's/v//' | cut -d. -f1)
    if [ "$NODE_MAJOR" -lt 18 ]; then
        fail "Node.js 18+ is required. You have $NODE_VERSION.\n   Download the latest LTS from: https://nodejs.org"
    fi
else
    fail "Node.js is not installed.\n   Download it from: https://nodejs.org (LTS version recommended)"
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    success "npm found: v$NPM_VERSION"
else
    fail "npm is not installed. It usually comes with Node.js.\n   Reinstall Node.js from: https://nodejs.org"
fi

# Check git (optional but helpful)
if command -v git &> /dev/null; then
    success "git found: $(git --version | cut -d' ' -f3)"
else
    warn "git not found – not required to run, but recommended."
fi

echo ""
success "All prerequisites met!"

# ── Step 2: Install dependencies ─────────────────────────────
header "Step 2 of 4 — Installing dependencies..."

# Navigate to project root (wherever this script lives)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"
info "Project directory: $SCRIPT_DIR"

if [ -d "node_modules" ]; then
    echo ""
    read -p "   node_modules already exists. Reinstall? (y/N): " REINSTALL
    if [[ "$REINSTALL" =~ ^[Yy]$ ]]; then
        info "Removing old node_modules..."
        rm -rf node_modules
        info "Running npm install (this may take a minute)..."
        npm install
    else
        info "Skipping install – using existing node_modules."
    fi
else
    info "Running npm install (this may take a minute)..."
    npm install
fi

success "Dependencies installed!"

# ── Step 3: Environment configuration ────────────────────────
header "Step 3 of 4 — Checking environment configuration..."

if [ -f ".env.local" ]; then
    success ".env.local already exists."
    info "If you need to update environment variables, edit .env.local manually."
else
    info "No .env.local file found — creating a template..."
    cat > .env.local << 'ENVEOF'
# ============================================================
#  Emma's Awesome PPT Generator – Environment Variables
#  Fill in the values below, then re-run: npm start
# ============================================================

# Add any required API keys or config below:
# VITE_API_KEY=your_api_key_here

ENVEOF
    success "Created .env.local template."
    warn "You may need to add API keys or config values to .env.local"
    warn "Ask the project owner if you're unsure what values to use."
fi

# ── Step 4: Start the development server ─────────────────────
header "Step 4 of 4 — Starting the development server..."

# Find an available port (default 5173 for Vite)
DEFAULT_PORT=5173

# Check if the port is already in use
if lsof -ti:$DEFAULT_PORT > /dev/null 2>&1; then
    warn "Port $DEFAULT_PORT is already in use."
    read -p "   Kill the existing process and continue? (y/N): " KILL_PORT
    if [[ "$KILL_PORT" =~ ^[Yy]$ ]]; then
        lsof -ti:$DEFAULT_PORT | xargs kill -9 2>/dev/null || true
        sleep 1
        success "Freed port $DEFAULT_PORT."
    else
        info "Will let Vite pick the next available port."
    fi
fi

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║  Starting Emma's Awesome PPT Generator...   ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${GREEN}▸ Local:${NC}   ${BOLD}http://localhost:$DEFAULT_PORT/${NC}"
echo -e "  ${GREEN}▸ Network:${NC} Check your terminal output below"
echo ""
echo -e "  ${CYAN}Tip:${NC} Open the URL above in your browser."
echo -e "  ${CYAN}Tip:${NC} Press ${BOLD}Ctrl+C${NC} to stop the server."
echo ""
echo -e "  ${YELLOW}Note:${NC} The app has a ${BOLD}30-minute inactivity timeout${NC}."
echo -e "  ${YELLOW}     ${NC} You can also click ${BOLD}\"Stop Server\"${NC} in the app header."
echo ""
echo -e "  ${YELLOW}────────── Server logs below ──────────${NC}"
echo ""

# Clean up on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down server...${NC}"
    # Kill any background processes we spawned
    jobs -p | xargs kill -9 2>/dev/null || true
    echo -e "${GREEN}✔  Server stopped. Terminal is no longer exposed.${NC}"
    echo ""
}
trap cleanup EXIT INT TERM

# Start the Vite dev server (foreground so user sees output)
npm run dev
