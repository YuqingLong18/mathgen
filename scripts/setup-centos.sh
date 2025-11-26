#!/bin/bash
# Automated setup script for CentOS servers
# This script installs required dependencies for the MathGen application

set -e  # Exit on error

echo "=== MathGen CentOS Setup Script ==="
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root or with sudo"
    exit 1
fi

# Detect CentOS version
if [ -f /etc/redhat-release ]; then
    CENTOS_VERSION=$(cat /etc/redhat-release)
    echo "Detected: $CENTOS_VERSION"
else
    echo "Warning: This script is designed for CentOS/RHEL systems"
fi

# Update system packages
echo ""
echo "=== Updating system packages ==="
if command -v dnf &> /dev/null; then
    dnf update -y
    PACKAGE_MANAGER="dnf"
else
    yum update -y
    PACKAGE_MANAGER="yum"
fi

# Install build tools
echo ""
echo "=== Installing build tools ==="
if [ "$PACKAGE_MANAGER" = "dnf" ]; then
    dnf groupinstall -y "Development Tools"
    dnf install -y gcc gcc-c++ make
else
    yum groupinstall -y "Development Tools"
    yum install -y gcc gcc-c++ make
fi

# Install EPEL repository
echo ""
echo "=== Installing EPEL repository ==="
if [ "$PACKAGE_MANAGER" = "dnf" ]; then
    dnf install -y epel-release
else
    yum install -y epel-release
fi

# Install Poppler utils
echo ""
echo "=== Installing Poppler utils (for PDF conversion) ==="
if [ "$PACKAGE_MANAGER" = "dnf" ]; then
    dnf install -y poppler-utils
else
    yum install -y poppler-utils
fi

# Install TeX Live packages
echo ""
echo "=== Installing TeX Live packages ==="
echo "This may take a while..."
if [ "$PACKAGE_MANAGER" = "dnf" ]; then
    dnf install -y texlive-xetex texlive-lang-chinese texlive-collection-fontsrecommended \
                   texlive-amsmath texlive-geometry texlive-xecjk
else
    yum install -y texlive-xetex texlive-lang-chinese texlive-collection-fontsrecommended \
                   texlive-amsmath texlive-geometry texlive-xecjk
fi

# Install Chinese fonts
echo ""
echo "=== Installing Chinese fonts ==="
if [ "$PACKAGE_MANAGER" = "dnf" ]; then
    dnf install -y wqy-microhei-fonts wqy-zenhei-fonts
else
    yum install -y wqy-microhei-fonts wqy-zenhei-fonts
fi

# Update font cache
fc-cache -fv

# Install Node.js (if not already installed)
echo ""
echo "=== Checking Node.js installation ==="
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Installing Node.js 18.x..."
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
    if [ "$PACKAGE_MANAGER" = "dnf" ]; then
        dnf install -y nodejs
    else
        yum install -y nodejs
    fi
else
    echo "Node.js already installed: $(node --version)"
fi

# Verify installations
echo ""
echo "=== Verification ==="
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"

if command -v xelatex &> /dev/null; then
    echo "XeLaTeX: $(xelatex --version | head -n 1)"
else
    echo "Warning: XeLaTeX not found in PATH"
    echo "You may need to add TeX Live to your PATH"
fi

if command -v pdftoppm &> /dev/null; then
    echo "pdftoppm: $(pdftoppm -v 2>&1 | head -n 1)"
else
    echo "Warning: pdftoppm not found"
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Upload your project files to the server"
echo "2. Run: npm install"
echo "3. Create .env file with your OpenRouter API key"
echo "4. Run: npm run build"
echo "5. Install PM2: npm install -g pm2"
echo "6. Start with PM2: pm2 start ecosystem.config.js"
echo ""
echo "For detailed instructions, see DEPLOYMENT.md"

