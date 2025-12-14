# API Testing Guide

This project uses a **three-tier testing strategy** covering unit tests, integration tests, and API endpoint tests.

---

## Testing Overview

| Test Type             | Scope                              | Database                       | Command                    | Coverage                                                    |
| --------------------- | ---------------------------------- | ------------------------------ | -------------------------- | ----------------------------------------------------------- |
| **Unit Tests**        | Individual services & repositories | None (mocked)                  | `npm run test:unit`        | VehicleService, UserService, Repositories, LicenseValidator |
| **Integration Tests** | Services with real database        | `vehicle_registry_test` (test) | `npm run test:integration` | Database persistence, relationships                         |
| **API Tests**         | HTTP endpoints (curl-based)        | `vehicle_registry` (dev)       | `npm run test:api`         | REST endpoint validation                                    |
| **All Tests**         | Run all test suites                | Both (test + mocked)           | `npm run test`             | Full coverage                                               |
| **Coverage Report**   | Test coverage metrics              | Both (test + mocked)           | `npm run test:coverage`    | Overall code coverage                                       |

---

## Database Configuration

### Two Separate Databases

This project uses **two separate databases** to isolate testing from development:

| Database                | Purpose                   | Used By                  | Environment File |
| ----------------------- | ------------------------- | ------------------------ | ---------------- |
| `vehicle_registry`      | Development & API testing | `npm run dev`, API tests | `.env`           |
| `vehicle_registry_test` | Integration & unit tests  | Test suites              | `.env.test`      |

**Why separate databases?**

- Integration tests clean the database before each test (`deleteMany()`)
- This would delete seed data needed for API testing
- Separate databases keep development data intact

**Important:** When Docker starts, both databases are automatically created.

---

## Quick Start: Running Tests

### Run All Tests

```bash
npm run test
```

### Run Specific Test Suites

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# API endpoint tests (requires running server)
npm run test:api

# Watch mode (auto-rerun on file changes)
npm run test:watch

# Coverage report
npm run test:coverage
```

---

## Unit Tests

### Overview

Unit tests isolate individual components (services, repositories, validators) and test them independently using mocks.

### Test Files

- `test/unit/services/VehicleService.test.ts` - Vehicle registration, transfers, authorized drivers
- `test/unit/services/UserService.test.ts` - User retrieval and management
- `test/unit/services/LicenseValidator.test.ts` - License validation logic
- `test/unit/repositories/VehicleRepository.test.ts` - Vehicle repository queries
- `test/unit/repositories/UserRepository.test.ts` - User repository queries
- `test/unit/repositories/AuthorizedDriverRepository.test.ts` - Authorized driver queries

### Key Test Cases Covered

- ✅ Register vehicle with valid license
- ✅ Reject vehicle registration with expired license
- ✅ Reject vehicle registration with wrong license type
- ✅ Transfer vehicle ownership with validation
- ✅ Add authorized drivers to vehicles
- ✅ License validation (type matching & expiration)
- ✅ Database queries (find, create, update)

### Run Unit Tests

```bash
npm run test:unit
```

---

## Integration Tests

### Overview

Integration tests verify that services work correctly with the real Prisma ORM and database, testing data persistence and relationships.

**Important:** Integration tests use a **separate test database** (`vehicle_registry_test`) configured in `.env.test`. This database is cleaned before each test, so it won't affect your development data or seed data.

### Test Files

- `test/integration/VehicleService.integration.test.ts` - Vehicle operations with database
- `test/integration/UserService.integration.test.ts` - User operations with database

### Key Test Cases Covered

- ✅ Register vehicle and persist to database
- ✅ Transfer vehicle ownership and update database
- ✅ Add authorized driver and persist relationship
- ✅ Retrieve user's vehicles from database
- ✅ Verify ownership history is recorded

### Run Integration Tests

```bash
npm run test:integration
```

---

# API Endpoint Tests

### Overview

API tests use curl to validate HTTP endpoints with actual HTTP responses, status codes, and payloads.

## Quick Start

### 1. Start the server

```bash
npm run dev
```

### 2. Seed the development database with test data

```bash
npm run seed
```

**Note:** This seeds the **development database** (`vehicle_registry`), not the test database. The test database is automatically managed by integration tests.

This will create:

- **User 1**: Juan Pérez - License B (valid) - Owns Toyota Corolla
- **User 2**: María García - License A (valid) - Owns Honda CBR 600
- **User 3**: Carlos López - License C (valid) - Owns Mercedes Actros
- **User 4**: Ana Martínez - License B (expired) - No vehicles
- **User 5**: Pedro González - License B (valid) - No vehicles

### 3. Run automated API tests

```bash
npm run test:api
```

**What the automated tests validate:**

- HTTP status codes (201 Created, 200 OK, 400 Bad Request, 404 Not Found, 409 Conflict)
- Business model response format (presence of nested objects like `propietario`, `driver`, `owner`)
- Absence of internal fields (`createdAt`, `updatedAt`, `propietarioId`, `userId`)
- Correct data transformations and relationships

**Important:**

- API tests use the **development database** (`vehicle_registry`), so seed data persists
- Integration tests use a **separate test database** (`vehicle_registry_test`) and won't affect seed data
- If API tests fail due to data state (e.g., vehicle already transferred), reseed the database:

```bash
npm run seed && npm run test:api
```

---

## Manual Testing with curl

### Get User IDs

First, get the user IDs from the seed script output, or use Prisma Studio:

```bash
# Option 1: Check seed script output (shows all IDs)
npm run seed

