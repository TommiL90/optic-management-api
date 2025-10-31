# Historia de Usuario — API de Cotización de Lentes

**Como** vendedor/usuario de la óptica
**Quiero** introducir en la UI la receta por ojo (esfera y cilindro) en inputs numéricos con paso `0.25` y enviar esa receta a una API
**Para** recibir de inmediato una lista con todos los lentes compatibles con esa receta, con su precio final, características, tiempo de entrega y observaciones.

---

## Resumen Ejecutivo

Esta historia de usuario define:
- **Backend**: API REST para cotizar lentes según receta oftalmológica (OD/OI)
- **Frontend**: Formulario React con validación Zod y React Hook Form
- **Datos**: Sistema de rangos de prescripción con productos pre-configurados y precios finales fijos

**Aclaraciones importantes del modelo de negocio:**
- Los productos NO tienen precios calculados dinámicamente con "modifiers"
- Cada producto tiene un **precio final fijo** que ya incluye todas las características
- El mismo producto físico (ej: "ORGANICO ANTIREFLEJO NORMAL") tiene **precios diferentes** según la complejidad de la receta
- Las combinaciones de prescripción están **todas tabuladas** en tablas Excel del negocio

---

## Parte 1: Backend (API)

### 1.1 Requisitos Funcionales

1. **Normalización de valores**
   - Todos los valores de esfera y cilindro deben usar paso de **0.25**
   - Fórmula: `normalized = Math.round(value * 4) / 4`
   - Ejemplo: `-3.76` se normaliza a `-3.75`

2. **Soporte de notación abreviada**
   - `42` significa `4.00 esfera / 2.00 cilindro`
   - `ODI 44` significa ambos ojos con `4.00 esfera / 4.00 cilindro`
   - Conversión bidireccional para compatibilidad con sistemas heredados

3. **Sistema de rangos de prescripción**
   - Cada combinación de rangos OD/OI tiene su propia tabla de precios
   - Se busca el rango que **cubre** la prescripción ingresada
   - Si ambos ojos están dentro de 4/2, se usa la tabla "42-42"
   - Si un ojo es 4/2 y el otro 4/4, se usa la tabla "42-44"

4. **Filtrado de productos**
   - Filtrar por: tipo de marco (cerrado, semicerrado, al_aire)
   - Filtros opcionales: material, coatings, características especiales
   - Devolver productos ordenados por precio ascendente (default)

5. **Trazabilidad**
   - Guardar prescripción original (antes de normalizar)
   - Guardar prescripción normalizada usada para búsqueda
   - Registrar qué rango de prescripción se usó
   - Timestamp de la cotización

### 1.2 Modelo de Datos (Prisma)

```prisma
// Representa las combinaciones de receta válidas (rangos)
model PrescriptionRange {
  id          String  @id @default(cuid())
  code        String  @unique // "42-42", "42-44", "ODI-44", "44-46", etc.
  description String  // "Ambos ojos hasta 4 esf / 2 cyl"

  // Rangos OD (ojo derecho)
  odMaxSphere    Float  // 4.00
  odMaxCylinder  Float  // 2.00

  // Rangos OI (ojo izquierdo)
  oiMaxSphere    Float  // 4.00
  oiMaxCylinder  Float  // 2.00

  // Relación con productos
  products    LensProduct[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([odMaxSphere, odMaxCylinder, oiMaxSphere, oiMaxCylinder])
}

// Representa un producto de lente específico para un rango de prescripción
model LensProduct {
  id          String  @id @default(cuid())
  sku         String  @unique // "ORG-AR-NORMAL-42-42-CERRADO"
  name        String  // "ORGANICO ANTIREFLEJO NORMAL"

  // Características del producto
  material        String  // "organico", "policarbonato", "mineral", "adelgazado"
  tipo            String  // "monofocal", "bifocal", "multifocal"
  frameType       String  // "cerrado", "semicerrado", "al_aire", "todos"

  // Features booleanas
  hasAntiReflective  Boolean @default(false)
  hasBlueFilter      Boolean @default(false)
  isPhotochromic     Boolean @default(false)
  hasUVProtection    Boolean @default(false)
  isPolarized        Boolean @default(false)
  isMirrored         Boolean @default(false)

  // Precios (en CLP)
  costPrice      Int?    // Costo del cristal (solo referencia, opcional)
  basePrice      Int     // Precio base del cristal (ej: 2000)
  finalPrice     Int     // Precio final al público (ej: 39900)

  // Logística
  deliveryDays   Int     // 3, 4, 7-10 (días hábiles)
  observations   String? // "Se entrega en 3 días hábiles"
  available      Boolean @default(true)

  // Relación con rango de prescripción
  prescriptionRangeId  String
  prescriptionRange    PrescriptionRange @relation(fields: [prescriptionRangeId], references: [id], onDelete: Cascade)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([prescriptionRangeId])
  @@index([material])
  @@index([frameType])
  @@index([available])
}
```

