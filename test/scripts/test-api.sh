#!/bin/bash

###############################################################################

# Automated API Tests for Vehicle Registry
#
# This script runs 13 automated test scenarios that align with API_TESTING.md
# Tests cover:
#   - Core requirements (Tests 1-9)
#   - Extra 1: Authorized drivers (Test 10)
#   - Extra 3: Ownership history (Test 11)
#   - Bonus: Pagination (Tests 12-13)
#
# Usage: npm run test:api
# Requires: Server running (npm run dev) and database seeded (npm run seed)
#
# Reference: See API_TESTING.md for detailed scenario documentation

###############################################################################

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_URL="http://localhost:3000"

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  Vehicle Registry API Tests${NC}"
echo -e "${BLUE}================================${NC}\n"

# Get user IDs from database using Prisma (reads credentials from .env)
echo -e "${YELLOW}📊 Getting test user IDs from database...${NC}"
USER_DATA=$(ts-node test/scripts/get-test-users.ts 2>/dev/null)

if [ -z "$USER_DATA" ]; then
  echo -e "${RED}❌ Could not fetch users from database. Run 'npm run seed' first!${NC}\n"
  exit 1
fi

# Parse JSON response
USER1_ID=$(echo $USER_DATA | jq -r '.USER1_ID')
USER2_ID=$(echo $USER_DATA | jq -r '.USER2_ID')
USER3_ID=$(echo $USER_DATA | jq -r '.USER3_ID')
USER4_ID=$(echo $USER_DATA | jq -r '.USER4_ID')
USER5_ID=$(echo $USER_DATA | jq -r '.USER5_ID')
VEHICLE_ID=$(echo $USER_DATA | jq -r '.VEHICLE_ID')

if [ -z "$USER1_ID" ] || [ "$USER1_ID" = "null" ]; then
  echo -e "${RED}❌ Users not found in database. Run 'npm run seed' first!${NC}\n"
  exit 1
fi

echo -e "${GREEN}✅ Found test users${NC}\n"

# Test 1: Register a new vehicle (SUCCESS)
echo -e "${YELLOW}Test 1: Register new vehicle for user with valid license${NC}"
echo -e "POST ${API_URL}/vehiculos"
# Use timestamp to ensure unique matricula
UNIQUE_PLATE="TEST$(date +%s)"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST ${API_URL}/vehiculos \
  -H "Content-Type: application/json" \
  -d '{
    "marca": "Ford",
    "modelo": "Focus",
    "matricula": "'"${UNIQUE_PLATE}"'",
    "tipo": "coche",
    "propietario_id": "'"${USER1_ID}"'"
  }')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "201" ]; then
  echo -e "${GREEN}✅ Status: 201 Created${NC}"

  # Validate business model format
  HAS_PROPIETARIO=$(echo "$BODY" | jq 'has("propietario")')
  HAS_PROPIETARIO_ID=$(echo "$BODY" | jq 'has("propietarioId")')
  HAS_CREATED_AT=$(echo "$BODY" | jq 'has("createdAt")')

  if [ "$HAS_PROPIETARIO" = "true" ] && [ "$HAS_PROPIETARIO_ID" = "false" ] && [ "$HAS_CREATED_AT" = "false" ]; then
    echo -e "${GREEN}✅ Business model format correct (propietario object, no internal fields)${NC}"
  else
    echo -e "${RED}⚠️  Warning: Response format doesn't match business model${NC}"
    echo -e "   Has propietario: $HAS_PROPIETARIO | Has propietarioId: $HAS_PROPIETARIO_ID | Has createdAt: $HAS_CREATED_AT"
  fi

  echo -e "Response: ${BODY}\n"
else
  echo -e "${RED}❌ Status: ${HTTP_CODE}${NC}"
  echo -e "Response: ${BODY}\n"
fi

