# GEMINI.md

This file provides guidance to Gemini when working with code in this repository.

## Project Overview

**optic-management-api** is a TypeScript-based REST API built with:
- **Fastify** for high-performance HTTP server
- **Prisma** with SQLite for database operations
- **Vitest** for unit and E2E testing
- **Zod** for runtime validation and as the single source of truth for types
- **Biome** for linting and formatting

Package manager: **pnpm**

## Essential Commands

### Development
```bash
pnpm start:dev          # Start development server with hot reload
pnpm build              # Build for production
pnpm start              # Run production build
```

### Testing
```bash
pnpm test               # Run unit tests
pnpm test:watch         # Run unit tests in watch mode
pnpm test:e2e           # Run E2E tests with a test database
pnpm test:coverage      # Generate coverage report
```

### Database (Prisma)
```bash
pnpm prisma:migrate     # Create and apply a new migration
pnpm prisma:studio      # Open Prisma Studio GUI
pnpm prisma:generate    # Regenerate Prisma Client
```

### Code Quality
```bash
pnpm lint               # Check code with Biome
pnpm lint:fix           # Auto-fix linting issues
pnpm format             # Format code with Biome
```

## Architecture & Key Lessons Learned

The project follows a modular, scalable architecture with a clear separation of concerns. Understanding these patterns is crucial for making effective changes.

### 1. Zod is the Single Source of Truth for Validation
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

### 2. Separation of Concerns (Handler, Service, Repository)
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

### 3. Dependency Injection via Factory Functions
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

### 4. Focused Testing Strategy
The separation of concerns leads to a simple and effective testing strategy.

- **Unit Tests (`*.service.test.ts`)**:
  - **Goal**: Test the business logic in the service layer in complete isolation.
  - **Mocks**: Use an in-memory repository (`InMemoryUsersRepository`) that implements the same interface as the real one. This makes tests fast and independent of the database.
  - **Focus**: Since input is pre-validated, tests focus on the business logic itself, not on data validation.

- **End-to-End (E2E) Tests (`*.e2e-test.ts`)**:
  - **Goal**: Test the full request-response cycle, from the HTTP route to the database and back.
  - **Method**: Use Fastify's `inject()` method to simulate HTTP requests against the real application stack, but using a separate test database (`.env.test`).

## Development Workflow (TDD)

When adding a new feature or fixing a bug, follow the Test-Driven Development (TDD) cycle:

1.  **Red (Write a Failing Test)**:
    - For a new feature, start with a failing E2E test to define the desired API behavior.
    - For a bug, write a failing unit or E2E test that reproduces the bug.

2.  **Green (Write Minimal Code to Pass)**:
    - Implement the necessary code across the layers (Handler, Service, Repository) to make the test pass.
    - Define Zod schemas first.
    - Implement the repository method.
    - Implement the service logic.
    - Implement the handler.

3.  **Refactor (Improve the Code)**:
    - Clean up the code you've written, ensuring it adheres to the architectural principles outlined here.
    - Make sure all tests (new and existing) continue to pass.