### 1.3 Combinaciones de Prescripción Soportadas

Basado en las tablas del negocio, estas son las combinaciones que deben existir en `PrescriptionRange`:

| Código | Descripción | OD Max Esf/Cil | OI Max Esf/Cil |
|--------|-------------|----------------|----------------|
| `42-42` | Ambos ojos hasta 4/2 | 4.00 / 2.00 | 4.00 / 2.00 |
| `42-44` | OD hasta 4/2, OI hasta 4/4 | 4.00 / 2.00 | 4.00 / 4.00 |
| `ODI-44` | Ambos ojos hasta 4/4 | 4.00 / 4.00 | 4.00 / 4.00 |
| `44-46` | OD hasta 4/4, OI hasta 4/6 | 4.00 / 4.00 | 4.00 / 6.00 |
| `ODI-46` | Ambos ojos hasta 4/6 | 4.00 / 6.00 | 4.00 / 6.00 |
| `44-66` | OD hasta 4/4, OI hasta 6/6 | 4.00 / 4.00 | 6.00 / 6.00 |
| `ODI-62` | Ambos ojos hasta 6/2 | 6.00 / 2.00 | 6.00 / 2.00 |
| `62-42` | OD hasta 6/2, OI hasta 4/2 | 6.00 / 2.00 | 4.00 / 2.00 |
| `ODI-66` | Ambos ojos hasta 6/6 | 6.00 / 6.00 | 6.00 / 6.00 |

### 1.4 Contrato de API

#### POST /api/lenses/quote

**Request Body:**
```json
{
  "prescription": {
    "od": {
      "sphere": -3.75,
      "cylinder": -2.75
    },
    "oi": {
      "sphere": -4.00,
      "cylinder": -2.00
    }
  },
  "filters": {
    "frameType": "cerrado",       // REQUERIDO: "cerrado" | "semicerrado" | "al_aire"
    "material": "organico",        // OPCIONAL: "organico" | "policarbonato" | "mineral" | "adelgazado"
    "hasBlueFilter": true,         // OPCIONAL
    "isPhotochromic": false,       // OPCIONAL
    "hasAntiReflective": true,     // OPCIONAL
    "isPolarized": false,          // OPCIONAL
    "tipo": "monofocal"            // OPCIONAL: "monofocal" | "bifocal" | "multifocal"
  }
}
```

**Validaciones:**
- `prescription.od.sphere` y `prescription.od.cylinder`: números requeridos
- `prescription.oi.sphere` y `prescription.oi.cylinder`: números requeridos
- `filters.frameType`: string requerido (enum)
- Todos los demás filtros son opcionales

**Response 200:**
```json
{
  "results": [
    {
      "productId": "clx123abc",
      "sku": "ORG-AR-AZUL-42-42-CERRADO",
      "name": "ORGANICO ANTIREFLEJO AZUL",
      "material": "organico",
      "tipo": "monofocal",
      "frameType": "cerrado",
      "features": {
        "hasAntiReflective": true,
        "hasBlueFilter": true,
        "isPhotochromic": false,
        "hasUVProtection": true,
        "isPolarized": false,
        "isMirrored": false
      },
      "pricing": {
        "basePrice": 3500,
        "finalPrice": 54900
      },
      "deliveryDays": 3,
      "observations": "Se entrega en 3 días hábiles"
    },
    {
      "productId": "clx123def",
      "sku": "ORG-FOTOCROM-GRIS-42-42-CERRADO",
      "name": "ORGANICO FOTOCROMÁTICO GRIS CON UV GARANTIZADO Y FILTRO AZUL",
      "material": "organico",
      "tipo": "monofocal",
      "frameType": "cerrado",
      "features": {
        "hasAntiReflective": false,
        "hasBlueFilter": true,
        "isPhotochromic": true,
        "hasUVProtection": true,
        "isPolarized": false,
        "isMirrored": false
      },
      "pricing": {
        "basePrice": 7500,
        "finalPrice": 84900
      },
      "deliveryDays": 3,
      "observations": "Se entrega en 3 días hábiles"
    }
  ],
  "meta": {
    "originalPrescription": {
      "od": {"sphere": -3.76, "cylinder": -2.75},
      "oi": {"sphere": -4.00, "cylinder": -2.00}
    },
    "normalizedPrescription": {
      "od": {"sphere": -3.75, "cylinder": -2.75},
      "oi": {"sphere": -4.00, "cylinder": -2.00}
    },
    "prescriptionRangeUsed": {
      "code": "42-42",
      "description": "Ambos ojos hasta 4 esf / 2 cyl"
    },
    "totalResults": 15,
    "filtersApplied": {
      "frameType": "cerrado",
      "material": "organico",
      "hasBlueFilter": true
    }
  }
}
```

