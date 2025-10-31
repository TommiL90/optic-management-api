import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { unlinkSync } from 'node:fs';

/**
 * Custom Vitest environment for Prisma SQLite testing
 * Creates a unique database file for each test suite and cleans up after
 */
export default {
  name: 'prisma',
  transformMode: 'ssr',
  async setup() {
    // Generate a unique database name for this test suite
    const schema = randomUUID();
    const databaseUrl = `file:/tmp/test-${schema}.db`;

    // Set the DATABASE_URL environment variable for this test
    process.env.DATABASE_URL = databaseUrl;

    // Run Prisma migrations to set up the test database
    execSync('npx prisma migrate deploy', {
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
      },
    });

    return {
      async teardown() {
        // Remove the SQLite database file
        try {
          const dbPath = `/tmp/test-${schema}.db`;
          unlinkSync(dbPath);

          // Also remove journal files if they exist
          try {
            unlinkSync(`${dbPath}-journal`);
          } catch {
            // Journal file might not exist, ignore
          }
        } catch (error) {
          console.error('Failed to clean up test database:', error);
        }
      },
    };
  },
};
