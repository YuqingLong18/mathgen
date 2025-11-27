#!/bin/bash
# Cleanup script for temporary and old download files
# Run this script daily via cron to prevent disk space issues

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
TMP_DIR="$PROJECT_DIR/tmp"
DOWNLOADS_DIR="$PROJECT_DIR/downloads"

# Clean temporary files older than 24 hours
echo "$(date): Cleaning temporary files older than 24 hours..."
find "$TMP_DIR" -type f -mtime +1 -delete 2>/dev/null
find "$TMP_DIR" -type d -empty -delete 2>/dev/null

# Clean download files older than 7 days
echo "$(date): Cleaning download files older than 7 days..."
find "$DOWNLOADS_DIR" -type f -mtime +7 -delete 2>/dev/null

echo "$(date): Cleanup completed."