**Response 404:**
```json
{
  "error": "NO_PRESCRIPTION_RANGE_FOUND",
  "message": "No se encontró una tabla de precios que cubra esta prescripción",
  "prescription": {
    "od": {"sphere": -12.00, "cylinder": -8.00},
    "oi": {"sphere": -10.00, "cylinder": -6.00}
  }
}
```

**Response 400:**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Errores de validación",
  "issues": [
    {
      "field": "prescription.od.sphere",
      "message": "El valor debe estar entre -12.00 y +8.00"
    },
    {
      "field": "filters.frameType",
      "message": "Campo requerido"
    }
  ]
}
```

### 1.5 Algoritmo de Resolución (Backend)

```typescript
// Paso 1: Normalizar valores (redondear a múltiplos de 0.25)
function normalizeValue(value: number): number {
  return Math.round(value * 4) / 4;
}

// Paso 2: Encontrar el PrescriptionRange aplicable
async function findPrescriptionRange(
  odSphere: number,
  odCylinder: number,
  oiSphere: number,
  oiCylinder: number
) {
  // Normalizar y convertir a valores absolutos
  const odSphereAbs = Math.abs(normalizeValue(odSphere));
  const odCylinderAbs = Math.abs(normalizeValue(odCylinder));
  const oiSphereAbs = Math.abs(normalizeValue(oiSphere));
  const oiCylinderAbs = Math.abs(normalizeValue(oiCylinder));

  // Buscar el rango más específico que cubra la prescripción
  const range = await prisma.prescriptionRange.findFirst({
    where: {
      odMaxSphere: { gte: odSphereAbs },
      odMaxCylinder: { gte: odCylinderAbs },
      oiMaxSphere: { gte: oiSphereAbs },
      oiMaxCylinder: { gte: oiCylinderAbs },
    },
    orderBy: [
      { odMaxSphere: 'asc' },
      { odMaxCylinder: 'asc' },
      { oiMaxSphere: 'asc' },
      { oiMaxCylinder: 'asc' },
    ]
  });

  return range;
}

// Paso 3: Filtrar productos del rango
async function findProducts(prescriptionRangeId: string, filters: Filters) {
  const products = await prisma.lensProduct.findMany({
    where: {
      prescriptionRangeId,
      available: true,
      frameType: filters.frameType,
      ...(filters.material && { material: filters.material }),
      ...(filters.hasBlueFilter !== undefined && { hasBlueFilter: filters.hasBlueFilter }),
      ...(filters.isPhotochromic !== undefined && { isPhotochromic: filters.isPhotochromic }),
      ...(filters.hasAntiReflective !== undefined && { hasAntiReflective: filters.hasAntiReflective }),
      ...(filters.isPolarized !== undefined && { isPolarized: filters.isPolarized }),
      ...(filters.tipo && { tipo: filters.tipo }),
    },
    orderBy: {
      finalPrice: 'asc'
    }
  });

  return products;
}

