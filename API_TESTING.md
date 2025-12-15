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

Integration tests verify that repositories work correctly with the real Prisma ORM and database, testing data persistence and relationships.

**Important:** Integration tests use a **separate test database** (`vehicle_registry_test`) configured in `.env.test`. This database is cleaned before each test, so it won't affect your development data or seed data.

### Test Files

- `test/integration/VehicleRepository.test.ts` - Vehicle repository operations with database
- `test/integration/UserRepository.test.ts` - User repository operations with database
- `test/integration/AuthorizedDriverRepository.test.ts` - Authorized driver repository operations
- `test/integration/OwnershipHistoryRepository.test.ts` - Ownership history repository operations

### Key Test Cases Covered

- ✅ Create records and verify persistence to database
- ✅ Query data with relationships (e.g., vehicle with owner)
- ✅ Update records and verify changes persist
- ✅ Paginated queries return correct metadata
- ✅ Find operations return null when records don't exist
- ✅ Ownership history records are created and updated correctly

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

### ✅ Test 11: Get authorized drivers (SUCCESS)

**Extra 1: List authorized drivers**

```bash
curl -X GET http://localhost:3000/vehiculos/{VEHICLE_ID}/conductores
```

**Description:** Returns list of all authorized drivers for a vehicle (excluding the owner). This test verifies the driver added in Test 10.

**Response:** `200 OK` with array of authorized drivers

**Example Response:**

```json
[
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
  },
  {
    "id": "auth-driver-789",
    "vehicleId": "vehicle-abc",
    "driver": {
      "id": "user-999",
      "nombre": "Ana Martínez",
      "email": "ana.martinez@example.com",
      "tipoPermiso": "B",
      "permisoValidoHasta": "2026-08-15T10:30:00.000Z"
    }
  }
]
```

**Note:** Returns complete `driver` objects instead of `userId`. Internal fields (`createdAt`, etc.) are not exposed.

**Errors possible:**

- `404 Not Found` - Vehicle not found

---

### ✅ Test 12: Get vehicle ownership history (SUCCESS)

**Extra 3: Historial de propietarios**

Get ownership history for a vehicle after transfer (Test 8). This test verifies that the ownership history was recorded when the transfer happened.

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
  },
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

### ✅ Test 15: Remove authorized driver (SUCCESS)

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

### ✅ Test 16: Get ownership history for Vehicle 1 (SUCCESS)

**Extra 3: Historial de propietarios with seed data**

Get ownership history for a specific vehicle that has historical data from seed.

```bash
curl -X GET http://localhost:3000/vehiculos/{VEHICLE1_ID}/historial
```

**Validations:**

- Vehicle must exist

**Response:** `200 OK` with ownership history

**Note:** This test verifies that seed data includes ownership history records.

**Errors possible:**

- `404 Not Found` - Vehicle not found

---

### ✅ Test 17: Get ownership history for Vehicle 2 (SUCCESS)

**Extra 3: Historial de propietarios with seed data**

Get ownership history for another vehicle with historical ownership records.

```bash
curl -X GET http://localhost:3000/vehiculos/{VEHICLE2_ID}/historial
```

**Validations:**

- Vehicle must exist

**Response:** `200 OK` with ownership history

**Note:** This test also verifies ownership history from seed data.

**Errors possible:**

- `404 Not Found` - Vehicle not found

---

## Additional Manual Tests (Not Automated)

These edge cases can be tested manually but are not included in the automated script:

### ❌ Manual Test A: Register vehicle for non-existent user (FAIL)

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

### ❌ Manual Test B: Transfer to user without valid license (FAIL)

```bash
curl -X PUT http://localhost:3000/vehiculos/{VEHICLE_ID}/propietario \
  -H "Content-Type: application/json" \
  -d '{
    "nuevo_propietario_id": "{USER_ID_WITH_WRONG_LICENSE_TYPE}"
  }'
```

**Expected**: `400 Bad Request` - "Owner does not have valid license"

---

### ❌ Manual Test C: Transfer non-existent vehicle (FAIL)

