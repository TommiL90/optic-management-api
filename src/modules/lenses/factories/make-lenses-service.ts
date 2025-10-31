import { PrismaLensesRepository } from '@/modules/lenses/repositories/prisma.lenses.repository.ts'
import { LensesService } from '@/modules/lenses/lenses.service.ts'

/**
 * Factory function to create LensesService with its dependencies
 *
 * This factory encapsulates the creation of LensesService and its dependencies,
 * making it easier to test and maintain. It follows the Factory Function pattern
 * which provides better testability and loose coupling.
 *
 * @returns LensesService instance configured with PrismaLensesRepository
 *
 * @example
 * ```typescript
 * // In handler
 * const lensesService = makeLensesService();
 * const quote = await lensesService.quoteLenses(request);
 * ```
 *
 * @example
 * ```typescript
 * // In tests - easy to mock
 * vi.spyOn(makeLensesServiceModule, 'makeLensesService').mockReturnValue(mockService);
 * ```
 */
export function makeLensesService(): LensesService {
	const lensesRepository = new PrismaLensesRepository()
	const lensesService = new LensesService(lensesRepository)
	return lensesService
}
