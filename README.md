# Backend Test - Prueba Técnica

La siguiente es una prueba para evaluar a los candidatos a desarrollador Backend.

En este repositorio se encuentran los requisitos de un ejercicio práctico diseñado para evaluar las habilidades técnicas del candidato en relación con las funciones clave y responsabilidades necesarias en el ámbito de Desarrollo Backend.

## 🎯 Propósito de la evaluación

El propósito principal de esta evaluación es analizar los siguientes aspectos clave:

- **Separación de responsabilidades** y arquitectura en capas (controladores, servicios, repositorios).
- **Calidad del código** producido, incluyendo la estructura y la aplicación de buenas prácticas (SOLID, Clean Code).
- **Validaciones de negocio** y manejo de errores apropiado.
- **Conocimiento de arquitectura REST** y convenciones HTTP.
- **Habilidades de testing** y cobertura de código.

## 📋 Requisitos previos

- Se solicita implementar la aplicación con el **stack de tu preferencia**. Sugerencias: **Python (FastAPI/Flask)**, **Kotlin/Java (Micronaut)**, **Node.js (Express)**, etc.
- Se requiere de una cuenta de GitHub para realizar este ejercicio.
- Tiempo estimado: **máximo 2 horas**.

## 🚀 Instrucciones de entrega

### Antes de comenzar a programar:

1. Realizar un **Fork** de este repositorio.
2. Clonar el fork a su máquina local.
3. Crear un **branch** en su cuenta de GitHub utilizando su nombre completo.

### Al concluir hay dos alternativas para entregar el proyecto:

1. Hacer un **Commit** de su proyecto, remitir un **Pull Request** al branch que lleva su NOMBRE y notificar a **[dev-team@gabaenergia.com](mailto:dev-team@gabaenergia.com)**.
2. Generar un archivo comprimido (`.zip` o `.rar`) de su proyecto y remitirlo a **[dev-team@gabaenergia.com](mailto:dev-team@gabaenergia.com)**.

---

## 🚗 Descripción del ejercicio

El objetivo de la prueba es **implementar un sistema de registro de vehículos** con las siguientes características:

### Modelo de datos

El sistema debe gestionar **usuarios** y **vehículos** con sus respectivos permisos de conducción.

#### Entidades requeridas

```
Usuario
- id: string/uuid
- nombre: string
- email: string (único)
- tipo_permiso: enum ['B', 'A', 'C']  // B=coche, A=moto, C=camión
- permiso_valido_hasta: date

Vehículo
- id: string/uuid
- marca: string
- modelo: string
- matricula: string (única)
- tipo: enum ['coche', 'moto', 'camion']
- propietario_id: string (referencia a Usuario)
```

### 📌 Reglas de negocio

1. Un usuario puede **no tener vehículos** asociados.
2. Los vehículos **siempre deben pertenecer a un usuario** (propietario).
3. Para registrar un vehículo, el propietario debe tener un **permiso válido** para ese tipo de vehículo:
   - Tipo de permiso 'B' → puede tener vehículos tipo 'coche'
   - Tipo de permiso 'A' → puede tener vehículos tipo 'moto'
   - Tipo de permiso 'C' → puede tener vehículos tipo 'camion'
4. El permiso no puede estar expirado (`permiso_valido_hasta` > fecha actual).

---

## 🔧 Operaciones requeridas

Debes implementar los siguientes endpoints REST:

### 1. Registrar un nuevo vehículo

```
POST /vehiculos
```

**Request body:**
```json
{
  "marca": "Toyota",
  "modelo": "Corolla",
  "matricula": "1234ABC",
  "tipo": "coche",
  "propietario_id": "usuario-123"
}
```

**Validaciones:**
- El propietario debe existir
- La matrícula debe ser única
- El propietario debe tener un permiso válido para el tipo de vehículo
- El permiso no debe estar expirado

**Response:** `201 Created` con los datos del vehículo creado.

**Errores posibles:**
- `400 Bad Request` - Si las validaciones fallan
- `404 Not Found` - Si el propietario no existe
- `409 Conflict` - Si la matrícula ya existe

---

### 2. Transferir propiedad de un vehículo

```
PUT /vehiculos/{id}/propietario
```

**Request body:**
```json
{
  "nuevo_propietario_id": "usuario-456"
}
```

**Validaciones:**
- El vehículo debe existir
- El nuevo propietario debe existir
- El nuevo propietario debe ser diferente del actual
- El nuevo propietario debe tener un permiso válido para el tipo de vehículo
- El permiso del nuevo propietario no debe estar expirado

**Response:** `200 OK` con los datos actualizados del vehículo.

**Errores posibles:**
- `400 Bad Request` - Si las validaciones fallan o el propietario es el mismo
- `404 Not Found` - Si el vehículo o el nuevo propietario no existen

---

### 3. Listar vehículos de un usuario

```
GET /usuarios/{id}/vehiculos
```

**Descripción:** Obtener todos los vehículos que pertenecen a un usuario específico.

**Response:** `200 OK` con un array de vehículos.

```json
[
  {
    "id": "vehiculo-1",
    "marca": "Toyota",
    "modelo": "Corolla",
    "matricula": "1234ABC",
    "tipo": "coche"
  },
  {
    "id": "vehiculo-2",
    "marca": "Honda",
    "modelo": "CBR",
    "matricula": "5678XYZ",
    "tipo": "moto"
  }
]
```