# Test 2: Register vehicle with wrong license type (FAIL)
echo -e "${YELLOW}Test 2: Try to register coche with Type A license (should fail)${NC}"
echo -e "POST ${API_URL}/vehiculos"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST ${API_URL}/vehiculos \
  -H "Content-Type: application/json" \
  -d '{
    "marca": "Volkswagen",
    "modelo": "Golf",
    "matricula": "TEST002",
    "tipo": "coche",
    "propietario_id": "'"${USER2_ID}"'"
  }')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "400" ]; then
  echo -e "${GREEN}✅ Status: 400 Bad Request (Expected)${NC}"
  echo -e "Response: ${BODY}\n"
else
  echo -e "${RED}❌ Status: ${HTTP_CODE} (Expected 400)${NC}"
  echo -e "Response: ${BODY}\n"
fi

# Test 3: Register vehicle with expired license (FAIL)
echo -e "${YELLOW}Test 3: Try to register vehicle with expired license (should fail)${NC}"
echo -e "POST ${API_URL}/vehiculos"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST ${API_URL}/vehiculos \
  -H "Content-Type: application/json" \
  -d '{
    "marca": "Seat",
    "modelo": "Ibiza",
    "matricula": "TEST003",
    "tipo": "coche",
    "propietario_id": "'"${USER4_ID}"'"
  }')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "400" ]; then
  echo -e "${GREEN}✅ Status: 400 Bad Request (Expected)${NC}"
  echo -e "Response: ${BODY}\n"
else
  echo -e "${RED}❌ Status: ${HTTP_CODE} (Expected 400)${NC}"
  echo -e "Response: ${BODY}\n"
fi

# Test 4: Register vehicle with duplicate matricula (FAIL)
echo -e "${YELLOW}Test 4: Try to register vehicle with duplicate matricula (should fail)${NC}"
echo -e "POST ${API_URL}/vehiculos"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST ${API_URL}/vehiculos \
  -H "Content-Type: application/json" \
  -d '{
    "marca": "Toyota",
    "modelo": "Yaris",
    "matricula": "1234ABC",
    "tipo": "coche",
    "propietario_id": "'"${USER1_ID}"'"
  }')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "409" ]; then
  echo -e "${GREEN}✅ Status: 409 Conflict (Expected)${NC}"
  echo -e "Response: ${BODY}\n"
else
  echo -e "${RED}❌ Status: ${HTTP_CODE} (Expected 409)${NC}"
  echo -e "Response: ${BODY}\n"
fi

# Test 5: Get all users
echo -e "${YELLOW}Test 5: Get all users${NC}"
echo -e "GET ${API_URL}/usuarios"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET ${API_URL}/usuarios)

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "200" ]; then
  USER_COUNT=$(echo "$BODY" | jq '. | length')
  echo -e "${GREEN}✅ Status: 200 OK${NC}"

  # Validate business model format (should NOT have createdAt/updatedAt)
  FIRST_USER_HAS_CREATED=$(echo "$BODY" | jq '.[0] | has("createdAt")')
  if [ "$FIRST_USER_HAS_CREATED" = "false" ]; then
    echo -e "${GREEN}✅ Business model format correct (no internal fields)${NC}"
  else
    echo -e "${RED}⚠️  Warning: Users have internal fields (createdAt)${NC}"
  fi

  echo -e "Response: Found ${USER_COUNT} users\n"
else
  echo -e "${RED}❌ Status: ${HTTP_CODE}${NC}"
  echo -e "Response: ${BODY}\n"
fi

# Test 6: Get all vehicles
echo -e "${YELLOW}Test 6: Get all vehicles${NC}"
echo -e "GET ${API_URL}/vehiculos"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET ${API_URL}/vehiculos)

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "200" ]; then
  VEHICLE_COUNT=$(echo "$BODY" | jq '. | length')
  echo -e "${GREEN}✅ Status: 200 OK${NC}"

  # Validate business model format
  FIRST_HAS_PROPIETARIO=$(echo "$BODY" | jq '.[0] | has("propietario")')
  FIRST_HAS_PROPIETARIO_ID=$(echo "$BODY" | jq '.[0] | has("propietarioId")')
  FIRST_HAS_CREATED=$(echo "$BODY" | jq '.[0] | has("createdAt")')

  if [ "$FIRST_HAS_PROPIETARIO" = "true" ] && [ "$FIRST_HAS_PROPIETARIO_ID" = "false" ] && [ "$FIRST_HAS_CREATED" = "false" ]; then
    echo -e "${GREEN}✅ Business model format correct (propietario object, no internal fields)${NC}"
  else
    echo -e "${RED}⚠️  Warning: Vehicle format doesn't match business model${NC}"
  fi

  echo -e "Response: Found ${VEHICLE_COUNT} vehicles\n"
