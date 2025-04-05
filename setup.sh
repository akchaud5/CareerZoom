#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}   CareerZoom Setup Script      ${NC}"
echo -e "${BLUE}================================${NC}"

# Check if Node.js is installed
echo -e "\n${YELLOW}Checking for Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js v14 or later.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}Node.js ${NODE_VERSION} is installed.${NC}"

# Check if MongoDB is running
echo -e "\n${YELLOW}Checking MongoDB connection...${NC}"
if ! command -v mongosh &> /dev/null; then
    echo -e "${RED}MongoDB command-line tools are not installed.${NC}"
    echo -e "${YELLOW}Please make sure MongoDB is installed and running.${NC}"
else
    # Try to connect to MongoDB
    if ! mongosh --eval "db.version()" --quiet &> /dev/null; then
        echo -e "${RED}Could not connect to MongoDB. Please make sure MongoDB is running.${NC}"
    else
        echo -e "${GREEN}Successfully connected to MongoDB.${NC}"
    fi
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "\n${YELLOW}Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${GREEN}.env file created. Please edit this file to add your API keys and secrets.${NC}"
else
    echo -e "\n${YELLOW}.env file already exists. Skipping.${NC}"
fi

# Install server dependencies
echo -e "\n${YELLOW}Installing server dependencies...${NC}"
npm install

# Install client dependencies
echo -e "\n${YELLOW}Installing client dependencies...${NC}"
cd client
npm install
cd ..

echo -e "\n${GREEN}Setup complete!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Edit the ${BLUE}.env${NC} file with your Zoom SDK and OpenAI API credentials"
echo -e "2. Start the development server with ${BLUE}npm run dev:full${NC}"
echo -e "3. Open ${BLUE}http://localhost:3000${NC} in your browser\n"