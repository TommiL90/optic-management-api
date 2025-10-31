import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'

/**
 * Crea un payload válido para crear un producto de lentes
 */
export function createLensProductPayload(sku: string, prescriptionRangeId?: string) {
  return {
    sku,
    name: `Test Product ${sku}`,
    material: 'organico' as const,
    tipo: 'monofocal' as const,
    frameType: 'cerrado' as const,
    hasAntiReflective: true,
    hasBlueFilter: true,
    isPhotochromic: false,
    hasUVProtection: true,
    isPolarized: false,
    isMirrored: false,
    basePrice: 100,
    finalPrice: 200,
    deliveryDays: 5,
    observations: `Test observations for ${sku}`,
    available: true,
    prescriptionRangeId: prescriptionRangeId || '550e8400-e29b-41d4-a716-446655440000',
  }
}

/**
 * Crea un rango de prescripción para tests
 */
export async function createPrescriptionRange(app: FastifyInstance, rangeData: {
  code: string
  description: string
  minEyeMaxSphere: number
  minEyeMaxCylinder: number
  maxEyeMaxSphere: number
  maxEyeMaxCylinder: number
}) {
  // Nota: En un entorno real, esto crearía un rango en la base de datos
  // Para tests E2E, asumimos que los rangos ya existen o se crean en setup
  return {
    id: `range-${rangeData.code}`,
    ...rangeData,
  }
}

/**
 * Crea una prescripción válida para tests
 */
export function createValidPrescription() {
  return {
    od: { sphere: -3.75, cylinder: -1.50 },
    oi: { sphere: -4.00, cylinder: -2.00 },
  }
}

/**
 * Crea filtros válidos para cotización
 */
export function createValidFilters() {
  return {
    frameType: 'cerrado' as const,
    material: 'organico' as const,
    features: {
      hasBlueFilter: true,
    },
  }
}

/**
 * Crea un producto de lentes completo para tests
 */
export function createCompleteLensProduct(sku: string, prescriptionRangeId: string) {
  return {
    sku,
    name: `Complete Test Product ${sku}`,
    material: 'organico' as const,
    tipo: 'monofocal' as const,
    frameType: 'cerrado' as const,
    hasAntiReflective: true,
    hasBlueFilter: true,
    isPhotochromic: false,
    hasUVProtection: true,
    isPolarized: false,
    isMirrored: false,
    basePrice: 150,
    finalPrice: 300,
    deliveryDays: 7,
    observations: `Complete test observations for ${sku}`,
    available: true,
    prescriptionRangeId,
  }
}

/**
 * Crea múltiples productos para tests de listado
 */
export function createMultipleProducts() {
  return [
    createLensProductPayload('SKU-MULTI-1'),
    createLensProductPayload('SKU-MULTI-2'),
    createLensProductPayload('SKU-MULTI-3'),
  ]
}

/**
 * Crea una prescripción que requiere normalización
 */
export function createPrescriptionForNormalization() {
  return {
    od: { sphere: -3.76, cylinder: -1.49 }, // Requiere normalización
    oi: { sphere: -4.01, cylinder: -2.01 }, // Requiere normalización
  }
}

/**
 * Crea una prescripción fuera de rango
 */
export function createOutOfRangePrescription() {
  return {
    od: { sphere: -10.00, cylinder: -5.00 }, // Fuera de cualquier rango
    oi: { sphere: -10.00, cylinder: -5.00 },
  }
}

/**
 * Setup para tests E2E - crea rangos de prescripción necesarios
 */
export async function setupTestDatabase() {
  const prisma = new PrismaClient()
  
  try {
    // Crear rangos de prescripción de prueba
    const testRanges = [
      {
        code: '42-42',
        description: 'Ambos ojos hasta 4 esf / 2 cyl',
        minEyeMaxSphere: 4.00,
        minEyeMaxCylinder: 2.00,
        maxEyeMaxSphere: 4.00,
        maxEyeMaxCylinder: 2.00,
      },
      {
        code: '44-44',
        description: 'Ambos ojos hasta 4 esf / 4 cyl',
        minEyeMaxSphere: 4.00,
        minEyeMaxCylinder: 4.00,
        maxEyeMaxSphere: 4.00,
        maxEyeMaxCylinder: 4.00,
      },
    ]

    const createdRanges = []
    for (const range of testRanges) {
      const existing = await prisma.prescriptionRange.findUnique({
        where: { code: range.code }
      })
      
      if (!existing) {
        const created = await prisma.prescriptionRange.create({
          data: range
        })
        createdRanges.push(created)
      } else {
        createdRanges.push(existing)
      }
    }

    return createdRanges
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Limpia la base de datos de test
 */
export async function cleanupTestDatabase() {
  const prisma = new PrismaClient()
  
  try {
    // Eliminar productos de lentes
    await prisma.lensProduct.deleteMany()
    
    // Eliminar rangos de prescripción de test
    await prisma.prescriptionRange.deleteMany({
      where: {
        code: {
          in: ['42-42', '44-44']
        }
      }
    })
  } finally {
    await prisma.$disconnect()
  }
}
