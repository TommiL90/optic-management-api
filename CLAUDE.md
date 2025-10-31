# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**optic-management-api** is a TypeScript-based REST API built with:
- **Fastify** 5.x for high-performance HTTP server
- **Prisma** 6.x with SQLite for database operations
- **Vitest** 3.x for unit and E2E testing
- **Zod** for runtime validation
- **Biome** for linting and formatting

Package manager: **pnpm 10.18.0** (Node.js >=22.0.0)

## Essential Commands

### Development
```bash
pnpm start:dev          # Start development server with hot reload
pnpm build              # Build for production (tsup → build/server.cjs)
pnpm start              # Run production build
```

### Testing
```bash
pnpm test               # Run unit tests (*.test.ts)
pnpm test:watch         # Run unit tests in watch mode
pnpm test:e2e           # Run E2E tests (*.e2e-test.ts) with test database
pnpm test:e2e:watch     # Run E2E tests in watch mode
pnpm test:coverage      # Generate coverage report
pnpm test:ui            # Open Vitest UI
```

### Database (Prisma)
```bash
pnpm prisma:migrate     # Create and apply migration
pnpm prisma:studio      # Open Prisma Studio GUI
pnpm prisma:generate    # Regenerate Prisma Client
```

### Code Quality
```bash
pnpm lint               # Check code with Biome
pnpm lint:fix           # Auto-fix linting issues
pnpm format             # Format code with Biome
```

## Architecture

### Directory Structure

```
src/
├── config/              # Configuration (env validation with Zod)
├── core/                # Shared utilities
│   ├── plugins/         # Fastify plugins (prisma, logger, swagger)
│   ├── database/        # Database client configuration
│   ├── errors/          # Global error handlers
│   └── utils/           # Utility functions
├── modules/             # Domain modules (e.g., users, health)
│   └── {module}/
│       ├── __tests__/                    # Module tests
│       │   ├── {module}.service.test.ts  # Unit tests
│       │   ├── {module}.routes.e2e-test.ts # E2E tests
│       │   └── repositories/             # Repository tests
│       ├── schemas/                      # Zod schemas and inferred types
│       │   └── {module}.schemas.ts       # Single source of truth for types
│       ├── repositories/                 # Repository Pattern
│       │   ├── {module}.repository.interface.ts
│       │   └── prisma.{module}.repository.ts
│       ├── factories/                    # Factory functions
│       │   └── make-{module}-service.ts  # Dependency creation
│       ├── {module}.plugin.ts            # Module entry point
│       ├── {module}.routes.ts            # Route definitions
│       ├── {module}.handlers.ts          # Route handlers
│       └── {module}.service.ts           # Business logic
└── server.ts            # Application entry point

prisma/
├── schema.prisma                     # Prisma schema
├── migrations/                       # Database migrations
└── vitest-environment-prisma/        # Custom Vitest environment for E2E tests
```

### Key Architectural Patterns & Lessons Learned

The project follows a modular, scalable architecture with a clear separation of concerns. Understanding these patterns is crucial for making effective changes.

#### 1. Zod is the Single Source of Truth for Validation
All data validation and type generation are handled by Zod. This is a core principle.

- **Robust Validation**: Instead of manual checks, we use Zod's powerful schema features. This is more declarative, less error-prone, and ensures type safety.
  ```typescript
  // Example: Robust, type-safe pagination query validation
  export const getUsersSchema = {
    querystring: z.object({
      page: z.coerce.number().min(1).default(1),
      pageSize: z.coerce.number().min(1).max(100).default(10), // .max() prevents DoS
    }),
  };
  ```
- **Type Inference**: All TypeScript types for request bodies, params, and responses are inferred from Zod schemas using `z.infer`. **Do not** create manual `interface` or `type` definitions for data structures that can be described by a schema.
- **Error Handling**: Use `.catch()` for handling validation errors on specific fields, and `.default()` to provide fallback values for optional fields.

#### 2. Separation of Concerns (Handler, Service, Repository)
The logic is split into three distinct layers. When adding a feature, you will touch files in each of these layers.

- **Handlers (`*.handlers.ts`)**:
  - **Responsibility**: The HTTP layer. It parses request data (body, params, query) and calls the service. It knows nothing about business logic or the database.
  - It is the boundary where Zod schemas are applied for incoming requests.