# Option 2: Open Prisma Studio GUI
npm run prisma:studio
# Then navigate to http://localhost:5555
```

Replace `{USER_ID}` in the examples below with actual UUIDs.

---

## Test Scenarios

### ✅ Test 1: Register a new vehicle (SUCCESS)

```bash
curl -X POST http://localhost:3000/vehiculos \
  -H "Content-Type: application/json" \
  -d '{
    "marca": "Ford",
    "modelo": "Focus",
    "matricula": "NEW001",
    "tipo": "coche",
    "propietario_id": "{USER_ID_WITH_LICENSE_B}"
  }'
```

**Expected**: `201 Created` with vehicle data

---

### ❌ Test 2: Register vehicle with wrong license type (FAIL)

```bash
curl -X POST http://localhost:3000/vehiculos \
  -H "Content-Type: application/json" \
  -d '{
    "marca": "Volkswagen",
    "modelo": "Golf",
    "matricula": "NEW002",
    "tipo": "coche",
    "propietario_id": "{USER_ID_WITH_LICENSE_A}"
  }'
```

**Expected**: `400 Bad Request` - "Owner does not have valid license"

---

### ❌ Test 3: Register vehicle with expired license (FAIL)

```bash
curl -X POST http://localhost:3000/vehiculos \
  -H "Content-Type: application/json" \
  -d '{
    "marca": "Seat",
    "modelo": "Ibiza",
    "matricula": "NEW003",
    "tipo": "coche",
    "propietario_id": "{USER_ID_WITH_EXPIRED_LICENSE}"
  }'
```

**Expected**: `400 Bad Request` - "Owner does not have valid license"

---

### ❌ Test 4: Register vehicle with duplicate matricula (FAIL)

```bash
curl -X POST http://localhost:3000/vehiculos \
  -H "Content-Type: application/json" \
  -d '{
    "marca": "Toyota",
    "modelo": "Yaris",
    "matricula": "1234ABC",
    "tipo": "coche",
    "propietario_id": "{USER_ID_WITH_LICENSE_B}"
  }'
```

**Expected**: `409 Conflict` - "License plate already exists"

---

### ❌ Test 5: Register vehicle for non-existent user (FAIL)

```bash
curl -X POST http://localhost:3000/vehiculos \
  -H "Content-Type: application/json" \
  -d '{
    "marca": "Audi",
    "modelo": "A4",
    "matricula": "NEW004",
    "tipo": "coche",
    "propietario_id": "00000000-0000-0000-0000-000000000000"
  }'
