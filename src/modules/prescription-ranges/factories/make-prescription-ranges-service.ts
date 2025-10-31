import { PrismaPrescriptionRangesRepository } from '@/modules/prescription-ranges/repositories/prisma.prescription-ranges.repository.ts'
import { PrescriptionRangesService } from '@/modules/prescription-ranges/prescription-ranges.service.ts'

/**
 * Factory function to create a PrescriptionRangesService instance with its dependencies
 * @returns PrescriptionRangesService instance
 */
export function makePrescriptionRangesService(): PrescriptionRangesService {
	const prescriptionRangesRepository = new PrismaPrescriptionRangesRepository()
	const prescriptionRangesService = new PrescriptionRangesService(prescriptionRangesRepository)
	return prescriptionRangesService
}
