#!/bin/bash

# 🚀 Quick Deploy Script for Dor Games
# This script builds and uploads your app to your NGINX server

echo "🎮 Dor Games Deployment Script"
echo "================================"
echo ""

# Configuration (EDIT THESE VALUES)
SERVER_USER="dor_game1"
SERVER_HOST="167.235.90.88"
SERVER_PORT="22"
SERVER_PATH="~/public_html"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}📝 Configuration:${NC}"
echo "   Server: ${SERVER_USER}@${SERVER_HOST}"
echo "   Path: ${SERVER_PATH}"
echo ""

# Check if configuration is set
if [ "$SERVER_USER" == "your_username" ] || [ "$SERVER_HOST" == "your_server_ip" ] || [ -z "$SERVER_PORT" ]; then
    echo -e "${RED}⚠️  Please edit deploy.sh and set your server details first!${NC}"
    echo "   Edit SERVER_USER, SERVER_HOST, and SERVER_PATH at the top of this file."
    exit 1
fi

# Step 1: Build the app
echo -e "${BLUE}📦 Building production version...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build completed successfully!${NC}"
echo ""

# Step 2: Upload to server
echo -e "${BLUE}📤 Uploading files to server...${NC}"
echo "   This may take a moment..."
echo ""

scp -P ${SERVER_PORT} -r dist/* ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Upload failed!${NC}"
    echo "   Make sure you can SSH into your server and the path exists."
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Files uploaded successfully!${NC}"
echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "Your app should now be live at:"
echo "   http://${SERVER_HOST}"
echo ""
echo "If this is your first deployment, make sure NGINX is configured."
echo "See DEPLOYMENT_GUIDE.md for NGINX setup instructions."



