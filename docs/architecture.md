# Arquitectura del Sistema

## Índice
1. [Visión General](#visión-general)
2. [Capas de la Arquitectura](#capas-de-la-arquitectura)
3. [Separación de Modelos](#separación-de-modelos)
4. [Manejo de Errores](#manejo-de-errores)
5. [Validaciones](#validaciones)
6. [Flujo de Datos](#flujo-de-datos)

## Visión General

El sistema sigue una arquitectura en capas basada en los principios de **Clean Architecture** y **Domain-Driven Design**, con una estricta separación de responsabilidades entre las diferentes capas de la aplicación.

### Principios Fundamentales

- **Separación de Capas**: Cada capa tiene responsabilidades bien definidas y no conoce detalles de implementación de capas superiores
- **Independencia de Framework**: La lógica de negocio no depende de Express, Prisma u otras tecnologías específicas
- **Testabilidad**: Todas las capas son fácilmente testeables mediante inyección de dependencias
- **Separación de Modelos**: Los modelos de datos (Prisma) nunca se exponen directamente a los controladores

## Capas de la Arquitectura

```
┌─────────────────────────────────────────┐
│           Controllers Layer             │  ← HTTP, Request/Response
├─────────────────────────────────────────┤
│           Services Layer                │  ← Business Logic
├─────────────────────────────────────────┤
│      Validators & Mappers               │  ← Validation & Transformation
├─────────────────────────────────────────┤
│          Repositories Layer             │  ← Data Access
├─────────────────────────────────────────┤
│           Prisma (ORM)                  │  ← Database
└─────────────────────────────────────────┘
```

### 1. Controllers (`src/interface/controllers/`)

**Responsabilidades:**
- Manejar requests y responses HTTP
- Validar parámetros de entrada (query, params, body)
- Invocar servicios de negocio
- Transformar errores de dominio en códigos HTTP

**Principios:**
- NO contienen lógica de negocio
- NO acceden directamente a repositorios
- Solo trabajan con modelos de negocio (`businessModels`)

**Ejemplo:**
```typescript
async registerVehicle(req: Request, res: Response): Promise<void> {
  const vehicle = await this.vehicleService.registerVehicle(req.body);
  res.status(201).json(vehicle);
}
```

### 2. Services (`src/services/`)

**Responsabilidades:**
- Implementar lógica de negocio
- Orquestar operaciones entre múltiples repositorios
- Aplicar reglas de negocio
- Transformar datos entre capas usando mappers

**Principios:**
- Reciben repositorios y validadores por inyección de dependencias
- NO conocen detalles de HTTP (códigos de estado, headers, etc.)
- Lanzan errores de dominio (no errores HTTP)
- Retornan modelos de negocio

**Ejemplo:**
```typescript
public async registerVehicle(data: CreateVehicleDTO): Promise<VehicleBusiness> {
  await this.vehicleValidator.validateOwnerExists(data.propietario_id);
  await this.vehicleValidator.validateMatriculaUnique(data.matricula);
  await this.vehicleValidator.validateOwnerLicense(data.propietario_id, data.tipo);

  const vehicle = await this.vehicleRepository.create(data);
  await this.ownershipHistoryRepository.create(vehicle.id, data.propietario_id);

  return EntityMapper.toVehicleBusiness(vehicle, vehicle.propietario);
}
```

### 3. Validators (`src/services/*Validator.ts`)

**Responsabilidades:**
- Centralizar validaciones de negocio
- Verificar condiciones y reglas de dominio
- Lanzar errores de dominio cuando las validaciones fallan

**Principios:**
- NO contienen lógica de transformación de datos
- Acceden a repositorios para validaciones que requieren datos de la BD
- Utilizan servicios de validación especializados (ej: `LicenseValidator`)

**Ejemplo:**
```typescript
public async validateOwnerLicense(ownerId: string, vehicleType: VehicleType): Promise<void> {
  const owner = await this.userRepository.findById(ownerId);
  if (!owner) return;

  const isValid = this.licenseValidator.isLicenseValidForVehicle(
    owner.tipoPermiso,
    owner.permisoValidoHasta,
    vehicleType
  );

  if (!isValid) {
    throw new ValidationError('Owner does not have valid license for this vehicle type');
  }
}
```

### 4. Repositories (`src/repositories/`)

**Responsabilidades:**
- Acceso a datos (CRUD)
- Encapsular queries de Prisma
- Cargar relaciones necesarias

**Principios:**
- Retornan tipos de datos enriquecidos (ej: `VehicleData` incluye `propietario`)
- NO contienen lógica de negocio
- Todos los métodos que retornan entidades con relaciones las incluyen automáticamente

**Tipos de Datos:**
```typescript
// Tipo base de Prisma
type Vehicle = {
  id: string;
  marca: string;
  modelo: string;
  matricula: string;
  tipo: VehicleType;
  propietarioId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Tipo con relación incluida
export type VehicleData = Vehicle & {
  propietario: User;
};
```

**Ejemplo:**
```typescript
public async findById(id: string): Promise<VehicleData | null> {
  return await this.prisma.vehicle.findUnique({
    where: { id },
    include: { propietario: true }, // Siempre incluye el propietario
  });
}
```

### 5. Mappers (`src/services/EntityMapper.ts`)

**Responsabilidades:**
- Transformar modelos de datos a modelos de negocio
- Eliminar campos internos (timestamps, IDs de relaciones)
- Anidar objetos relacionados

**Principios:**
- Transformaciones unidireccionales (Data → Business)
- Sin lógica de negocio
- Métodos estáticos puros

**Ejemplo:**
```typescript
static toVehicleBusiness(vehicle: Vehicle, owner: User): VehicleBusiness {
  return {
    id: vehicle.id,
    marca: vehicle.marca,
    modelo: vehicle.modelo,
    matricula: vehicle.matricula,
    tipo: vehicle.tipo,
    propietario: EntityMapper.toUserBusiness(owner), // Objeto anidado, no ID
  };
}
```

## Separación de Modelos

La arquitectura implementa una estricta separación entre modelos de datos y modelos de negocio:

### Modelos de Datos (`src/repositories/types.ts`)

- Extienden los tipos base de Prisma con relaciones incluidas
- Incluyen campos técnicos: `createdAt`, `updatedAt`, `propietarioId`
- Solo se usan en la capa de repositorios
- Ejemplo: `VehicleData`, `AuthorizedDriverData`, `OwnershipHistoryData`

### Modelos de Negocio (`src/services/types.ts`)

- Diseñados para la capa de aplicación y API
- NO incluyen timestamps ni campos técnicos
- Incluyen objetos relacionados completos en lugar de IDs
- Ejemplo: `VehicleBusiness`, `UserBusiness`, `AuthorizedDriverBusiness`

**Comparación:**

```typescript
// Modelo de Datos (VehicleData)
{
  id: "abc-123",
  marca: "Toyota",
  modelo: "Corolla",
  matricula: "1234ABC",
  tipo: "coche",
  propietarioId: "user-456",        // ← ID del propietario
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z",
  propietario: {                    // ← Objeto relacionado
    id: "user-456",
    nombre: "Juan Pérez",
    // ...
  }
}

// Modelo de Negocio (VehicleBusiness)
{
  id: "abc-123",
  marca: "Toyota",
  modelo: "Corolla",
  matricula: "1234ABC",
  tipo: "coche",
  propietario: {                    // ← Solo el objeto, sin propietarioId
    id: "user-456",
    nombre: "Juan Pérez",
    email: "juan@example.com",
    tipoPermiso: "B",
    permisoValidoHasta: "2026-12-31"
  }
  // Sin createdAt, updatedAt, propietarioId
}
```

### Beneficios de esta Separación

1. **Encapsulación**: Los detalles de implementación de la BD no se filtran a capas superiores
2. **Flexibilidad**: Podemos cambiar el ORM sin afectar los controladores
3. **Claridad**: Los modelos de negocio exponen exactamente lo que necesita el cliente
4. **Seguridad**: Evitamos exponer campos sensibles o internos

## Manejo de Errores

### Errores de Negocio (`src/services/errors.ts`)

La aplicación define errores específicos de negocio que son independientes del protocolo HTTP:

```typescript
BusinessError (base)
  ├─ NotFoundError         // Recurso no encontrado
  ├─ ValidationError       // Regla de negocio violada
  ├─ DuplicityError        // Duplicidad de recursos únicos
  └─ SystemError           // Errores del sistema
```

### Ejemplo de Uso:

```typescript
// En un validador
if (!vehicle) {
  throw new NotFoundError('Vehicle', vehicleId);
}

if (currentOwnerId === newOwnerId) {
  throw new ValidationError('New owner must be different from current owner');
}
```

### Error Handler Middleware

El middleware `errorHandler` mapea errores de dominio a códigos HTTP:

```typescript
NotFoundError      → 404 Not Found
ValidationError    → 400 Bad Request
DuplicityError     → 409 Conflict
Error (genérico)   → 500 Internal Server Error
```

**Ventajas:**
- Los servicios no conocen HTTP
- Fácil cambio de protocolo (REST → GraphQL, gRPC, etc.)
- Testing simplificado

## Validaciones

Las validaciones están centralizadas en clases `Validator`:

### VehicleValidator

- `validateVehicleExists`: Verifica que el vehículo existe
- `validateOwnerExists`: Verifica que el usuario existe
- `validateMatriculaUnique`: Verifica unicidad de matrícula
- `validateOwnerLicense`: Valida permisos del propietario
- `validateDifferentOwner`: Verifica cambio de propietario

### LicenseValidator

- `isLicenseValidForVehicle`: Lógica pura de validación de permisos
  - Valida tipo de permiso vs tipo de vehículo
  - Valida expiración del permiso

### Inyección de Dependencias

```typescript
const vehicleValidator = new VehicleValidator(
  userRepository,
  vehicleRepository,
  licenseValidator
);

const vehicleService = new VehicleService(
  vehicleRepository,
  authorizedDriverRepository,
  ownershipHistoryRepository,
  vehicleValidator
);
```

## Flujo de Datos

### Ejemplo: Registrar un Vehículo

```
1. Controller recibe Request HTTP
   ↓
2. Controller extrae DTO del body
   ↓
3. Controller invoca VehicleService.registerVehicle(dto)
   ↓
4. Service ejecuta validaciones:
   - validateOwnerExists()
   - validateMatriculaUnique()
   - validateOwnerLicense()
   ↓
5. Service invoca VehicleRepository.create(dto)
   ↓
6. Repository ejecuta Prisma query con include: { propietario: true }
   ↓
7. Repository retorna VehicleData (con propietario)
   ↓
8. Service registra en OwnershipHistoryRepository
   ↓
9. Service usa EntityMapper.toVehicleBusiness()
   ↓
10. Service retorna VehicleBusiness
   ↓
11. Controller retorna Response HTTP 201 con VehicleBusiness
```

### Tipos en Cada Capa

```
HTTP Request (JSON)
  → CreateVehicleDTO (types.ts)
    → VehicleData (repository)
      → VehicleBusiness (service)
        → HTTP Response (JSON)
```

## Testing

La arquitectura facilita el testing en todos los niveles:

### Tests Unitarios (`test/unit/`)

- **Servicios**: Mock manual de repositorios (sin framework de mocking)
- **Repositorios**: Mock de PrismaClient usando Sinon
- **Validadores**: Mock de repositorios
- **Mappers**: Tests puros sin dependencias
- Base de datos: Ninguna (todo mockeado)

### Tests de Integración (`test/integration/`)

- **Repositorios + PrismaClient + BD real**
- Verifican persistencia y relaciones en base de datos de test (`vehicle_registry_test`)
- Cada test limpia los datos antes de ejecutar (deleteMany)
- Usan `.env.test` para configuración de base de datos

### Ejemplo de Test Unitario (Servicio):

```typescript
describe('VehicleService', () => {
  let service: VehicleService;
  let vehicleRepository: VehicleRepository;

  beforeEach(() => {
    vehicleRepository = new VehicleRepository();
    service = new VehicleService(vehicleRepository, ...);
  });

  it('should register vehicle', async () => {
    vehicleRepository.create = () => Promise.resolve(mockVehicleData);

    const result = await service.registerVehicle(dto);

    expect(result).to.not.have.property('propietarioId');
    expect(result.propietario).to.exist;
  });
});
```

### Ejemplo de Test Unitario (Repositorio con Sinon):

```typescript
import sinon from 'sinon';

describe('VehicleRepository Unit Tests', () => {
  let repository: VehicleRepository;
  let prismaMock: MockPrismaClient;

  beforeEach(() => {
    prismaMock = {
      vehicle: {
        findUnique: sinon.stub(),
        create: sinon.stub(),
      },
    };
    repository = new VehicleRepository(prismaMock as unknown as PrismaClient);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should call prisma.vehicle.findUnique', async () => {
    prismaMock.vehicle.findUnique.resolves(mockVehicle);

    const result = await repository.findById('vehicle-1');

    expect(result).to.deep.equal(mockVehicle);
    sinon.assert.calledOnceWithExactly(prismaMock.vehicle.findUnique, {
      where: { id: 'vehicle-1' },
      include: { propietario: true },
    });
  });
});
```

### Ejemplo de Test de Integración (Repositorio):

```typescript
describe('VehicleRepository Integration Tests', () => {
  let vehicleRepository: VehicleRepository;

  beforeEach(async () => {
    const prisma = getPrismaClient();
    await prisma.vehicle.deleteMany();
    await prisma.user.deleteMany();

    vehicleRepository = new VehicleRepository();
  });

  it('should create vehicle and persist to database', async () => {
    const vehicle = await vehicleRepository.create(vehicleData);

    // Verify persistence
    const fromDb = await vehicleRepository.findById(vehicle.id);
    expect(fromDb).to.not.be.null;
    expect(fromDb?.marca).to.equal('Toyota');
  });
});
```

## Convenciones de Código

### Nomenclatura

- **Repositorios**: `*Repository` (ej: `VehicleRepository`)
- **Servicios**: `*Service` (ej: `VehicleService`)
- **Validadores**: `*Validator` (ej: `VehicleValidator`)
- **Controladores**: `*Controller` (ej: `VehicleController`)
- **Tipos de Datos**: `*Data` (ej: `VehicleData`, `AuthorizedDriverData`)
- **Modelos de Negocio**: `*Business` (ej: `VehicleBusiness`)

### Estructura de Archivos

```
src/
├── interface/              # HTTP/API layer
│   ├── controllers/        # HTTP handlers
│   ├── middleware/         # Express middleware
│   └── routes/             # Route definitions
├── services/               # Business logic layer
│   ├── EntityMapper.ts     # Data transformation
│   ├── errors.ts           # Domain errors
│   ├── LicenseValidator.ts # License validation logic
│   ├── VehicleValidator.ts # Vehicle validations
│   ├── UserService.ts      # User business logic
│   ├── VehicleService.ts   # Vehicle business logic
│   └── types.ts            # Business models & DTOs
├── repositories/           # Data access layer
│   ├── VehicleRepository.ts
│   ├── UserRepository.ts
│   ├── AuthorizedDriverRepository.ts
│   ├── OwnershipHistoryRepository.ts
│   ├── prisma.ts           # Prisma client singleton
│   └── types.ts            # Data models with relations
└── index.ts                # Application entry point
```

## Mejoras Futuras

1. **Paginación Consistente**: Aplicar en todos los endpoints de listado
2. **Caché**: Implementar caché en repositorios para consultas frecuentes
3. **Eventos de Dominio**: Event sourcing para historial de cambios
4. **CQRS**: Separar comandos de queries para mejor escalabilidad
5. **GraphQL**: La arquitectura permite migrar fácilmente