else
  echo -e "${RED}❌ Status: ${HTTP_CODE}${NC}"
  echo -e "Response: ${BODY}\n"
fi

# Test 7: List user vehicles
echo -e "${YELLOW}Test 7: Get vehicles for user 1${NC}"
echo -e "GET ${API_URL}/usuarios/${USER1_ID}/vehiculos"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET ${API_URL}/usuarios/${USER1_ID}/vehiculos)

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ Status: 200 OK${NC}"

  # Validate business model format (vehicles should have propietario object, no internal fields)
  VEHICLE_COUNT=$(echo "$BODY" | jq '. | length')
  if [ "$VEHICLE_COUNT" -gt "0" ]; then
    FIRST_HAS_PROPIETARIO=$(echo "$BODY" | jq '.[0] | has("propietario")')
    FIRST_HAS_PROPIETARIO_ID=$(echo "$BODY" | jq '.[0] | has("propietarioId")')
    FIRST_HAS_CREATED=$(echo "$BODY" | jq '.[0] | has("createdAt")')

    if [ "$FIRST_HAS_PROPIETARIO" = "true" ] && [ "$FIRST_HAS_PROPIETARIO_ID" = "false" ] && [ "$FIRST_HAS_CREATED" = "false" ]; then
      echo -e "${GREEN}✅ Business model format correct (propietario object, no internal fields)${NC}"
    else
      echo -e "${RED}⚠️  Warning: Vehicle format doesn't match business model${NC}"
      echo -e "   Has propietario: $FIRST_HAS_PROPIETARIO | Has propietarioId: $FIRST_HAS_PROPIETARIO_ID | Has createdAt: $FIRST_HAS_CREATED"
    fi
  fi

  echo -e "Response: ${BODY}\n"
else
  echo -e "${RED}❌ Status: ${HTTP_CODE}${NC}"
  echo -e "Response: ${BODY}\n"
fi

# Test 8: Transfer ownership (SUCCESS)
echo -e "${YELLOW}Test 8: Transfer coche from User1 to User5 (both have License B)${NC}"
echo -e "PUT ${API_URL}/vehiculos/${VEHICLE_ID}/propietario"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X PUT ${API_URL}/vehiculos/${VEHICLE_ID}/propietario \
  -H "Content-Type: application/json" \
  -d '{
    "nuevo_propietario_id": "'"${USER5_ID}"'"
  }')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ Status: 200 OK${NC}"

  # Validate business model format
  HAS_PROPIETARIO=$(echo "$BODY" | jq 'has("propietario")')
  HAS_PROPIETARIO_ID=$(echo "$BODY" | jq 'has("propietarioId")')
  NEW_OWNER_ID=$(echo "$BODY" | jq -r '.propietario.id')

  if [ "$HAS_PROPIETARIO" = "true" ] && [ "$HAS_PROPIETARIO_ID" = "false" ] && [ "$NEW_OWNER_ID" = "$USER5_ID" ]; then
    echo -e "${GREEN}✅ Business model correct & ownership transferred to User5${NC}"
  else
    echo -e "${RED}⚠️  Warning: Response format issue${NC}"
  fi

  echo -e "Response: ${BODY}\n"
else
  echo -e "${RED}❌ Status: ${HTTP_CODE}${NC}"
  echo -e "Response: ${BODY}\n"
fi

