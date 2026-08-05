import { drizzle } from "drizzle-orm/mysql2";
import { createPool, type Pool } from "mysql2/promise";

import { env } from "~/env";
import * as schema from "./schema";

/**
 * Cache the database connection pool in development. This avoids creating a new pool on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
};

export const pool =
  globalForDb.pool ??
  createPool({
    host: env.SINGLESTORE_HOST,
    port: env.SINGLESTORE_PORT,
    user: env.SINGLESTORE_USER,
    password: env.SINGLESTORE_PASSWORD,
    database: env.SINGLESTORE_DATABASE,
    ssl: env.SINGLESTORE_SSL === "true" ? {} : undefined,
    connectionLimit: 10,
    maxIdle: 10,
    enableKeepAlive: true,
    waitForConnections: true,
  });
if (env.NODE_ENV !== "production") globalForDb.pool = pool;

export const db = drizzle(pool, { schema, mode: "default" });
