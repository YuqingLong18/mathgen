# Deployment Guide: CentOS Server with BaoTa Interface

This guide provides detailed steps to deploy the Solution Manual Generator on a CentOS server using BaoTa (宝塔) panel.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Environment Setup](#server-environment-setup)
3. [LaTeX Environment Installation](#latex-environment-installation)
4. [Node.js Installation](#nodejs-installation)
5. [Project Deployment](#project-deployment)
6. [BaoTa Configuration](#baota-configuration)
7. [Process Management](#process-management)
8. [Firewall Configuration](#firewall-configuration)
9. [Testing and Verification](#testing-and-verification)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- CentOS 7/8/9 server with root or sudo access
- BaoTa panel installed and accessible
- SSH access to the server
- Domain name (optional, for production) or server IP address
- OpenRouter API key ([Get one here](https://openrouter.ai/keys))

---

## Server Environment Setup

### 1. Connect to Your Server

```bash
ssh root@your-server-ip
```

### 2. Update System Packages

```bash
# For CentOS 7
sudo yum update -y

# For CentOS 8/9
sudo dnf update -y
```

### 3. Install Essential Build Tools

```bash
# CentOS 7
sudo yum groupinstall "Development Tools" -y
sudo yum install -y gcc gcc-c++ make

# CentOS 8/9
sudo dnf groupinstall "Development Tools" -y
sudo dnf install -y gcc gcc-c++ make
```

---

## LaTeX Environment Installation

The project uses **XeLaTeX** for LaTeX compilation with support for Chinese/English characters. This is critical for the application to work.

### 1. Install TeX Live (Full Distribution)

**Option A: Install via BaoTa (Recommended)**

1. Log into BaoTa panel
2. Go to **软件商店** (Software Store)
3. Search for "TeX Live" or install via terminal

**Option B: Manual Installation**

```bash
# Download TeX Live installer
cd /tmp
wget https://mirror.ctan.org/systems/texlive/tlnet/install-tl-unx.tar.gz
tar -xzf install-tl-unx.tar.gz

# Find the extracted directory (handle case where multiple directories exist)
INSTALL_DIR=$(ls -d install-tl-* | head -n 1)
cd "$INSTALL_DIR"

# Create a profile file for automated installation
cat > /tmp/texlive.profile << 'EOF'
selected_scheme scheme-full
TEXDIR /usr/local/texlive/2024
TEXMFLOCAL /usr/local/texlive/texmf-local
TEXMFHOME ~/texmf
TEXMFVAR ~/.texlive2024/texmf-var
TEXMFCONFIG ~/.texlive2024/texmf-config
collection-fontsrecommended 1
collection-langchinese 1
collection-langcjk 1
instopt_adjustpath 1
instopt_adjustrepo 1
instopt_letter 0
instopt_portable 0
EOF

# Run installer (this will take 30-60 minutes)
sudo ./install-tl --profile=/tmp/texlive.profile --no-interaction
```

**Option C: Install via EPEL Repository (Easier but may be outdated)**

```bash
# Enable EPEL repository
sudo yum install -y epel-release  # CentOS 7
# or
sudo dnf install -y epel-release  # CentOS 8/9

# Install TeX Live packages
sudo yum install -y texlive-xetex texlive-lang-chinese texlive-collection-fontsrecommended
# or
sudo dnf install -y texlive-xetex texlive-lang-chinese texlive-collection-fontsrecommended
```

### 2. Add TeX Live to PATH

```bash
# Add to system PATH (for all users)
echo 'export PATH=/usr/local/texlive/2024/bin/x86_64-linux:$PATH' | sudo tee -a /etc/profile
echo 'export MANPATH=/usr/local/texlive/2024/texmf-dist/doc/man:$MANPATH' | sudo tee -a /etc/profile
echo 'export INFOPATH=/usr/local/texlive/2024/texmf-dist/doc/info:$INFOPATH' | sudo tee -a /etc/profile

# Reload profile
source /etc/profile

# Verify installation
xelatex --version
```

**Note:** If you installed via EPEL, the PATH may already be set. Verify with:
```bash
which xelatex
```

### 3. Install Poppler Utils (for PDF to Image Conversion)

```bash
# CentOS 7
sudo yum install -y poppler-utils

# CentOS 8/9
sudo dnf install -y poppler-utils

# Verify installation
pdftoppm -v
```

### 4. Install Chinese Fonts (Optional but Recommended)

For proper Chinese character rendering in PDFs:

```bash
# Install common Chinese fonts
sudo yum install -y wqy-microhei-fonts wqy-zenhei-fonts  # CentOS 7
# or
sudo dnf install -y wqy-microhei-fonts wqy-zenhei-fonts  # CentOS 8/9

# Verify fonts are available
fc-list :lang=zh
```

---

## Node.js Installation

### Option A: Install via BaoTa

1. Log into BaoTa panel
2. Go to **软件商店** (Software Store)
3. Search for "Node.js" and install Node.js 18.x or higher
4. BaoTa will automatically manage Node.js versions

### Option B: Install via NodeSource Repository

```bash
# Install Node.js 18.x (LTS)
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs  # CentOS 7
# or
sudo dnf install -y nodejs  # CentOS 8/9

# Verify installation
node --version  # Should be v18.x.x or higher
npm --version
```

### Option C: Install via NVM (Node Version Manager)

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell
source ~/.bashrc

# Install Node.js 18
nvm install 18
nvm use 18
nvm alias default 18

# Verify
node --version
npm --version
```

---

## Project Deployment

### 1. Create Application Directory

```bash
# Create directory for the application
sudo mkdir -p /www/wwwroot/mathgen
cd /www/wwwroot/mathgen

# Or use a custom location
sudo mkdir -p /opt/mathgen
cd /opt/mathgen
```

### 2. Upload Project Files

**Option A: Using Git (Recommended)**

```bash
# Install Git if not already installed
sudo yum install -y git  # CentOS 7
# or
sudo dnf install -y git  # CentOS 8/9

# Clone the repository
cd /www/wwwroot/mathgen
git clone https://github.com/your-username/mathgen.git .

# Or if using SSH
git clone git@github.com:your-username/mathgen.git .
```

**Option B: Using BaoTa File Manager**

1. Log into BaoTa panel
2. Go to **文件** (Files)
3. Navigate to `/www/wwwroot/`
4. Create folder `mathgen`
5. Upload project files via **上传** (Upload) or use SFTP

**Option C: Using SCP from Local Machine**

```bash
# From your local machine
scp -r /path/to/mathgen/* root@your-server-ip:/www/wwwroot/mathgen/
```

### 3. Install Project Dependencies

```bash
cd /www/wwwroot/mathgen

# Install dependencies
npm install --production

# If you need to build from source
npm install
```

### 4. Create Required Directories

```bash
cd /www/wwwroot/mathgen

# Create tmp and downloads directories
mkdir -p tmp downloads

# Set proper permissions
chmod 755 tmp downloads
chown -R www:www tmp downloads  # Adjust user/group as needed
```

### 5. Configure Environment Variables

```bash
cd /www/wwwroot/mathgen

# Create .env file
cat > .env << 'EOF'
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=openai/gpt-4o
OPENROUTER_HTTP_REFERER=https://your-domain.com
OPENROUTER_X_TITLE=Solution Manual Generator
NODE_ENV=production
EOF

# Edit the file with your actual values
nano .env

# Set secure permissions
chmod 600 .env
```

**Important:** Replace `your_openrouter_api_key_here` with your actual OpenRouter API key and update the HTTP_REFERER with your domain or IP.

### 6. Build the Application

```bash
cd /www/wwwroot/mathgen

# Build Next.js application
npm run build
```

---

## BaoTa Configuration

### 1. Create Site in BaoTa

1. Log into BaoTa panel
2. Go to **网站** (Website) → **添加站点** (Add Site)
3. Fill in:
   - **域名** (Domain): Your domain or IP address
   - **备注** (Note): MathGen Application
   - **根目录** (Root Directory): `/www/wwwroot/mathgen`
   - **PHP版本** (PHP Version): Not required (this is Node.js)
4. Click **提交** (Submit)

### 2. Configure Reverse Proxy

Since this is a Node.js application running on port 3088, you need to set up a reverse proxy:

1. In BaoTa, go to your site → **设置** (Settings)
2. Click **反向代理** (Reverse Proxy)
3. Click **添加反向代理** (Add Reverse Proxy)
4. Configure:
   - **代理名称** (Proxy Name): `mathgen-api`
   - **目标URL** (Target URL): `http://127.0.0.1:3088`
   - **发送域名** (Send Domain): `$host`
   - **缓存** (Cache): Disabled
5. Click **提交** (Submit)

**Alternative: Direct Port Access**

If you prefer direct port access without reverse proxy:
1. In BaoTa, go to **安全** (Security)
2. Open port 3088 in firewall
3. Access directly via `http://your-domain:3088`

### 3. Configure SSL Certificate (Optional but Recommended)

1. In BaoTa, go to your site → **设置** (Settings) → **SSL**
2. Choose **Let's Encrypt** (free SSL)
3. Enter your email and domain
4. Click **申请** (Apply)
5. Enable **强制HTTPS** (Force HTTPS)

---

## Process Management

The application needs to run continuously. Use PM2 for process management.

### 1. Install PM2

```bash
# Install PM2 globally
npm install -g pm2

# Or via BaoTa (if available in Software Store)
```

### 2. Create PM2 Configuration

```bash
cd /www/wwwroot/mathgen

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'mathgen',
    script: 'npm',
    args: 'start',
    cwd: '/www/wwwroot/mathgen',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3088
    },
    error_file: '/www/wwwroot/mathgen/logs/pm2-error.log',
    out_file: '/www/wwwroot/mathgen/logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
}
EOF

# Create logs directory
mkdir -p logs
```

### 3. Start Application with PM2

```bash
cd /www/wwwroot/mathgen

# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the instructions shown (usually involves running a sudo command)
```

### 4. PM2 Management Commands

```bash
# View application status
pm2 status

# View logs
pm2 logs mathgen

# Restart application
pm2 restart mathgen

# Stop application
pm2 stop mathgen

# Monitor application
pm2 monit
```

### 5. Configure PM2 in BaoTa (Optional)

If BaoTa has PM2 plugin:
1. Go to **软件商店** (Software Store)
2. Search for "PM2"
3. Install and configure through BaoTa interface

---

## Firewall Configuration

### 1. Configure Firewall via BaoTa

1. Log into BaoTa panel
2. Go to **安全** (Security)
3. Open port **3088** (if using direct access)
4. Open port **80** and **443** (for web access)

### 2. Configure Firewall via Command Line

```bash
# For firewalld (CentOS 7/8/9)
sudo firewall-cmd --permanent --add-port=3088/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload

# For iptables (if firewalld is not used)
sudo iptables -A INPUT -p tcp --dport 3088 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo service iptables save  # CentOS 7
# or
sudo iptables-save > /etc/sysconfig/iptables  # CentOS 8/9
```

---

## Testing and Verification

### 1. Verify LaTeX Installation

```bash
# Test XeLaTeX
xelatex --version

# Test PDF conversion
pdftoppm -v

# Test LaTeX compilation (create a test file)
cat > /tmp/test.tex << 'EOF'
\documentclass{article}
\begin{document}
Hello World! 你好世界!
\end{document}
EOF

cd /tmp
xelatex test.tex

# Check if PDF was created
ls -lh test.pdf
```

### 2. Verify Node.js Application

```bash
cd /www/wwwroot/mathgen

# Check if application starts
npm start

# In another terminal, test the endpoint
curl http://localhost:3088
```

### 3. Verify PM2 Status

```bash
pm2 status
pm2 logs mathgen --lines 50
```

### 4. Test Web Interface

1. Open browser and navigate to your domain or `http://your-server-ip:3088`
2. Try uploading a test image or PDF
3. Verify file download works

---

## Troubleshooting

### LaTeX Compilation Fails

**Problem:** `xelatex: command not found`

**Solution:**
```bash
# Check if XeLaTeX is in PATH
which xelatex

# If not found, add to PATH
export PATH=/usr/local/texlive/2024/bin/x86_64-linux:$PATH
# Add to /etc/profile for permanent fix
```

**Problem:** Font errors during compilation

**Solution:**
```bash
# Install Chinese fonts
sudo yum install -y wqy-microhei-fonts wqy-zenhei-fonts

# Update font cache
fc-cache -fv
```

**Problem:** Missing LaTeX packages

**Solution:**
```bash
# Install missing packages via tlmgr
tlmgr install <package-name>
tlmgr update --self --all
```

### PDF Conversion Fails

**Problem:** `pdftoppm: command not found`

**Solution:**
```bash
# Install poppler-utils
sudo yum install -y poppler-utils
```

### Node.js Application Won't Start

**Problem:** Port 3088 already in use

**Solution:**
```bash
# Find process using port 3088
lsof -i :3088
# or
netstat -tulpn | grep 3088

# Kill the process or change port in package.json
```

**Problem:** Permission denied errors

**Solution:**
```bash
# Check directory permissions
ls -la /www/wwwroot/mathgen

# Fix permissions
chown -R www:www /www/wwwroot/mathgen
chmod -R 755 /www/wwwroot/mathgen
chmod 600 /www/wwwroot/mathgen/.env
```

### PM2 Issues

**Problem:** PM2 not starting on boot

**Solution:**
```bash
# Re-run PM2 startup
pm2 startup
# Follow the instructions and run the provided command with sudo
pm2 save
```

**Problem:** Application crashes frequently

**Solution:**
```bash
# Check logs
pm2 logs mathgen --lines 100

# Check memory usage
pm2 monit

# Increase memory limit in ecosystem.config.js
# max_memory_restart: '2G'
```

### BaoTa Reverse Proxy Issues

**Problem:** 502 Bad Gateway

**Solution:**
1. Verify Node.js app is running: `pm2 status`
2. Check if port 3088 is accessible: `curl http://127.0.0.1:3088`
3. Check BaoTa reverse proxy configuration
4. Check Nginx error logs in BaoTa

**Problem:** Static files not loading

**Solution:**
1. In BaoTa, go to site settings → **反向代理** (Reverse Proxy)
2. Ensure proxy configuration includes static file handling
3. Or configure static file serving separately

### Environment Variables Not Loading

**Problem:** API key not found

**Solution:**
```bash
# Verify .env file exists and has correct permissions
ls -la /www/wwwroot/mathgen/.env

# Check if variables are loaded
cd /www/wwwroot/mathgen
node -e "require('dotenv').config(); console.log(process.env.OPENROUTER_API_KEY)"

# Note: Next.js may need environment variables set differently
# Check Next.js documentation for production environment variables
```

**For Next.js production, you may need to set environment variables in PM2:**

```bash
# Edit ecosystem.config.js
env: {
  NODE_ENV: 'production',
  PORT: 3088,
  OPENROUTER_API_KEY: 'your_key_here',
  OPENROUTER_MODEL: 'openai/gpt-4o'
}
```

---

## Maintenance

### Regular Tasks

1. **Update Dependencies:**
```bash
cd /www/wwwroot/mathgen
npm update
npm run build
pm2 restart mathgen
```

2. **Clean Temporary Files:**
```bash
# Create a cleanup script
cat > /www/wwwroot/mathgen/cleanup.sh << 'EOF'
#!/bin/bash
# Clean files older than 24 hours
find /www/wwwroot/mathgen/tmp -type f -mtime +1 -delete
find /www/wwwroot/mathgen/downloads -type f -mtime +7 -delete
EOF

chmod +x /www/wwwroot/mathgen/cleanup.sh

# Add to crontab (run daily at 2 AM)
crontab -e
# Add: 0 2 * * * /www/wwwroot/mathgen/cleanup.sh
```

3. **Monitor Logs:**
```bash
# Check PM2 logs regularly
pm2 logs mathgen --lines 100

# Check system resources
pm2 monit
```

4. **Backup:**
```bash
# Backup application and configuration
tar -czf mathgen-backup-$(date +%Y%m%d).tar.gz \
  /www/wwwroot/mathgen \
  /root/.pm2
```

---

## Security Considerations

1. **Keep .env file secure:**
   - Never commit .env to version control
   - Use `chmod 600 .env`
   - Regularly rotate API keys

2. **Update regularly:**
   - Keep Node.js updated
   - Keep system packages updated
   - Keep dependencies updated

3. **Monitor access:**
   - Review PM2 logs regularly
   - Monitor failed login attempts
   - Set up fail2ban if needed

4. **File upload limits:**
   - Already configured in `next.config.js` (10MB limit)
   - Consider adding rate limiting for API endpoints

---

## Additional Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [TeX Live Documentation](https://www.tug.org/texlive/)
- [BaoTa Panel Documentation](https://www.bt.cn/bbs/)

---

## Summary Checklist

- [ ] System packages updated
- [ ] XeLaTeX installed and in PATH
- [ ] Poppler utils installed
- [ ] Chinese fonts installed (if needed)
- [ ] Node.js 18+ installed
- [ ] Project files uploaded
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file configured
- [ ] Application built (`npm run build`)
- [ ] PM2 installed and configured
- [ ] Application running via PM2
- [ ] Firewall ports opened
- [ ] BaoTa reverse proxy configured (if using)
- [ ] SSL certificate installed (if using domain)
- [ ] Test upload and download functionality
- [ ] Cleanup script configured
- [ ] Backup strategy in place

---

**Last Updated:** 2025-01-27

