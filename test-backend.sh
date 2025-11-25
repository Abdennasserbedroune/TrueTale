#!/bin/bash

# TrueTale Backend Test Script
# This script tests the backend API endpoints

echo "🧪 Testing TrueTale Backend API"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo "1️⃣  Testing Health Endpoint..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:5000/health)
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
BODY=$(echo "$HEALTH_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
    echo "   Response: $BODY"
else
    echo -e "${RED}✗ Health check failed (HTTP $HTTP_CODE)${NC}"
    echo "   Response: $BODY"
fi
echo ""

# Test 2: Register a new user
echo "2️⃣  Testing User Registration..."
TIMESTAMP=$(date +%s)
EMAIL="test${TIMESTAMP}@test.com"
USERNAME="user${TIMESTAMP}"

REGISTER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"username\":\"${USERNAME}\",\"password\":\"password123\",\"role\":\"reader\"}")

HTTP_CODE=$(echo "$REGISTER_RESPONSE" | tail -n1)
BODY=$(echo "$REGISTER_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}✓ Registration successful${NC}"
    echo "   Email: $EMAIL"
    echo "   Username: $USERNAME"
    # Extract access token
    ACCESS_TOKEN=$(echo "$BODY" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    echo "   Token: ${ACCESS_TOKEN:0:50}..."
elif [ "$HTTP_CODE" = "429" ]; then
    echo -e "${YELLOW}⚠ Rate limit hit (HTTP 429)${NC}"
    echo "   Please wait 15 minutes and try again"
    echo "   Or restart the backend server to reset the rate limit"
else
    echo -e "${RED}✗ Registration failed (HTTP $HTTP_CODE)${NC}"
    echo "   Response: $BODY"
fi
echo ""

# Test 3: Login
if [ "$HTTP_CODE" = "201" ]; then
    echo "3️⃣  Testing Login..."
    LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:5000/api/auth/login \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"${EMAIL}\",\"password\":\"password123\"}")

    HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
    BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ Login successful${NC}"
    else
        echo -e "${RED}✗ Login failed (HTTP $HTTP_CODE)${NC}"
        echo "   Response: $BODY"
    fi
    echo ""
fi

# Test 4: Check MongoDB
echo "4️⃣  Checking MongoDB Connection..."
if command -v mongosh &> /dev/null; then
    USER_COUNT=$(mongosh --quiet --eval "db.getSiblingDB('truetale').users.countDocuments()" 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ MongoDB connected${NC}"
        echo "   Total users in database: $USER_COUNT"
    else
        echo -e "${RED}✗ MongoDB connection failed${NC}"
        echo "   Make sure MongoDB is running: brew services start mongodb-community"
    fi
else
    echo -e "${YELLOW}⚠ mongosh not installed${NC}"
    echo "   Install with: brew install mongosh"
fi
echo ""

echo "================================"
echo "Test complete!"