# Test 9: Transfer to same owner (FAIL)
echo -e "${YELLOW}Test 9: Try to transfer to same owner (should fail)${NC}"
echo -e "PUT ${API_URL}/vehiculos/${VEHICLE_ID}/propietario"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X PUT ${API_URL}/vehiculos/${VEHICLE_ID}/propietario \
  -H "Content-Type: application/json" \
  -d '{
    "nuevo_propietario_id": "'"${USER5_ID}"'"
  }')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "400" ]; then
  echo -e "${GREEN}✅ Status: 400 Bad Request (Expected)${NC}"
  echo -e "Response: ${BODY}\n"
else
  echo -e "${RED}❌ Status: ${HTTP_CODE} (Expected 400)${NC}"
  echo -e "Response: ${BODY}\n"
fi

# Test 10: Add authorized driver (SUCCESS)
echo -e "${YELLOW}Test 10: Add authorized driver to vehicle${NC}"
echo -e "POST ${API_URL}/vehiculos/${VEHICLE_ID}/conductores"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST ${API_URL}/vehiculos/${VEHICLE_ID}/conductores \
  -H "Content-Type: application/json" \
  -d '{
    "conductor_id": "'"${USER1_ID}"'"
  }')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "201" ]; then
  echo -e "${GREEN}✅ Status: 201 Created${NC}"

  # Validate business model format (should have 'driver' object, not 'userId')
  HAS_DRIVER=$(echo "$BODY" | jq 'has("driver")')
  HAS_USER_ID=$(echo "$BODY" | jq 'has("userId")')
  HAS_CREATED_AT=$(echo "$BODY" | jq 'has("createdAt")')

  if [ "$HAS_DRIVER" = "true" ] && [ "$HAS_USER_ID" = "false" ] && [ "$HAS_CREATED_AT" = "false" ]; then
    echo -e "${GREEN}✅ Business model format correct (driver object, no internal fields)${NC}"
  else
    echo -e "${RED}⚠️  Warning: Response format doesn't match business model${NC}"
    echo -e "   Has driver: $HAS_DRIVER | Has userId: $HAS_USER_ID | Has createdAt: $HAS_CREATED_AT"
  fi

  echo -e "Response: ${BODY}\n"
else
  echo -e "${RED}❌ Status: ${HTTP_CODE}${NC}"
  echo -e "Response: ${BODY}\n"
fi

# Test 11: Get ownership history (SUCCESS)
echo -e "${YELLOW}Test 11: Get vehicle ownership history${NC}"
echo -e "GET ${API_URL}/vehiculos/${VEHICLE_ID}/historial"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET ${API_URL}/vehiculos/${VEHICLE_ID}/historial)

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "200" ]; then
  HISTORY_COUNT=$(echo "$BODY" | jq '. | length')
  echo -e "${GREEN}✅ Status: 200 OK${NC}"

  # Validate business model format (should have 'owner' object, not 'userId')
  if [ "$HISTORY_COUNT" -gt "0" ]; then
    FIRST_HAS_OWNER=$(echo "$BODY" | jq '.[0] | has("owner")')
    FIRST_HAS_USER_ID=$(echo "$BODY" | jq '.[0] | has("userId")')
    FIRST_HAS_CREATED=$(echo "$BODY" | jq '.[0] | has("createdAt")')

    if [ "$FIRST_HAS_OWNER" = "true" ] && [ "$FIRST_HAS_USER_ID" = "false" ] && [ "$FIRST_HAS_CREATED" = "false" ]; then
      echo -e "${GREEN}✅ Business model format correct (owner object, no internal fields)${NC}"
    else
      echo -e "${RED}⚠️  Warning: History format doesn't match business model${NC}"
      echo -e "   Has owner: $FIRST_HAS_OWNER | Has userId: $FIRST_HAS_USER_ID | Has createdAt: $FIRST_HAS_CREATED"
    fi
  fi

  echo -e "Response: Found ${HISTORY_COUNT} ownership records\n"
else
  echo -e "${RED}❌ Status: ${HTTP_CODE}${NC}"
  echo -e "Response: ${BODY}\n"
fi