// Paso 4: Orquestar todo en el servicio
async function quoteLenses(request: QuoteRequest) {
  // 1. Guardar prescripción original
  const original = { ...request.prescription };

  // 2. Normalizar
  const normalized = {
    od: {
      sphere: normalizeValue(request.prescription.od.sphere),
      cylinder: normalizeValue(request.prescription.od.cylinder),
    },
    oi: {
      sphere: normalizeValue(request.prescription.oi.sphere),
      cylinder: normalizeValue(request.prescription.oi.cylinder),
    },
  };

  // 3. Buscar rango
  const range = await findPrescriptionRange(
    normalized.od.sphere,
    normalized.od.cylinder,
    normalized.oi.sphere,
    normalized.oi.cylinder
  );

  if (!range) {
    throw new PrescriptionRangeNotFoundError();
  }

  // 4. Buscar productos
  const products = await findProducts(range.id, request.filters);

  // 5. Construir respuesta
  return {
    results: products.map(mapToProductDTO),
    meta: {
      originalPrescription: original,
      normalizedPrescription: normalized,
      prescriptionRangeUsed: {
        code: range.code,
        description: range.description,
      },
      totalResults: products.length,
      filtersApplied: request.filters,
    },
  };
}
```

### 1.6 Casos de Prueba

#### Caso 1: Receta básica 4/2 - 4/2
```json
{
  "prescription": {
    "od": { "sphere": -4.00, "cylinder": -2.00 },
    "oi": { "sphere": -4.00, "cylinder": -2.00 }
  },
  "filters": { "frameType": "cerrado" }
}
```
- **Rango esperado**: `42-42`
- **Productos esperados**: Todos los de la tabla "MARCO: CERRADO (1)" para 42-42

#### Caso 2: Receta mixta 4/2 - 4/4
```json
{
  "prescription": {
    "od": { "sphere": -3.75, "cylinder": -2.00 },
    "oi": { "sphere": -4.00, "cylinder": -4.00 }
  },
  "filters": { "frameType": "cerrado" }
}
```
- **Rango esperado**: `42-44`
- **Normalización**: OD ya está en 3.75 (múltiplo de 0.25)

#### Caso 3: Normalización requerida
```json
{
  "prescription": {
    "od": { "sphere": -3.76, "cylinder": -2.13 },
    "oi": { "sphere": -4.00, "cylinder": -2.00 }
  },
  "filters": { "frameType": "cerrado" }
}
```
- **Normalización**:
  - OD sphere: -3.76 → -3.75
  - OD cylinder: -2.13 → -2.25
- **Rango esperado**: `42-42` (porque 3.75 ≤ 4.00 y 2.25 ≤ 2.00 es falso, entonces busca 42-44 o superior)

#### Caso 4: Filtros múltiples
```json
{
  "prescription": {
    "od": { "sphere": -4.00, "cylinder": -2.00 },
    "oi": { "sphere": -4.00, "cylinder": -2.00 }
  },
  "filters": {
    "frameType": "cerrado",
    "material": "organico",
    "hasBlueFilter": true,
    "isPhotochromic": false
  }
}
```
- **Productos esperados**: Solo orgánicos con filtro azul, sin fotocromático

---

## Parte 2: Frontend (React + React Hook Form + Zod)

### 2.1 Estructura de Componentes

```
src/
├── features/
│   └── lenses/
│       ├── components/
│       │   ├── LensPrescriptionForm.tsx       # Formulario principal
│       │   ├── PrescriptionInput.tsx          # Input numérico con step 0.25
│       │   ├── LensFilters.tsx                # Filtros opcionales
│       │   ├── LensResultsList.tsx            # Listado de productos
│       │   └── LensProductCard.tsx            # Tarjeta de producto
│       ├── schemas/
│       │   └── lens-quote.schema.ts           # Schemas Zod
│       ├── hooks/
│       │   └── useLensQuote.ts                # Hook para llamar API
│       └── types/
│           └── lens-quote.types.ts            # Tipos inferidos de Zod
```

### 2.2 Validación con Zod

**Archivo: `src/features/lenses/schemas/lens-quote.schema.ts`**

```typescript
import { z } from 'zod';

// Helper para validar valores con step 0.25
const stepQuarter = z.number()
  .refine(
    (val) => {
      const normalized = Math.round(val * 4) / 4;
      return Math.abs(val - normalized) < 0.01; // Tolerancia por precisión de floats
    },
    { message: "El valor debe ser múltiplo de 0.25 (ej: -3.75, -4.00, -4.25)" }
  );

// Schema para un ojo
const eyePrescriptionSchema = z.object({
  sphere: stepQuarter
    .min(-12, "La esfera mínima es -12.00")
    .max(8, "La esfera máxima es +8.00"),
  cylinder: stepQuarter
    .min(-8, "El cilindro mínimo es -8.00")
    .max(0, "El cilindro máximo es 0.00"),
});