**Errores posibles:**
- `404 Not Found` - Si el usuario no existe

---

## ✨ Requisitos opcionales (extras para destacar)

> **Tip:** Antes de pasar a los requisitos opcionales, asegúrese de tener el código de su solución base como le gustaría. 👁️🗨️

### Extra 1: Múltiples conductores por vehículo

Implementar la funcionalidad para que **además del propietario**, otros usuarios puedan figurar como **conductores autorizados** de un vehículo.

#### Endpoints adicionales:

```
POST /vehiculos/{id}/conductores
```

**Request body:**
```json
{
  "conductor_id": "usuario-789"
}
```

**Validaciones:**
- El conductor debe tener un permiso válido para el tipo de vehículo
- El permiso no debe estar expirado
- El conductor no puede ser ya un conductor autorizado del vehículo

---

```
GET /vehiculos/{id}/conductores
```

**Response:** Lista de todos los conductores autorizados del vehículo (sin incluir al propietario).

---

### Extra 2: Revocar permiso de conducción

```
DELETE /usuarios/{id}/permiso
```

**Descripción:** Revocar el permiso de conducción de un usuario (marcar como expirado).

**Validaciones:**
- El usuario debe existir
- Al revocar el permiso, se debe validar que no tenga vehículos registrados a su nombre

**Response:** `204 No Content`

**Errores posibles:**
- `400 Bad Request` - Si el usuario tiene vehículos registrados
- `404 Not Found` - Si el usuario no existe

---

### Extra 3: Historial de propietarios

```
GET /vehiculos/{id}/historial-propietarios
```

**Descripción:** Devolver el historial completo de propietarios de un vehículo, ordenado cronológicamente.

**Implementación requerida:**
- Crear una tabla de auditoría que registre cada cambio de propietario
- Incluir fecha de inicio y fecha de fin de cada periodo de propiedad

**Response:** `200 OK`

```json
{
  "vehiculo_id": "vehiculo-1",
  "matricula": "1234ABC",
  "historial": [
    {
      "propietario": {
        "id": "usuario-1",
        "nombre": "Juan Pérez"
      },
      "fecha_inicio": "2023-01-15T10:00:00Z",
      "fecha_fin": "2024-03-20T14:30:00Z"
    },
    {
      "propietario": {
        "id": "usuario-2",
        "nombre": "María García"
      },
      "fecha_inicio": "2024-03-20T14:30:00Z",
      "fecha_fin": null
    }
  ]
}
```

---

## 📝 Casos de prueba sugeridos

### Caso 1: Registrar vehículo con permiso válido
1. Crear un usuario con permiso tipo 'B' válido hasta 2026
2. Registrar un vehículo de tipo "coche" para ese usuario
✅ Debería crear el vehículo exitosamente

### Caso 2: Rechazar registro con permiso inadecuado
1. Crear un usuario con permiso tipo 'A' (moto)
2. Intentar registrar un vehículo de tipo "coche"
❌ Debería rechazar la operación con error 400

### Caso 3: Rechazar registro con permiso expirado
1. Crear un usuario con permiso tipo 'B' expirado (fecha pasada)
2. Intentar registrar un vehículo de tipo "coche"
❌ Debería rechazar la operación con error 400

### Caso 4: Transferir propiedad exitosamente
1. Crear usuario A con un vehículo y usuario B con permiso válido
2. Transferir el vehículo de A a B
✅ El vehículo debería tener como nuevo propietario a B

### Caso 5: Rechazar transferencia a usuario sin permiso válido
1. Crear usuario A con un vehículo y usuario B sin permiso adecuado
2. Intentar transferir el vehículo de A a B
❌ Debería rechazar la operación con error 400

### Caso 6: Listar vehículos de usuario
1. Crear un usuario con 2 vehículos registrados
2. Consultar los vehículos del usuario
✅ Debería devolver array con 2 vehículos

---

## 🎨 Consideraciones técnicas

> **Importante:** Ten en cuenta que el uso de una correcta arquitectura y buenas prácticas de programación es muy importante para nosotros. 📚

Si decides usar algún patrón de diseño o aplicar cualquier otra técnica, no olvides mencionarlo en la defensa de tu solución. 🗣️

### Se valorará especialmente:

- ✅ **Separación de responsabilidades**
- ✅ **Validaciones de negocio** implementadas en la capa de servicio
- ✅ **Manejo apropiado de errores** y códigos de estado HTTP
- ✅ **Respeto de los principios SOLID**
- ✅ **Adecuación a la convención REST** (verbos HTTP, rutas, responses)
- ✅ **Claridad de estilo** y legibilidad del código
- ✅ **Cobertura de tests** (unitarios para lógica de negocio)

---

## 💡 Nota final

Esta prueba está diseñada para completarse en **2 horas como máximo**. Prioriza:

1. ✅ **Completar los 3 endpoints básicos** con buenas prácticas
2. ✅ **Implementar validaciones correctas**
3. ✅ **Separación clara de responsabilidades**
4. ✅ **Al menos algunos tests unitarios**

Los extras son opcionales y permiten demostrar nivel avanzado. **No son obligatorios**.

¡Buena suerte! 🚀