# Test 12: Pagination for users (SUCCESS)
echo -e "${YELLOW}Test 12: Get users with pagination${NC}"
echo -e "GET ${API_URL}/usuarios?page=1&limit=2"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "${API_URL}/usuarios?page=1&limit=2")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "200" ]; then
  PAGE=$(echo "$BODY" | jq '.page')
  LIMIT=$(echo "$BODY" | jq '.limit')
  TOTAL=$(echo "$BODY" | jq '.total')
  TOTAL_PAGES=$(echo "$BODY" | jq '.totalPages')
  echo -e "${GREEN}✅ Status: 200 OK${NC}"

  # Validate business model format (users should not have internal fields)
  DATA_LENGTH=$(echo "$BODY" | jq '.data | length')
  if [ "$DATA_LENGTH" -gt "0" ]; then
    FIRST_HAS_CREATED=$(echo "$BODY" | jq '.data[0] | has("createdAt")')
    FIRST_HAS_UPDATED=$(echo "$BODY" | jq '.data[0] | has("updatedAt")')

    if [ "$FIRST_HAS_CREATED" = "false" ] && [ "$FIRST_HAS_UPDATED" = "false" ]; then
      echo -e "${GREEN}✅ Business model format correct (no internal fields)${NC}"
    else
      echo -e "${RED}⚠️  Warning: User format includes internal fields${NC}"
      echo -e "   Has createdAt: $FIRST_HAS_CREATED | Has updatedAt: $FIRST_HAS_UPDATED"
    fi
  fi

  echo -e "Pagination: Page ${PAGE}/${TOTAL_PAGES}, Limit: ${LIMIT}, Total: ${TOTAL}\n"
else
  echo -e "${RED}❌ Status: ${HTTP_CODE}${NC}"
  echo -e "Response: ${BODY}\n"
fi

# Test 13: Pagination for vehicles (SUCCESS)
echo -e "${YELLOW}Test 13: Get vehicles with pagination${NC}"
echo -e "GET ${API_URL}/vehiculos?page=1&limit=2"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "${API_URL}/vehiculos?page=1&limit=2")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "200" ]; then
  PAGE=$(echo "$BODY" | jq '.page')
  LIMIT=$(echo "$BODY" | jq '.limit')
  TOTAL=$(echo "$BODY" | jq '.total')
  TOTAL_PAGES=$(echo "$BODY" | jq '.totalPages')
  echo -e "${GREEN}✅ Status: 200 OK${NC}"

  # Validate business model format (vehicles should have propietario object, no internal fields)
  DATA_LENGTH=$(echo "$BODY" | jq '.data | length')
  if [ "$DATA_LENGTH" -gt "0" ]; then
    FIRST_HAS_PROPIETARIO=$(echo "$BODY" | jq '.data[0] | has("propietario")')
    FIRST_HAS_PROPIETARIO_ID=$(echo "$BODY" | jq '.data[0] | has("propietarioId")')
    FIRST_HAS_CREATED=$(echo "$BODY" | jq '.data[0] | has("createdAt")')

    if [ "$FIRST_HAS_PROPIETARIO" = "true" ] && [ "$FIRST_HAS_PROPIETARIO_ID" = "false" ] && [ "$FIRST_HAS_CREATED" = "false" ]; then
      echo -e "${GREEN}✅ Business model format correct (propietario object, no internal fields)${NC}"
    else
      echo -e "${RED}⚠️  Warning: Vehicle format doesn't match business model${NC}"
      echo -e "   Has propietario: $FIRST_HAS_PROPIETARIO | Has propietarioId: $FIRST_HAS_PROPIETARIO_ID | Has createdAt: $FIRST_HAS_CREATED"
    fi
  fi

  echo -e "Pagination: Page ${PAGE}/${TOTAL_PAGES}, Limit: ${LIMIT}, Total: ${TOTAL}\n"
else
  echo -e "${RED}❌ Status: ${HTTP_CODE}${NC}"
  echo -e "Response: ${BODY}\n"
fi

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  All tests completed!${NC}"
echo -e "${BLUE}================================${NC}"
