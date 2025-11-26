# Quick Start Deployment Guide - CentOS with BaoTa

This is a condensed version of the full deployment guide. For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Prerequisites Checklist

- [ ] CentOS 7/8/9 server with root access
- [ ] BaoTa panel installed
- [ ] OpenRouter API key ready

## Quick Deployment Steps

### 1. Run Automated Setup Script

```bash
# Download or upload setup script to server
chmod +x scripts/setup-centos.sh
sudo ./scripts/setup-centos.sh
```

This will install:
- Build tools
- XeLaTeX and Chinese language support
- Poppler utils (PDF conversion)
- Chinese fonts
- Node.js 18.x

### 2. Upload Project Files

```bash
# Option A: Using Git
cd /www/wwwroot
git clone <your-repo-url> mathgen
cd mathgen

# Option B: Using SCP (from local machine)
scp -r /path/to/mathgen/* root@your-server:/www/wwwroot/mathgen/
```

### 3. Install Dependencies

```bash
cd /www/wwwroot/mathgen
npm install --production
```

### 4. Configure Environment

```bash
# Create .env file
cat > .env << 'EOF'
OPENROUTER_API_KEY=your_key_here
OPENROUTER_MODEL=openai/gpt-4o
OPENROUTER_HTTP_REFERER=https://your-domain.com
OPENROUTER_X_TITLE=Solution Manual Generator
NODE_ENV=production
EOF

# Secure the file
chmod 600 .env
```

### 5. Create Required Directories

```bash
mkdir -p tmp downloads logs
chmod 755 tmp downloads logs
```

### 6. Build Application

```bash
npm run build
```

### 7. Install and Configure PM2

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup auto-start on boot
pm2 startup
# Follow the instructions shown
```

### 8. Configure BaoTa

1. **Create Site:**
   - Go to **网站** → **添加站点**
   - Domain: Your domain or IP
   - Root: `/www/wwwroot/mathgen`

2. **Setup Reverse Proxy:**
   - Go to site → **设置** → **反向代理**
   - Add proxy: `http://127.0.0.1:3088`

3. **Open Firewall Ports:**
   - Go to **安全**
   - Open ports: 80, 443, 3088

4. **SSL (Optional):**
   - Go to site → **设置** → **SSL**
   - Install Let's Encrypt certificate

### 9. Verify Installation

```bash
# Run verification script
chmod +x scripts/verify-installation.sh
./scripts/verify-installation.sh

# Check PM2 status
pm2 status
pm2 logs mathgen
```

### 10. Setup Automatic Cleanup (Optional)

```bash
# Make cleanup script executable
chmod +x scripts/cleanup.sh

# Add to crontab (runs daily at 2 AM)
crontab -e
# Add this line:
0 2 * * * /www/wwwroot/mathgen/scripts/cleanup.sh >> /www/wwwroot/mathgen/logs/cleanup.log 2>&1
```

## Common Commands

```bash
# View application status
pm2 status

# View logs
pm2 logs mathgen

# Restart application
pm2 restart mathgen

# Stop application
pm2 stop mathgen

# Monitor resources
pm2 monit

# Update and rebuild
cd /www/wwwroot/mathgen
git pull
npm install
npm run build
pm2 restart mathgen
```

## Troubleshooting Quick Fixes

**XeLaTeX not found:**
```bash
export PATH=/usr/local/texlive/2024/bin/x86_64-linux:$PATH
# Add to /etc/profile for permanent fix
```

**Port 3088 in use:**
```bash
lsof -i :3088
# Kill the process or change port in package.json
```

**Permission errors:**
```bash
chown -R www:www /www/wwwroot/mathgen
chmod -R 755 /www/wwwroot/mathgen
```

**502 Bad Gateway:**
- Check PM2: `pm2 status`
- Check if app is running: `curl http://127.0.0.1:3088`
- Check BaoTa reverse proxy settings

## File Structure After Deployment

```
/www/wwwroot/mathgen/
├── app/                    # Next.js application
├── lib/                    # Library files
├── tmp/                    # Temporary LaTeX files
├── downloads/              # Generated PDFs and .tex files
├── logs/                   # PM2 logs
├── .env                    # Environment variables (secure!)
├── ecosystem.config.js     # PM2 configuration
├── package.json
└── scripts/
    ├── cleanup.sh          # Cleanup script
    ├── verify-installation.sh
    └── setup-centos.sh
```

## Important Notes

1. **LaTeX Installation:** The automated script installs TeX Live via package manager. For full TeX Live installation, see DEPLOYMENT.md section "LaTeX Environment Installation - Option B".

2. **Environment Variables:** Next.js may require environment variables to be set in PM2's ecosystem.config.js for production. See DEPLOYMENT.md troubleshooting section.

3. **Security:** 
   - Keep `.env` file secure (chmod 600)
   - Regularly update dependencies
   - Monitor logs for suspicious activity

4. **Backup:** Regularly backup:
   - Application code
   - `.env` file (securely)
   - PM2 configuration

## Need Help?

- Full documentation: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- Check logs: `pm2 logs mathgen`
- Verify installation: `./scripts/verify-installation.sh`

