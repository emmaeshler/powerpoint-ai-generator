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

# ── Step 3: Environment / credentials ────────────────────────
header "Step 3 of 5 — Checking credentials..."

if [ -f ".env" ] && grep -q "FOUNDRY_TARGET_URI=" .env && grep -q "MODEL=" .env; then
    # Both vars present — check they're not empty
    FOUNDRY_VAL=$(grep "^FOUNDRY_TARGET_URI=" .env | cut -d= -f2-)
    MODEL_VAL=$(grep "^MODEL=" .env | cut -d= -f2-)
    if [ -n "$FOUNDRY_VAL" ] && [ -n "$MODEL_VAL" ]; then
        success ".env found with credentials — skipping setup."
    else
        warn ".env exists but one or more values are blank."
        warn "The bridge server will prompt you for them when it starts."
    fi
else
    if [ ! -f ".env" ]; then
        info "No .env file found — creating one from .env.example..."
        cp .env.example .env
        success "Created .env (from .env.example)."
    fi
    echo ""
    warn "FOUNDRY_TARGET_URI and/or MODEL are not set in .env."
    warn "The bridge server will ask for these interactively"
    warn "the first time you run:  node claude-bridge-server.js"
    echo ""
    info "You can also fill them in now by editing .env directly."
    echo ""

    read -p "   Would you like to enter them now? (y/N): " ENTER_NOW
    if [[ "$ENTER_NOW" =~ ^[Yy]$ ]]; then
        read -p "   FOUNDRY_TARGET_URI (full Azure endpoint URL): " FOUNDRY_INPUT
        read -p "   MODEL (e.g. claude-3-5-sonnet): " MODEL_INPUT

        if [ -n "$FOUNDRY_INPUT" ]; then
            # Replace or append
            if grep -q "^FOUNDRY_TARGET_URI=" .env; then
                sed -i.bak "s|^FOUNDRY_TARGET_URI=.*|FOUNDRY_TARGET_URI=$FOUNDRY_INPUT|" .env && rm -f .env.bak
            else
                echo "FOUNDRY_TARGET_URI=$FOUNDRY_INPUT" >> .env
            fi
        fi
        if [ -n "$MODEL_INPUT" ]; then
            if grep -q "^MODEL=" .env; then
                sed -i.bak "s|^MODEL=.*|MODEL=$MODEL_INPUT|" .env && rm -f .env.bak
            else
                echo "MODEL=$MODEL_INPUT" >> .env
            fi
        fi
        success "Credentials saved to .env."
    fi
fi

# ── Step 4: Azure authentication check ───────────────────────
header "Step 4 of 5 — Checking Azure authentication..."

if command -v az &> /dev/null; then
    AZ_ACCOUNT=$(az account show 2>/dev/null | grep '"name"' | head -1 || true)
    if [ -n "$AZ_ACCOUNT" ]; then
        success "Azure CLI is authenticated."
        info "$AZ_ACCOUNT"
    else
        warn "Azure CLI is installed but you are not logged in."
        echo ""
        read -p "   Run 'az login' now? (y/N): " AZ_LOGIN_NOW
        if [[ "$AZ_LOGIN_NOW" =~ ^[Yy]$ ]]; then
            az login
        else
            warn "Skipped — AI generation will fail until you run: az login"
        fi
    fi
else
    warn "Azure CLI (az) not found. It's required for Azure authentication."
    info "Install from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    info "Or set AZURE_CLIENT_ID / AZURE_CLIENT_SECRET / AZURE_TENANT_ID in .env instead."
fi

# ── Step 5: Start the development server ─────────────────────
header "Step 5 of 5 — Starting the development server..."

echo -e "  ${YELLOW}Note:${NC} This starts the ${BOLD}web app only${NC}."
echo -e "  You also need to start the ${BOLD}bridge server${NC} in a separate terminal:"
echo ""
echo -e "    ${CYAN}node claude-bridge-server.js${NC}"
echo ""
echo -e "  The bridge server handles AI generation. The app will show a"
echo -e "  yellow warning banner if it's not running."
echo ""

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