// Schema del formulario completo
export const lensQuoteFormSchema = z.object({
  prescription: z.object({
    od: eyePrescriptionSchema,
    oi: eyePrescriptionSchema,
  }),
  filters: z.object({
    frameType: z.enum(['cerrado', 'semicerrado', 'al_aire'], {
      required_error: "Debe seleccionar un tipo de marco"
    }),
    material: z.enum(['organico', 'policarbonato', 'mineral', 'adelgazado']).optional(),
    hasBlueFilter: z.boolean().optional(),
    isPhotochromic: z.boolean().optional(),
    hasAntiReflective: z.boolean().optional(),
    isPolarized: z.boolean().optional(),
    tipo: z.enum(['monofocal', 'bifocal', 'multifocal']).optional(),
  }),
});

// Schema de la respuesta del API
export const lensProductSchema = z.object({
  productId: z.string(),
  sku: z.string(),
  name: z.string(),
  material: z.string(),
  tipo: z.string(),
  frameType: z.string(),
  features: z.object({
    hasAntiReflective: z.boolean(),
    hasBlueFilter: z.boolean(),
    isPhotochromic: z.boolean(),
    hasUVProtection: z.boolean(),
    isPolarized: z.boolean(),
    isMirrored: z.boolean(),
  }),
  pricing: z.object({
    basePrice: z.number(),
    finalPrice: z.number(),
  }),
  deliveryDays: z.number(),
  observations: z.string().nullable(),
});

export const lensQuoteResponseSchema = z.object({
  results: z.array(lensProductSchema),
  meta: z.object({
    originalPrescription: z.object({
      od: eyePrescriptionSchema,
      oi: eyePrescriptionSchema,
    }),
    normalizedPrescription: z.object({
      od: eyePrescriptionSchema,
      oi: eyePrescriptionSchema,
    }),
    prescriptionRangeUsed: z.object({
      code: z.string(),
      description: z.string(),
    }),
    totalResults: z.number(),
    filtersApplied: z.record(z.any()),
  }),
});

// Inferir tipos TypeScript desde los schemas
export type LensQuoteFormData = z.infer<typeof lensQuoteFormSchema>;
export type LensProduct = z.infer<typeof lensProductSchema>;
export type LensQuoteResponse = z.infer<typeof lensQuoteResponseSchema>;
```

### 2.3 Componente: Input de Prescripción

**Archivo: `src/features/lenses/components/PrescriptionInput.tsx`**

```tsx
import { useFormContext } from 'react-hook-form';
import type { LensQuoteFormData } from '../schemas/lens-quote.schema';

interface PrescriptionInputProps {
  name: keyof LensQuoteFormData['prescription']['od'];
  eye: 'od' | 'oi';
  label: string;
  placeholder?: string;
}

export function PrescriptionInput({ name, eye, label, placeholder }: PrescriptionInputProps) {
  const {
    register,
    formState: { errors }
  } = useFormContext<LensQuoteFormData>();

  const fieldName = `prescription.${eye}.${name}` as const;
  const error = errors.prescription?.[eye]?.[name];

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldName} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={fieldName}
        type="number"
        step="0.25"
        placeholder={placeholder ?? "-4.00"}
        className={`
          px-3 py-2 border rounded-md
          focus:outline-none focus:ring-2 focus:ring-blue-500
          ${error ? 'border-red-500' : 'border-gray-300'}
        `}
        {...register(fieldName, { valueAsNumber: true })}
      />
      {error && (
        <span className="text-xs text-red-600">{error.message}</span>
      )}
    </div>
  );
}
```

### 2.4 Componente: Formulario Principal

**Archivo: `src/features/lenses/components/LensPrescriptionForm.tsx`**

```tsx
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { lensQuoteFormSchema, type LensQuoteFormData } from '../schemas/lens-quote.schema';
import { PrescriptionInput } from './PrescriptionInput';
import { LensFilters } from './LensFilters';
import { useLensQuote } from '../hooks/useLensQuote';