- **Services (`*.service.ts`)**:
  - **Responsibility**: The business logic layer. It orchestrates operations, contains the core logic, and decides when to fetch or save data.
  - **Assumes valid data**: Because the handler (via Fastify and Zod) has already validated the input, the service layer does not need to perform validation checks. This makes the business logic and its tests much cleaner.
  - It depends on a repository *interface*, not a concrete implementation.

- **Repositories (`*.repository.interface.ts` & `prisma.*.repository.ts`)**:
  - **Responsibility**: The data access layer. It contains all the code that interacts with the database (Prisma).
  - It implements an interface (`IUserRepository`) that the service depends on. This allows us to swap the database implementation or use in-memory mocks for testing.

#### 3. Dependency Injection via Factory Functions
To decouple the layers, we use factory functions to create instances and inject dependencies.

- **Location**: `factories/make-{module}-service.ts`
- **Function**: A factory creates a service instance and provides it with its required dependencies (e.g., a `PrismaUserRepository`).
  ```typescript
  // factories/make-user-service.ts
  export function makeUserService() {
    const usersRepository = new PrismaUserRepository();
    const userService = new UserService(usersRepository);
    return userService;
  }
  ```
- **Usage**: Handlers use the factory to get a service instance without needing to know how it's constructed.
  ```typescript
  // users.handlers.ts
  export async function createUserHandler(req: FastifyRequest, reply: FastifyReply) {
    const userService = makeUserService(); // Get a service instance
    const user = await userService.create(req.body);
    return reply.status(201).send(user);
  }
  ```

#### 4. Focused Testing Strategy (TDD)
The separation of concerns leads to a simple and effective testing strategy.

- **Unit Tests (`*.service.test.ts`)**:
  - **Goal**: Test the business logic in the service layer in complete isolation.
  - **Mocks**: Use an in-memory repository (`InMemoryUsersRepository`) that implements the same interface as the real one. This makes tests fast and independent of the database.
  - **Focus**: Since input is pre-validated, tests focus on the business logic itself, not on data validation.

- **End-to-End (E2E) Tests (`*.e2e-test.ts`)**:
  - **Goal**: Test the full request-response cycle, from the HTTP route to the database and back.
  - **Method**: Use Fastify's `inject()` method to simulate HTTP requests against the real application stack, but using a separate test database (`.env.test`).

## Critical Development Notes

### Path Aliases
The project uses `@/*` aliases for cleaner imports:
```typescript
import { env } from '@/config/env.ts';
import { UserService } from '@/core/services/user.service.ts';
```
Configured in `tsconfig.json` (baseUrl: "./src", paths: {"@/*": ["./*"]})

### Environment Files
- `.env` - Development environment
- `.env.test` - Test environment (used by E2E tests)
- `.env.example` - Template

Required variables: `NODE_ENV`, `PORT`, `HOST`, `LOG_LEVEL`, `DATABASE_URL`

### Type Safety
- **Never use `any`** - define proper types
- **Export one item per file** - classes, functions, or types
- **Use Prisma-generated types** from `@/generated/prisma/`
- **JSDoc for public APIs** - classes and methods

### Naming Conventions
- Files/directories: `kebab-case`
- Classes: `PascalCase`
- Variables/functions: `camelCase`
- Booleans: verb prefix (`isLoading`, `hasError`, `canDelete`)
- Functions: verb + noun (`findUserById`, `createUser`)

### Code Quality Standards
- Functions < 20 lines
- Classes < 200 lines, < 10 public methods
- No blank lines within functions
- Early returns over nesting
- SOLID principles

### Database Workflow
1. Modify `prisma/schema.prisma`
2. Run `pnpm prisma:migrate` (creates migration + regenerates client)
3. Use generated types from `@/generated/prisma/`

### Adding New Features (TDD)
1. **Red**: Write failing test (unit or E2E)
2. **Green**: Implement minimum code to pass
3. **Refactor**: Improve code while tests stay green
4. Update schemas/types as needed
5. Ensure linting passes (`pnpm lint:fix`)

### Swagger/OpenAPI
API documentation auto-generated at `/docs` (development only)
Uses schemas defined in `{module}.schemas.ts`
