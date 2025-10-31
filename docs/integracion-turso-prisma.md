# Prisma + Turso

> Configure Prisma to work with your Turso database

<img src="https://mintcdn.com/turso/7mjM7fXIfeZ8ZwNC/images/guides/prisma-banner.png?fit=max&auto=format&n=7mjM7fXIfeZ8ZwNC&q=85&s=ce5d303037fe9f45a7918d238def83f4" alt="Prisma banner" data-og-width="1133" width="1133" data-og-height="595" height="595" data-path="images/guides/prisma-banner.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/turso/7mjM7fXIfeZ8ZwNC/images/guides/prisma-banner.png?w=280&fit=max&auto=format&n=7mjM7fXIfeZ8ZwNC&q=85&s=315f2189b2bfa2c923dfcbae4d437975 280w, https://mintcdn.com/turso/7mjM7fXIfeZ8ZwNC/images/guides/prisma-banner.png?w=560&fit=max&auto=format&n=7mjM7fXIfeZ8ZwNC&q=85&s=2a348894cff62936b74e7616376e9ebb 560w, https://mintcdn.com/turso/7mjM7fXIfeZ8ZwNC/images/guides/prisma-banner.png?w=840&fit=max&auto=format&n=7mjM7fXIfeZ8ZwNC&q=85&s=ef17ceb704249fa97a65ab4bfb137e02 840w, https://mintcdn.com/turso/7mjM7fXIfeZ8ZwNC/images/guides/prisma-banner.png?w=1100&fit=max&auto=format&n=7mjM7fXIfeZ8ZwNC&q=85&s=f5db712d781e3ede9168634f133bf954 1100w, https://mintcdn.com/turso/7mjM7fXIfeZ8ZwNC/images/guides/prisma-banner.png?w=1650&fit=max&auto=format&n=7mjM7fXIfeZ8ZwNC&q=85&s=91978e4b6add028766a8c3526551210c 1650w, https://mintcdn.com/turso/7mjM7fXIfeZ8ZwNC/images/guides/prisma-banner.png?w=2500&fit=max&auto=format&n=7mjM7fXIfeZ8ZwNC&q=85&s=4c5601571f1d730e298699fc26486063 2500w" />

## Prerequisites

Before you start, make sure you:

* [Install the Turso CLI](/cli/installation)
* [Sign up or login to Turso](/cli/authentication#signup)
* Prisma versions 5.4.2 and later

<Steps>
  <Step title="Install the libSQL SDK and its Prisma driver">
    <CodeGroup>
      ```bash npm theme={null}
      npm install @libsql/client @prisma/adapter-libsql
      ```

      ```bash pnpm theme={null}
      pnpm add @libsql/client @prisma/adapter-libsql
      ```

      ```bash yarn theme={null}
      yarn add @libsql/client @prisma/adapter-libsql
      ```
    </CodeGroup>
  </Step>

  <Step title="Retrieve database credentials">
    <Snippet file="retrieve-database-credentials.mdx" />
  </Step>

  <Step title="Enable the `driverAdapters` preview feature flag:">
    ```js prisma/schema.prisma theme={null}
    generator client {
      provider        = "prisma-client-js"
      previewFeatures = ["driverAdapters"]
    }

    datasource db {
      provider = "sqlite"
      url      = "file:./dev.db"
    }
    ```
  </Step>

  <Step title="Generate Prisma client">
    <CodeGroup>
      ```sh npm theme={null}
      npx prisma generate
      ```

      ```sh pnpm theme={null}
      pnpm dlx prisma generate
      ```
    </CodeGroup>
  </Step>

  <Step title="Update your Prisma Client Instance">
    <CodeGroup>
      ```ts Node.js / Serverless theme={null}
      import { PrismaClient } from "@prisma/client";
      import { PrismaLibSQL } from "@prisma/adapter-libsql";

      const adapter = new PrismaLibSQL({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      })
      const prisma = new PrismaClient({ adapter })
      ```

      ```ts Edge Runtimes theme={null}
      import { PrismaClient } from "@prisma/client";
      import { PrismaLibSQL } from "@prisma/adapter-libsql";

      const adapter = new PrismaLibSQL({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      })
      const prisma = new PrismaClient({ adapter })
      ```
    </CodeGroup>
  </Step>

  <Step title="Database Migrations">
    Prisma Migrate and Introspection workflows are currently not supported when working with Turso — [learn more](https://www.prisma.io/docs/orm/overview/databases/turso#how-to-manage-schema-changes).

    First, generate a migration file using prisma migrate dev against a local SQLite database

    <CodeGroup>
      ```sh npm theme={null}
      npx prisma migrate dev --name init
      ```

      ```sh pnpm theme={null}
      pnpm dlx prisma migrate dev --name init
      ```
    </CodeGroup>

    Then, apply the migration to your Turso database using the Turso's CLI

    ```bash  theme={null}
    turso db shell turso-prisma-db < ./prisma/migrations/20230922132717_init/migration.sql
    ```

    <Info>
      Replace `20230922132717_init` with the name of your migration created from the `npx prisma migrate dev` command.
    </Info>
  </Step>

  <Step title="Query">
    ```ts  theme={null}
    const response = await prisma.table_name.findMany();
    ```
  </Step>
</Steps>