export function LensPrescriptionForm() {
  const methods = useForm<LensQuoteFormData>({
    resolver: zodResolver(lensQuoteFormSchema),
    defaultValues: {
      prescription: {
        od: { sphere: 0, cylinder: 0 },
        oi: { sphere: 0, cylinder: 0 },
      },
      filters: {
        frameType: 'cerrado',
      },
    },
  });

  const { mutate: quoteLenses, isPending, data, error } = useLensQuote();

  const onSubmit = (data: LensQuoteFormData) => {
    quoteLenses(data);
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="space-y-6 bg-white p-6 rounded-lg shadow"
      >
        {/* Ojo Derecho (OD) */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Ojo Derecho (OD)</h3>
          <div className="grid grid-cols-2 gap-4">
            <PrescriptionInput name="sphere" eye="od" label="Esfera" />
            <PrescriptionInput name="cylinder" eye="od" label="Cilindro" />
          </div>
        </div>

        {/* Ojo Izquierdo (OI) */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Ojo Izquierdo (OI)</h3>
          <div className="grid grid-cols-2 gap-4">
            <PrescriptionInput name="sphere" eye="oi" label="Esfera" />
            <PrescriptionInput name="cylinder" eye="oi" label="Cilindro" />
          </div>
        </div>

        {/* Filtros */}
        <LensFilters />

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="
            w-full px-4 py-2
            bg-blue-600 hover:bg-blue-700
            text-white font-medium rounded-md
            disabled:bg-gray-400 disabled:cursor-not-allowed
            transition-colors
          "
        >
          {isPending ? 'Cotizando...' : 'Cotizar Lentes'}
        </button>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error.message}</p>
          </div>
        )}
      </form>
    </FormProvider>
  );
}
```

### 2.5 Hook: Llamada al API

**Archivo: `src/features/lenses/hooks/useLensQuote.ts`**

```typescript
import { useMutation } from '@tanstack/react-query';
import { lensQuoteResponseSchema, type LensQuoteFormData, type LensQuoteResponse } from '../schemas/lens-quote.schema';

async function quoteLensesAPI(data: LensQuoteFormData): Promise<LensQuoteResponse> {
  const response = await fetch('/api/lenses/quote', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al cotizar lentes');
  }

  const json = await response.json();

  // Validar respuesta con Zod
  const validated = lensQuoteResponseSchema.parse(json);

  return validated;
}

export function useLensQuote() {
  return useMutation({
    mutationFn: quoteLensesAPI,
    onSuccess: (data) => {
      console.log('Cotización exitosa:', data);
    },
    onError: (error) => {
      console.error('Error en cotización:', error);
    },
  });
}
```

### 2.6 Componente: Listado de Resultados

**Archivo: `src/features/lenses/components/LensResultsList.tsx`**

```tsx
import type { LensQuoteResponse } from '../schemas/lens-quote.schema';
import { LensProductCard } from './LensProductCard';

interface LensResultsListProps {
  data: LensQuoteResponse;
}