```

**Expected**: `404 Not Found` - "Owner not found"

---

### ✅ Test 5: Get all users (SUCCESS)

```bash
curl -X GET http://localhost:3000/usuarios
```

**Expected**: `200 OK` with array of all users

**Example Response**:

```json
[
  {
    "id": "uuid-here",
    "nombre": "Juan Pérez",
    "email": "juan.perez@example.com",
    "tipoPermiso": "B",
    "permisoValidoHasta": "2027-12-06T19:41:50.361Z"
  }
]
```

**Note:** Business models do not expose internal fields like `createdAt` or `updatedAt`.

---

### ✅ Test 6: Get all vehicles (SUCCESS)

```bash
curl -X GET http://localhost:3000/vehiculos
```

**Expected**: `200 OK` with array of all vehicles

**Example Response**:

```json
[
  {
    "id": "uuid-here",
    "marca": "Toyota",
    "modelo": "Corolla",
    "matricula": "1234ABC",
    "tipo": "coche",
    "propietario": {
      "id": "owner-uuid",
      "nombre": "Juan Pérez",
      "email": "juan.perez@example.com",
      "tipoPermiso": "B",
      "permisoValidoHasta": "2027-12-06T19:41:50.361Z"
    }
  }
]
```

**Note:** Business models return the complete `propietario` object instead of just `propietarioId`. Internal fields (`createdAt`, `updatedAt`) are not exposed.

---

### ✅ Test 7: Get user's vehicles (SUCCESS)

```bash
curl -X GET http://localhost:3000/usuarios/{USER_ID}/vehiculos
```

**Expected**: `200 OK` with array of vehicles

---

### ✅ Test 8: Transfer vehicle ownership (SUCCESS)

First, get a vehicle ID from the seed output or Prisma Studio, then transfer:

```bash
curl -X PUT http://localhost:3000/vehiculos/{VEHICLE_ID}/propietario \
  -H "Content-Type: application/json" \
  -d '{
    "nuevo_propietario_id": "{NEW_USER_ID_WITH_VALID_LICENSE}"
  }'
```

**Expected**: `200 OK` with updated vehicle data

---

### ❌ Test 9: Transfer to same owner (FAIL)

```bash
curl -X PUT http://localhost:3000/vehiculos/{VEHICLE_ID}/propietario \
  -H "Content-Type: application/json" \
  -d '{
    "nuevo_propietario_id": "{CURRENT_OWNER_ID}"
  }'
```

**Expected**: `400 Bad Request` - "New owner must be different from current owner"

---

### ✅ Test 10: Add authorized driver (SUCCESS)

**Extra 1: Múltiples conductores**

```bash
curl -X POST http://localhost:3000/vehiculos/{VEHICLE_ID}/conductores \
  -H "Content-Type: application/json" \
  -d '{
    "conductor_id": "{USER_ID_WITH_VALID_LICENSE}"
  }'
```

**Validations:**

- Vehicle must exist
- User (conductor) must exist
- User must have valid license for vehicle type
- License must not be expired
- User cannot already be an authorized driver

**Response:** `201 Created` with authorized driver data

**Example Response:**

```json
{
  "id": "auth-driver-123",
  "vehicleId": "vehicle-abc",
  "driver": {
    "id": "user-456",
    "nombre": "Pedro González",
    "email": "pedro.gonzalez@example.com",
    "tipoPermiso": "B",
    "permisoValidoHasta": "2027-12-06T19:41:50.361Z"
  }
}
```

**Note:** Returns the complete `driver` object instead of just `userId`. Internal fields are not exposed.

**Errors possible:**

- `400 Bad Request` - License validation fails
- `404 Not Found` - Vehicle or user not found
- `409 Conflict` - User already authorized

---

### ✅ Test 11: Remove authorized driver (SUCCESS)

**Extra 1: Múltiples conductores**

```bash
curl -X DELETE http://localhost:3000/vehiculos/{VEHICLE_ID}/conductores/{CONDUCTOR_ID}
```

**Validations:**

- Vehicle must exist

**Response:** `204 No Content`

**Errors possible:**

- `404 Not Found` - Vehicle not found

---

### ✅ Test 12: Get vehicle ownership history (SUCCESS)

**Extra 3: Historial de propietarios**

```bash
curl -X GET http://localhost:3000/vehiculos/{VEHICLE_ID}/historial
```

**Validations:**

- Vehicle must exist

**Response:** `200 OK` with ownership history

**Example Response:**

```json
[
  {
    "id": "history-1",
    "vehicleId": "vehicle-abc",
    "owner": {
      "id": "user-123",
      "nombre": "Juan Pérez",
      "email": "juan.perez@example.com",
      "tipoPermiso": "B",
      "permisoValidoHasta": "2027-12-06T19:41:50.361Z"
    },
    "fechaInicio": "2025-01-01T00:00:00.000Z",
    "fechaFin": "2025-06-01T00:00:00.000Z"
  },
  {
    "id": "history-2",
    "vehicleId": "vehicle-abc",
    "owner": {
      "id": "user-456",
      "nombre": "María García",
      "email": "maria.garcia@example.com",
      "tipoPermiso": "B",
      "permisoValidoHasta": "2027-12-06T19:41:50.361Z"
    },
    "fechaInicio": "2025-06-01T00:00:00.000Z",
    "fechaFin": null
  }
]
```

**Note:** Returns the complete `owner` object instead of just `userId`. Internal fields are not exposed.

**Note:** History is ordered by `fechaInicio` descending (most recent first). Current owner has `fechaFin: null`.

**Errors possible:**

- `404 Not Found` - Vehicle not found

---

### ✅ Test 13: Pagination for users (SUCCESS)

**Bonus feature: Pagination support**

```bash
curl -X GET "http://localhost:3000/usuarios?page=1&limit=10"
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:** `200 OK` with paginated results

