import { type Config } from "drizzle-kit";

import { env } from "~/env";

export default {
  schema: "./src/server/db/schema.ts",
  dialect: "mysql",
  dbCredentials: {
    host: env.SINGLESTORE_HOST,
    port: env.SINGLESTORE_PORT,
    user: env.SINGLESTORE_USER,
    password: env.SINGLESTORE_PASSWORD,
    database: env.SINGLESTORE_DATABASE,
    ssl: env.SINGLESTORE_SSL === "true" ? {} : undefined,
  },
  tablesFilter: [
    "webapp-starter_*",
    "post",
    "user",
    "account",
    "session",
    "verification",
  ],
} satisfies Config;
