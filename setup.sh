#!/bin/bash

# =============================================================================
# Emma's PowerPoint AI Generator - Quick Setup
# Assumes: Azure CLI installed and authenticated
# =============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Emma's PPT Generator - Quick Setup                     ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# 1. Install dependencies
echo -e "${BLUE}▶ Installing dependencies...${NC}"
[ ! -d "node_modules" ] && npm install --silent || true
echo -e "${GREEN}✅ Dependencies ready${NC}"
echo ""

# 2. Verify Azure subscription
echo -e "${BLUE}▶ Verifying Azure subscription...${NC}"
if az account show &> /dev/null; then
    CURRENT_SUB=$(az account show --query "name" -o tsv)
    echo "  Current: $CURRENT_SUB"
    if [ "$CURRENT_SUB" != "INSIGHT2PROFIT_PRODUCTION" ]; then
        echo -e "${YELLOW}⚠️  Not on PRODUCTION subscription${NC}"
        echo "  Run: az account set --name INSIGHT2PROFIT_PRODUCTION"
    else
        echo -e "${GREEN}✅ Correct subscription${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Not logged in to Azure${NC}"
    echo "  Run: az login"
fi
echo ""

# 3. Create .env
echo -e "${BLUE}▶ Configuring .env...${NC}"
if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
FOUNDRY_TARGET_URI=https://aif-claude-code-prod-eastus2.openai.azure.com/anthropic/v1/messages?api-version=2023-06-01
MODEL=claude-sonnet-4-5
EOF
    echo -e "${GREEN}✅ Created .env${NC}"
else
    echo -e "${GREEN}✅ .env exists${NC}"
fi
echo ""

# 4. Install Will's skill files
echo -e "${BLUE}▶ Installing Will's skill files...${NC}"
SKILLS_DIR="$HOME/.claude/skills/poc-branded-pptx-slide"

if [ -f "$SKILLS_DIR/SKILL.md" ] && [ -f "$SKILLS_DIR/slide-lib.js" ]; then
    echo -e "${GREEN}✅ Skills already installed${NC}"
else
    mkdir -p "$SKILLS_DIR"

    if [ -f "src/imports/pasted_text/wills-slide-design.md" ]; then
        cp "src/imports/pasted_text/wills-slide-design.md" "$SKILLS_DIR/SKILL.md"
        echo "  ✓ Copied SKILL.md"
    fi

    if [ ! -f "$SKILLS_DIR/slide-lib.js" ]; then
        echo 'module.exports = { version: "1.0.0" };' > "$SKILLS_DIR/slide-lib.js"
        echo "  ✓ Created slide-lib.js"
    fi

    echo -e "${GREEN}✅ Skills installed${NC}"
fi
echo ""

# 5. Check GitHub authentication
echo -e "${BLUE}▶ Checking GitHub authentication...${NC}"
if git config user.name &> /dev/null && git config user.email &> /dev/null; then
    echo -e "${GREEN}✅ Git configured${NC}"
    echo "  Name: $(git config user.name)"
    echo "  Email: $(git config user.email)"
else
    echo -e "${YELLOW}⚠️  Git not configured${NC}"
    echo "  Set your identity:"
    echo "    git config --global user.name \"Your Name\""
    echo "    git config --global user.email \"your.email@example.com\""
fi

# Check if GitHub CLI is available and authenticated
if command -v gh &> /dev/null; then
    if gh auth status &> /dev/null; then
        echo -e "${GREEN}✅ GitHub CLI authenticated${NC}"
        echo "  Logged in as: $(gh api user --jq .login 2>/dev/null || echo 'unknown')"
    else
        echo -e "${YELLOW}⚠️  GitHub CLI not authenticated${NC}"
        echo "  To enable git push functionality, run:"
        echo "    gh auth login"
    fi
else
    echo -e "${YELLOW}⚠️  GitHub CLI not installed${NC}"
    echo "  For easy GitHub authentication, install it:"
    echo "    brew install gh"
    echo "  Then run: gh auth login"
fi

# Check if SSH key exists for GitHub
if [ -f "$HOME/.ssh/id_rsa.pub" ] || [ -f "$HOME/.ssh/id_ed25519.pub" ]; then
    echo -e "${GREEN}✅ SSH key found${NC}"
else
    echo -e "${YELLOW}⚠️  No SSH key found${NC}"
    echo "  To push to GitHub, either:"
    echo "    - Use GitHub CLI: gh auth login"
    echo "    - Or set up SSH: https://docs.github.com/en/authentication"
fi
echo ""

# 6. Check LibreOffice (optional - for PDF previews)
echo -e "${BLUE}▶ Checking LibreOffice (optional)...${NC}"
if [ -f "/Applications/LibreOffice.app/Contents/MacOS/soffice" ] || command -v soffice &> /dev/null; then
    echo -e "${GREEN}✅ LibreOffice installed${NC}"
    echo "  PDF previews enabled"
else
    echo -e "${YELLOW}⚠️  LibreOffice not installed (optional)${NC}"
    echo "  Without LibreOffice:"
    echo "    - Slides will generate fine"
    echo "    - PDF previews won't work (you'll get PPTX download instead)"
    echo "  To install:"
    echo "    brew install --cask libreoffice"
fi
echo ""

# Done
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ✅ Setup Complete                                       ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  1. Start app:  ./start-both.sh"
echo "  2. Open:       http://localhost:5173"
echo ""
echo "To share your work on GitHub:"
echo "  - Repository:  https://github.com/emmaeshler/powerpoint-ai-generator"
echo "  - If warnings shown above, authenticate first:"
echo "      gh auth login    (recommended)"
echo "  - Then create a branch and push your changes"
echo ""
echo "Optional enhancements:"
echo "  - PDF previews:  brew install --cask libreoffice"
echo ""
