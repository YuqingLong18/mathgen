#!/bin/bash
# Verification script to check if all dependencies are properly installed

echo "=== Verifying Installation ==="
echo ""

# Check Node.js
echo -n "Node.js: "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✓ Installed ($NODE_VERSION)"
else
    echo "✗ Not found"
fi

# Check npm
echo -n "npm: "
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✓ Installed ($NPM_VERSION)"
else
    echo "✗ Not found"
fi

# Check XeLaTeX
echo -n "XeLaTeX: "
if command -v xelatex &> /dev/null; then
    XELATEX_VERSION=$(xelatex --version | head -n 1)
    echo "✓ Installed ($XELATEX_VERSION)"
else
    echo "✗ Not found"
    echo "  Run: sudo yum install texlive-xetex texlive-lang-chinese"
fi

# Check pdftoppm
echo -n "pdftoppm (Poppler): "
if command -v pdftoppm &> /dev/null; then
    PDFTOPPM_VERSION=$(pdftoppm -v 2>&1 | head -n 1)
    echo "✓ Installed ($PDFTOPPM_VERSION)"
else
    echo "✗ Not found"
    echo "  Run: sudo yum install poppler-utils"
fi

# Check PM2
echo -n "PM2: "
if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 --version)
    echo "✓ Installed ($PM2_VERSION)"
else
    echo "✗ Not found"
    echo "  Run: npm install -g pm2"
fi

# Check Chinese fonts
echo -n "Chinese Fonts: "
if fc-list :lang=zh | grep -q .; then
    FONT_COUNT=$(fc-list :lang=zh | wc -l)
    echo "✓ Available ($FONT_COUNT fonts found)"
else
    echo "⚠ Not found (optional, but recommended for CJK support)"
    echo "  Run: sudo yum install wqy-microhei-fonts wqy-zenhei-fonts"
fi

# Check project directories
echo ""
echo "=== Project Directories ==="
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

if [ -d "$PROJECT_DIR/tmp" ]; then
    echo "✓ tmp/ directory exists"
else
    echo "✗ tmp/ directory missing"
    echo "  Run: mkdir -p tmp"
fi

if [ -d "$PROJECT_DIR/downloads" ]; then
    echo "✓ downloads/ directory exists"
else
    echo "✗ downloads/ directory missing"
    echo "  Run: mkdir -p downloads"
fi

if [ -f "$PROJECT_DIR/.env" ]; then
    echo "✓ .env file exists"
    if grep -q "OPENROUTER_API_KEY" "$PROJECT_DIR/.env"; then
        echo "✓ OPENROUTER_API_KEY is configured"
    else
        echo "⚠ OPENROUTER_API_KEY not found in .env"
    fi
else
    echo "✗ .env file missing"
    echo "  Create .env file with your OpenRouter API key"
fi

# Check if built
if [ -d "$PROJECT_DIR/.next" ]; then
    echo "✓ Application is built (.next directory exists)"
else
    echo "⚠ Application not built yet"
    echo "  Run: npm run build"
fi

echo ""
echo "=== Verification Complete ==="

