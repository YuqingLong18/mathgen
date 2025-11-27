#!/bin/bash
# Helper script to find your local IP address for sharing with colleagues

echo "Finding your local IP address..."
echo ""

# Try different methods based on OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    IP=$(hostname -I | awk '{print $1}')
else
    echo "Please run 'ipconfig' (Windows) or check your network settings"
    exit 1
fi

if [ -z "$IP" ]; then
    echo "Could not automatically detect IP address."
    echo "Please check manually:"
    echo "  macOS: ifconfig | grep 'inet '"
    echo "  Linux: hostname -I"
    echo "  Windows: ipconfig"
    exit 1
fi

echo "✓ Your local IP address is: $IP"
echo ""
echo "Share this URL with your colleagues:"
echo "  http://$IP:3088"
echo ""
echo "Make sure the server is running: npm run dev"