export function LensResultsList({ data }: LensResultsListProps) {
  return (
    <div className="space-y-6">
      {/* Meta info */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Información de la cotización</h3>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-blue-700">Rango usado:</dt>
          <dd className="text-blue-900 font-medium">{data.meta.prescriptionRangeUsed.code}</dd>

          <dt className="text-blue-700">Descripción:</dt>
          <dd className="text-blue-900">{data.meta.prescriptionRangeUsed.description}</dd>

          <dt className="text-blue-700">Resultados:</dt>
          <dd className="text-blue-900 font-medium">{data.meta.totalResults} productos</dd>
        </dl>
      </div>

      {/* Lista de productos */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Lentes disponibles ({data.results.length})
        </h3>

        {data.results.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No se encontraron productos con los filtros seleccionados
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.results.map((product) => (
              <LensProductCard key={product.productId} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

### 2.7 Componente: Tarjeta de Producto

**Archivo: `src/features/lenses/components/LensProductCard.tsx`**

```tsx
import type { LensProduct } from '../schemas/lens-quote.schema';

interface LensProductCardProps {
  product: LensProduct;
}

export function LensProductCard({ product }: LensProductCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="mb-3">
        <h4 className="font-semibold text-gray-900 mb-1">{product.name}</h4>
        <p className="text-xs text-gray-500 uppercase tracking-wide">{product.sku}</p>
      </div>

      {/* Features */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">Material:</span>
          <span className="font-medium text-gray-900 capitalize">{product.material}</span>
        </div>

        <div className="flex flex-wrap gap-1">
          {product.features.hasAntiReflective && (
            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">
              Antirreflejo
            </span>
          )}
          {product.features.hasBlueFilter && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
              Filtro Azul
            </span>
          )}
          {product.features.isPhotochromic && (
            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded">
              Fotocromático
            </span>
          )}
          {product.features.hasUVProtection && (
            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded">
              UV
            </span>
          )}
          {product.features.isPolarized && (
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs rounded">
              Polarizado
            </span>
          )}
        </div>
      </div>

      {/* Pricing */}
      <div className="border-t border-gray-200 pt-3 mb-3">
        <div className="flex justify-between items-baseline">
          <span className="text-sm text-gray-600">Precio:</span>
          <span className="text-2xl font-bold text-gray-900">
            ${product.pricing.finalPrice.toLocaleString('es-CL')}
          </span>
        </div>
        <div className="flex justify-between items-baseline mt-1">
          <span className="text-xs text-gray-500">Base:</span>
          <span className="text-xs text-gray-600">
            ${product.pricing.basePrice.toLocaleString('es-CL')}
          </span>
        </div>
      </div>

      {/* Delivery */}
      <div className="text-sm text-gray-600">
        <span className="inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {product.deliveryDays} días hábiles
        </span>
      </div>

      {/* Observations */}
      {product.observations && (
        <p className="text-xs text-gray-500 mt-2 italic">{product.observations}</p>
      )}
    </div>
  );
}
```

### 2.8 UI/UX - Flujo de Usuario

1. **Carga inicial**:
   - Formulario vacío con valores por defecto (0.00 en todos los campos)
   - Tipo de marco pre-seleccionado en "cerrado"

2. **Entrada de datos**:
   - Usuario ingresa valores con teclado
   - Inputs numéricos con `step="0.25"` permiten usar flechas arriba/abajo
   - Validación en tiempo real (on blur o on submit)
   - Si ingresa 3.76, mostrar warning: "Se normalizará a 3.75"

3. **Submit**:
   - Al presionar Enter o botón "Cotizar"
   - Mostrar loading state en botón ("Cotizando...")
   - Deshabilitar formulario durante la petición

4. **Resultados**:
   - Mostrar meta información (rango usado, total de resultados)
   - Listar productos en cards ordenados por precio
   - Highlight de características con badges de colores
   - Precio destacado en grande

5. **Errores**:
   - Errores de validación bajo cada input
   - Error de API en banner rojo arriba del formulario
   - Si no hay productos, mostrar mensaje amigable

### 2.9 Mejoras Opcionales para el Frontend

1. **Autocompletado**:
   - Guardar últimas recetas en localStorage
   - Sugerir recetas anteriores

2. **Comparación**:
   - Checkbox para seleccionar hasta 3 productos
   - Vista de comparación lado a lado

3. **Ordenamiento**:
   - Botones para ordenar por: precio, tiempo de entrega, características

4. **Exportar**:
   - Botón para descargar cotización en PDF
   - Enviar por email al paciente

5. **Abreviaciones**:
   - Input adicional para ingresar código abreviado (ej: "42")
   - Convertir automáticamente a valores numéricos

---

## Parte 3: Plan de Implementación

### Fase 1: Backend

1. **Prisma Schema** → `prisma/schema.prisma`
   - Agregar modelos `PrescriptionRange` y `LensProduct`
   - Ejecutar: `pnpm prisma:migrate`

2. **Módulo lenses** → `src/modules/lenses/`
   - Schemas Zod: `schemas/lenses.schemas.ts`
   - Repository: `repositories/lenses.repository.interface.ts` + implementación Prisma
   - Service: `lenses.service.ts` con lógica de normalización y búsqueda
   - Handlers: `lenses.handlers.ts`
   - Routes: `lenses.routes.ts`
   - Plugin: `lenses.plugin.ts`
   - Factory: `factories/make-lenses-service.ts`

3. **Testing**
   - Unit: `__tests__/lenses.service.test.ts`
   - E2E: `__tests__/lenses.routes.e2e-test.ts`

4. **Seed de datos**
   - Script: `prisma/seeds/lenses-seed.ts`
   - Cargar las 9 combinaciones de `PrescriptionRange`
   - Cargar productos desde tablas Excel

### Fase 2: Frontend (React)

1. **Schemas Zod**
   - `src/features/lenses/schemas/lens-quote.schema.ts`

2. **Componentes**
   - `PrescriptionInput.tsx`
   - `LensFilters.tsx`
   - `LensPrescriptionForm.tsx`
   - `LensProductCard.tsx`
   - `LensResultsList.tsx`

3. **Hooks**
   - `useLensQuote.ts` con React Query

4. **Página**
   - `src/pages/LensQuotePage.tsx` o integrar en el layout existente

### Fase 3: Integración y Testing

1. **Validar flujo completo**: Frontend → API → DB → Response
2. **Testing E2E con Playwright** (opcional)
3. **Ajustes de UI/UX** según feedback

---

## Criterios de Aceptación

### Backend
- [ ] La API normaliza valores correctamente (3.76 → 3.75)
- [ ] Encuentra el `PrescriptionRange` correcto para cada receta
- [ ] Filtra productos según `frameType` (requerido) y filtros opcionales
- [ ] Devuelve productos ordenados por precio ascendente
- [ ] Maneja errores: rango no encontrado, validación fallida
- [ ] Incluye trazabilidad en la respuesta (prescripción original y normalizada)
- [ ] Tests unitarios cubren casos edge (normalización, búsqueda de rangos)
- [ ] Tests E2E validan el flujo completo

### Frontend
- [ ] Inputs numéricos con `step="0.25"` funcionan correctamente
- [ ] Validación Zod muestra errores en tiempo real
- [ ] Submit deshabilitado durante loading
- [ ] Resultados se muestran en cards ordenados por precio
- [ ] Meta información visible (rango usado, total de resultados)
- [ ] Features destacadas con badges de colores
- [ ] Manejo de errores (API, validación)
- [ ] Responsive en mobile y desktop

---

## Notas Técnicas

### Backend
- Usar índices en Prisma para optimizar búsquedas:
  - `PrescriptionRange`: índice compuesto en `[odMaxSphere, odMaxCylinder, oiMaxSphere, oiMaxCylinder]`
  - `LensProduct`: índices en `[prescriptionRangeId]`, `[material]`, `[frameType]`, `[available]`

- Considerar caché para rangos frecuentes (Redis opcional)

### Frontend
- Usar React Query para caché automático de resultados
- Debounce en inputs si se implementa búsqueda en tiempo real
- Validar en cliente antes de enviar al servidor (evitar requests inválidos)

---

## Ejemplo de Seed Data

```typescript
// prisma/seeds/lenses-seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Crear rangos de prescripción
  const range4242 = await prisma.prescriptionRange.create({
    data: {
      code: '42-42',
      description: 'Ambos ojos hasta 4 esf / 2 cyl',
      odMaxSphere: 4.00,
      odMaxCylinder: 2.00,
      oiMaxSphere: 4.00,
      oiMaxCylinder: 2.00,
    },
  });

  // Crear productos para el rango 42-42, marco cerrado
  await prisma.lensProduct.createMany({
    data: [
      {
        sku: 'ORG-AR-NORMAL-42-42-CERRADO',
        name: 'ORGANICO ANTIREFLEJO NORMAL',
        material: 'organico',
        tipo: 'monofocal',
        frameType: 'cerrado',
        hasAntiReflective: true,
        hasBlueFilter: false,
        isPhotochromic: false,
        hasUVProtection: true,
        isPolarized: false,
        isMirrored: false,
        costPrice: 750,
        basePrice: 2000,
        finalPrice: 39900,
        deliveryDays: 3,
        observations: 'Se entrega en 3 días hábiles',
        available: true,
        prescriptionRangeId: range4242.id,
      },
      {
        sku: 'ORG-AR-AZUL-42-42-CERRADO',
        name: 'ORGANICO ANTIREFLEJO AZUL',
        material: 'organico',
        tipo: 'monofocal',
        frameType: 'cerrado',
        hasAntiReflective: true,
        hasBlueFilter: true,
        isPhotochromic: false,
        hasUVProtection: true,
        isPolarized: false,
        isMirrored: false,
        costPrice: 1700,
        basePrice: 3500,
        finalPrice: 54900,
        deliveryDays: 3,
        observations: 'Se entrega en 3 días hábiles',
        available: true,
        prescriptionRangeId: range4242.id,
      },
      // ... más productos
    ],
  });

  console.log('Seed completado');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## Próximos Pasos

1. **Revisar y aprobar** esta documentación
2. **Implementar backend** siguiendo el modelo y algoritmo definidos
3. **Cargar datos** desde las tablas Excel al sistema
4. **Implementar frontend** con los componentes React especificados
5. **Testing** y ajustes finales
6. **Despliegue** a producción

---

**Última actualización**: 2025-10-17
**Versión**: 2.0 (actualizada con modelo correcto según tablas reales del negocio)