```bash
curl -X PUT http://localhost:3000/vehiculos/00000000-0000-0000-0000-000000000000/propietario \
  -H "Content-Type: application/json" \
  -d '{
    "nuevo_propietario_id": "{USER_ID}"
  }'
```

**Expected**: `404 Not Found` - "Vehicle not found"

---

## Additional Endpoint Documentation

### 🔍 DELETE /usuarios/:id/permiso - Revoke user license

**Extra 2: Revocar permiso de conducción**

```bash
curl -X DELETE http://localhost:3000/usuarios/{USER_ID}/permiso
```

**Description:** Revokes a user's driving license by marking it as expired. This operation is only allowed if the user has no vehicles registered as owner.

**Validations:**

- User must exist
- User must not have any vehicles registered as owner
- If user has vehicles, the operation is rejected

**Response:** `204 No Content` (successful revocation)

**Example (Success - User without vehicles):**

```bash
# Assuming USER_ID has no vehicles
curl -X DELETE http://localhost:3000/usuarios/550e8400-e29b-41d4-a716-446655440000/permiso
```

**Response:** `204 No Content` (empty body)

**Example (Failure - User with vehicles):**

```bash
# Assuming USER_ID owns vehicles
curl -X DELETE http://localhost:3000/usuarios/550e8400-e29b-41d4-a716-446655440000/permiso
```

**Response:** `400 Bad Request`

```json
{
  "error": "ValidationError",
  "message": "Cannot revoke permit: user has vehicles registered"
}
```

**Errors possible:**

- `400 Bad Request` - User has vehicles registered
- `404 Not Found` - User not found

**Implementation Notes:**

- The license is not deleted, only marked as expired (set to year 2000)
- The user can still exist in the system as an authorized driver for other vehicles
- Only ownership (propietario) is checked, not authorized driver status
- This is a reversible operation (license expiration date can be updated)

**Manual Testing with Seed Data:**

To test this endpoint manually with seed data:

1. **Test SUCCESS case** (user without vehicles):
```bash
# User 5 (María González) has no vehicles as owner, only as authorized driver
# Get User 5 ID first
npm run get-users

# Revoke permit (should succeed)
curl -X DELETE http://localhost:3000/usuarios/{USER5_ID}/permiso
# Expected: 204 No Content
```

2. **Test FAILURE case** (user with vehicles):
```bash
# User 1 (Juan Pérez) owns Vehicle 1 (Toyota Corolla)
# Get User 1 ID first
npm run get-users

# Try to revoke permit (should fail)
curl -X DELETE http://localhost:3000/usuarios/{USER1_ID}/permiso
# Expected: 400 Bad Request - "Cannot revoke permit: user has vehicles registered"
```

**Note:** This endpoint is not included in the automated test script (`test-api.sh`) because it modifies the database in a way that would affect subsequent tests. Test manually after seeding.

---

## Test Summary

**Core Requirements (9 automated tests)**: Tests 1-9 are run by `npm run test:api`

**Extra Features & Additional Tests (8 automated tests)**: Tests 10-17 cover authorized drivers, ownership history, and pagination

- Tests 10, 11, 15: Extra 1 (Authorized drivers - add, list & remove)
- Tests 12, 16, 17: Extra 3 (Ownership history - after transfer + seed data)
- Tests 13-14: Bonus (Pagination)

**Manual-Only Tests (3 additional)**: Tests A-C are additional edge cases for manual verification

**Extra 2: Revoke License (manual testing)**: DELETE /usuarios/:id/permiso - See "Additional Endpoint Documentation" section above for manual testing instructions

**Total tests: 20** (17 automated + 3 manual) + Extra 2 (manual)

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

# Migrate test database
npm run prisma:migrate:test
```

---

## Viewing Database Data

### Option 1: Prisma Studio (Recommended - GUI)

```bash
# View development database
npm run prisma:studio
# Opens at http://localhost:5555

# View test database (can run simultaneously)
npm run prisma:studio:test
# Opens at http://localhost:5556
```

**Both databases can be viewed at the same time:**
- Development database: http://localhost:5555
- Test database: http://localhost:5556

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