**Example Response:**

```json
{
  "data": [
    {
      "id": "user-123",
      "nombre": "Juan Pérez",
      "email": "juan.perez@example.com",
      "tipoPermiso": "B",
      "permisoValidoHasta": "2027-12-06T19:41:50.361Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

**Note:** Business models in the `data` array do not expose internal fields.

---

### ✅ Test 14: Pagination for vehicles (SUCCESS)

**Bonus feature: Pagination support**

```bash
curl -X GET "http://localhost:3000/vehiculos?page=2&limit=5"
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:** `200 OK` with paginated results

**Example Response:**

```json
{
  "data": [
    {
      "id": "vehicle-abc",
      "marca": "Toyota",
      "modelo": "Corolla",
      "matricula": "1234ABC",
      "tipo": "coche",
      "propietario": {
        "id": "user-123",
        "nombre": "Juan Pérez",
        "email": "juan.perez@example.com",
        "tipoPermiso": "B",
        "permisoValidoHasta": "2027-12-06T19:41:50.361Z"
      }
    }
  ],
  "total": 25,
  "page": 2,
  "limit": 5,
  "totalPages": 5
}
```

**Note:** Business models in the `data` array return the complete `propietario` object instead of `propietarioId`. Internal fields are not exposed.

**Note:** If `page` or `limit` are not provided, the endpoint returns all records (unpaginated).

---

## Additional Manual Tests (Not Automated)

These edge cases can be tested manually but are not included in the automated script:

### ❌ Manual Test A: Transfer to user without valid license (FAIL)

```bash
curl -X PUT http://localhost:3000/vehiculos/{VEHICLE_ID}/propietario \
  -H "Content-Type: application/json" \
  -d '{
    "nuevo_propietario_id": "{USER_ID_WITH_WRONG_LICENSE_TYPE}"
  }'
```

**Expected**: `400 Bad Request` - "Owner does not have valid license"

---

### ❌ Manual Test B: Transfer non-existent vehicle (FAIL)

```bash
curl -X PUT http://localhost:3000/vehiculos/00000000-0000-0000-0000-000000000000/propietario \
  -H "Content-Type: application/json" \
  -d '{
    "nuevo_propietario_id": "{USER_ID}"
  }'
```

**Expected**: `404 Not Found` - "Vehicle not found"

---

## Test Summary

**Core Requirements (9 automated tests)**: Tests 1-9 are run by `npm run test:api`

**Extra Features & Additional Tests (8 automated tests)**: Tests 10-17 cover authorized drivers, ownership history, and pagination

- Tests 10, 15: Extra 1 (Authorized drivers - add & remove)
- Tests 11, 16, 17: Extra 3 (Ownership history with seed data)
- Tests 12-13: Bonus (Pagination)
- Test 14: Additional endpoint (user vehicles)

**Manual-Only Tests (2 additional)**: Tests A-B are additional edge cases for manual verification

**Total tests: 19** (17 automated + 2 manual)

---

## License Type Mapping

| License Type | Can Drive |
| ------------ | --------- |
| A            | moto      |
| B            | coche     |
| C            | camion    |

---

## Docker Setup

### Starting Docker Containers

```bash
# Start PostgreSQL with both databases
npm run docker:up

# Or start in detached mode (background)
npm run docker:up:detach
```

**What happens:**

1. PostgreSQL container starts
2. Creates `vehicle_registry` (development database)
3. Creates `vehicle_registry_test` (test database)
4. Both databases are ready for migrations

### Running Migrations

```bash
# Migrate development database
npm run prisma:migrate

# Migrate test database (if needed)
npm run prisma:migrate:test
```

---

## Viewing Database Data

### Option 1: Prisma Studio (Recommended - GUI)

```bash
# View development database (default)
npm run prisma:studio

# View test database
dotenv -e .env.test -- npx prisma studio
```

Open http://localhost:5555 to view and edit data visually.

### Option 2: TypeScript Script

Create a custom script to query data using Prisma Client:

```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: { ownedVehicles: true },
  });
  console.log(JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}
main();
```
