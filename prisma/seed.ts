import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Seed de la base de datos con rangos de prescripción y productos de lentes
 * Basado en las tablas de precios del negocio
 */
async function main() {
	console.log('🌱 Iniciando seed de la base de datos...')

	// 1. Crear rangos de prescripción
	console.log('\n📊 Creando rangos de prescripción...')

	const ranges = [
		{
			code: '42-42',
			description: 'Ambos ojos hasta 4 esf / 2 cyl',
			minEyeMaxSphere: 4.0,
			minEyeMaxCylinder: 2.0,
			maxEyeMaxSphere: 4.0,
			maxEyeMaxCylinder: 2.0,
		},
		{
			code: '42-44',
			description: 'Un ojo hasta 4/2, otro ojo hasta 4/4 (orden independiente)',
			minEyeMaxSphere: 4.0,
			minEyeMaxCylinder: 2.0,
			maxEyeMaxSphere: 4.0,
			maxEyeMaxCylinder: 4.0,
		},
		{
			code: 'ODI-44',
			description: 'Ambos ojos hasta 4 esf / 4 cyl',
			minEyeMaxSphere: 4.0,
			minEyeMaxCylinder: 4.0,
			maxEyeMaxSphere: 4.0,
			maxEyeMaxCylinder: 4.0,
		},
		{
			code: '44-46',
			description: 'Un ojo hasta 4/4, otro ojo hasta 4/6 (orden independiente)',
			minEyeMaxSphere: 4.0,
			minEyeMaxCylinder: 4.0,
			maxEyeMaxSphere: 4.0,
			maxEyeMaxCylinder: 6.0,
		},
		{
			code: 'ODI-46',
			description: 'Ambos ojos hasta 4/6',
			minEyeMaxSphere: 4.0,
			minEyeMaxCylinder: 6.0,
			maxEyeMaxSphere: 4.0,
			maxEyeMaxCylinder: 6.0,
		},
		{
			code: '44-66',
			description: 'Un ojo hasta 4/4, otro ojo hasta 6/6 (orden independiente)',
			minEyeMaxSphere: 4.0,
			minEyeMaxCylinder: 4.0,
			maxEyeMaxSphere: 6.0,
			maxEyeMaxCylinder: 6.0,
		},
		{
			code: 'ODI-62',
			description: 'Ambos ojos hasta 6/2',
			minEyeMaxSphere: 6.0,
			minEyeMaxCylinder: 2.0,
			maxEyeMaxSphere: 6.0,
			maxEyeMaxCylinder: 2.0,
		},
		{
			code: '62-42',
			description: 'Un ojo hasta 6/2, otro ojo hasta 4/2 (orden independiente)',
			minEyeMaxSphere: 4.0,
			minEyeMaxCylinder: 2.0,
			maxEyeMaxSphere: 6.0,
			maxEyeMaxCylinder: 2.0,
		},
		{
			code: 'ODI-66',
			description: 'Ambos ojos hasta 6/6',
			minEyeMaxSphere: 6.0,
			minEyeMaxCylinder: 6.0,
			maxEyeMaxSphere: 6.0,
			maxEyeMaxCylinder: 6.0,
		},
	]

	const createdRanges: Record<string, any> = {}

	for (const rangeData of ranges) {
		const range = await prisma.prescriptionRange.upsert({
			where: { code: rangeData.code },
			update: rangeData,
			create: rangeData,
		})
		createdRanges[range.code] = range
		console.log(`  ✓ ${range.code}: ${range.description}`)
	}

	// 2. Crear productos de lentes de ejemplo
	console.log('\n👓 Creando productos de lentes...')

	// Productos para el rango 42-42 (el más común)
	const products4242 = [
		{
			sku: 'ORG-AR-NORMAL-42-42-CERRADO',
			name: 'ORGANICO ANTIREFLEJO NORMAL',
			material: 'organico' as const,
			tipo: 'monofocal' as const,
			frameType: 'cerrado' as const,
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
		},
		{
			sku: 'ORG-AR-AZUL-42-42-CERRADO',
			name: 'ORGANICO ANTIREFLEJO AZUL',
			material: 'organico' as const,
			tipo: 'monofocal' as const,
			frameType: 'cerrado' as const,
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
		},
		{
			sku: 'ORG-FOTOCROM-GRIS-42-42-CERRADO',
			name: 'ORGANICO FOTOCROMÁTICO GRIS CON UV Y FILTRO AZUL',
			material: 'organico' as const,
			tipo: 'monofocal' as const,
			frameType: 'cerrado' as const,
			hasAntiReflective: false,
			hasBlueFilter: true,
			isPhotochromic: true,
			hasUVProtection: true,
			isPolarized: false,
			isMirrored: false,
			costPrice: 4500,
			basePrice: 7500,
			finalPrice: 84900,
			deliveryDays: 3,
			observations: 'Se entrega en 3 días hábiles. Fotocromático categoría 3',
			available: true,
		},
		{
			sku: 'POLICAR-AR-AZUL-42-42-CERRADO',
			name: 'POLICARBONATO ANTIREFLEJO AZUL',
			material: 'policarbonato' as const,
			tipo: 'monofocal' as const,
			frameType: 'cerrado' as const,
			hasAntiReflective: true,
			hasBlueFilter: true,
			isPhotochromic: false,
			hasUVProtection: true,
			isPolarized: false,
			isMirrored: false,
			costPrice: 2200,
			basePrice: 4500,
			finalPrice: 64900,
			deliveryDays: 3,
			observations: 'Material ultra resistente. Se entrega en 3 días hábiles',
			available: true,
		},
		{
			sku: 'ORG-AR-NORMAL-42-42-SEMICERRADO',
			name: 'ORGANICO ANTIREFLEJO NORMAL',
			material: 'organico' as const,
			tipo: 'monofocal' as const,
			frameType: 'semicerrado' as const,
			hasAntiReflective: true,
			hasBlueFilter: false,
			isPhotochromic: false,
			hasUVProtection: true,
			isPolarized: false,
			isMirrored: false,
			costPrice: 850,
			basePrice: 2200,
			finalPrice: 42900,
			deliveryDays: 4,
			observations: 'Para marcos semicerrados. Se entrega en 4 días hábiles',
			available: true,
		},
	]

	// Productos para el rango ODI-44 (más complejo)
	const productsODI44 = [
		{
			sku: 'ORG-AR-NORMAL-ODI-44-CERRADO',
			name: 'ORGANICO ANTIREFLEJO NORMAL',
			material: 'organico' as const,
			tipo: 'monofocal' as const,
			frameType: 'cerrado' as const,
			hasAntiReflective: true,
			hasBlueFilter: false,
			isPhotochromic: false,
			hasUVProtection: true,
			isPolarized: false,
			isMirrored: false,
			costPrice: 1200,
			basePrice: 2800,
			finalPrice: 49900,
			deliveryDays: 5,
			observations: 'Para recetas más complejas. Se entrega en 5 días hábiles',
			available: true,
		},
		{
			sku: 'ORG-AR-AZUL-ODI-44-CERRADO',
			name: 'ORGANICO ANTIREFLEJO AZUL',
			material: 'organico' as const,
			tipo: 'monofocal' as const,
			frameType: 'cerrado' as const,
			hasAntiReflective: true,
			hasBlueFilter: true,
			isPhotochromic: false,
			hasUVProtection: true,
			isPolarized: false,
			isMirrored: false,
			costPrice: 2000,
			basePrice: 4200,
			finalPrice: 64900,
			deliveryDays: 5,
			observations: 'Para recetas más complejas. Se entrega en 5 días hábiles',
			available: true,
		},
		{
			sku: 'ADELGAZ-AR-AZUL-ODI-44-CERRADO',
			name: 'ADELGAZADO ANTIREFLEJO AZUL',
			material: 'adelgazado' as const,
			tipo: 'monofocal' as const,
			frameType: 'cerrado' as const,
			hasAntiReflective: true,
			hasBlueFilter: true,
			isPhotochromic: false,
			hasUVProtection: true,
			isPolarized: false,
			isMirrored: false,
			costPrice: 3500,
			basePrice: 6000,
			finalPrice: 89900,
			deliveryDays: 7,
			observations: 'Cristal adelgazado, más estético. Se entrega en 7 días hábiles',
			available: true,
		},
	]

	// Productos bifocales para 42-42
	const productsBifocal4242 = [
		{
			sku: 'ORG-BIFOCAL-AR-42-42-CERRADO',
			name: 'ORGANICO BIFOCAL ANTIREFLEJO',
			material: 'organico' as const,
			tipo: 'bifocal' as const,
			frameType: 'cerrado' as const,
			hasAntiReflective: true,
			hasBlueFilter: false,
			isPhotochromic: false,
			hasUVProtection: true,
			isPolarized: false,
			isMirrored: false,
			costPrice: 1500,
			basePrice: 3500,
			finalPrice: 59900,
			deliveryDays: 5,
			observations: 'Bifocal con línea visible. Se entrega en 5 días hábiles',
			available: true,
		},
		{
			sku: 'ORG-MULTIFOCAL-AR-AZUL-42-42-CERRADO',
			name: 'ORGANICO MULTIFOCAL ANTIREFLEJO AZUL',
			material: 'organico' as const,
			tipo: 'multifocal' as const,
			frameType: 'cerrado' as const,
			hasAntiReflective: true,
			hasBlueFilter: true,
			isPhotochromic: false,
			hasUVProtection: true,
			isPolarized: false,
			isMirrored: false,
			costPrice: 5500,
			basePrice: 9500,
			finalPrice: 129900,
			deliveryDays: 7,
			observations: 'Progresivo de última generación. Se entrega en 7 días hábiles',
			available: true,
		},
	]

	// Crear todos los productos
	let productsCount = 0

	for (const product of products4242) {
		await prisma.lensProduct.upsert({
			where: { sku: product.sku },
			update: { ...product, prescriptionRangeId: createdRanges['42-42'].id },
			create: { ...product, prescriptionRangeId: createdRanges['42-42'].id },
		})
		productsCount++
	}
	console.log(`  ✓ ${products4242.length} productos para rango 42-42`)

	for (const product of productsODI44) {
		await prisma.lensProduct.upsert({
			where: { sku: product.sku },
			update: { ...product, prescriptionRangeId: createdRanges['ODI-44'].id },
			create: { ...product, prescriptionRangeId: createdRanges['ODI-44'].id },
		})
		productsCount++
	}
	console.log(`  ✓ ${productsODI44.length} productos para rango ODI-44`)

	for (const product of productsBifocal4242) {
		await prisma.lensProduct.upsert({
			where: { sku: product.sku },
			update: { ...product, prescriptionRangeId: createdRanges['42-42'].id },
			create: { ...product, prescriptionRangeId: createdRanges['42-42'].id },
		})
		productsCount++
	}
	console.log(`  ✓ ${productsBifocal4242.length} productos bifocales/multifocales para rango 42-42`)

	console.log(`\n✅ Seed completado exitosamente!`)
	console.log(`   📊 ${ranges.length} rangos de prescripción creados`)
	console.log(`   👓 ${productsCount} productos de lentes creados`)
	console.log(`\n💡 Ahora puedes probar la API de cotización con estos datos de ejemplo`)
}

main()
	.then(async () => {
		await prisma.$disconnect()
	})
	.catch(async (e) => {
		console.error('❌ Error durante el seed:', e)
		await prisma.$disconnect()
		process.exit(1)
	})
