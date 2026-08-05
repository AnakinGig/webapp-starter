import { relations, sql } from "drizzle-orm";
import { index, mysqlTable } from "drizzle-orm/mysql-core";

/**
 * Multi-project schema prefix helper
 */

// Posts example table
export const posts = mysqlTable(
  "post",
  (d) => ({
    id: d.int().autoincrement().primaryKey(),
    name: d.varchar({ length: 256 }),
    createdById: d.varchar({ length: 255 }).notNull(),
    createdAt: d.timestamp().default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: d.timestamp().$onUpdate(() => new Date()),
  }),
  (t) => [
    index("created_by_idx").on(t.createdById),
    index("name_idx").on(t.name),
  ]
);

// Better Auth core tables
export const user = mysqlTable(
  "user",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: d.varchar({ length: 255 }),
    email: d.varchar({ length: 255 }).notNull(),
    emailVerified: d.boolean().default(false),
    role: d.varchar({ length: 50 }).notNull().default("user"),
    image: d.varchar({ length: 255 }),
    createdAt: d.timestamp().default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: d.timestamp().$onUpdate(() => new Date()),
  }),
  (t) => [index("user_email_idx").on(t.email)]
);

export const userRelations = relations(user, ({ many }) => ({
  account: many(account),
  session: many(session),
}));

export const account = mysqlTable(
  "account",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: d.varchar({ length: 255 }).notNull(),
    accountId: d.varchar({ length: 255 }).notNull(),
    providerId: d.varchar({ length: 255 }).notNull(),
    accessToken: d.text(),
    refreshToken: d.text(),
    accessTokenExpiresAt: d.timestamp(),
    refreshTokenExpiresAt: d.timestamp(),
    scope: d.varchar({ length: 255 }),
    idToken: d.text(),
    password: d.text(),
    createdAt: d.timestamp().default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: d.timestamp().$onUpdate(() => new Date()),
  }),
  (t) => [index("account_user_id_idx").on(t.userId)]
);

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const session = mysqlTable(
  "session",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: d.varchar({ length: 255 }).notNull(),
    token: d.varchar({ length: 255 }).notNull(),
    expiresAt: d.timestamp().notNull(),
    ipAddress: d.varchar({ length: 255 }),
    userAgent: d.varchar({ length: 255 }),
    createdAt: d.timestamp().default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: d.timestamp().$onUpdate(() => new Date()),
  }),
  (t) => [
    index("session_user_id_idx").on(t.userId),
    index("session_token_idx").on(t.token),
  ]
);

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const verification = mysqlTable(
  "verification",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    identifier: d.varchar({ length: 255 }).notNull(),
    value: d.varchar({ length: 255 }).notNull(),
    expiresAt: d.timestamp().notNull(),
    createdAt: d.timestamp().default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: d.timestamp().$onUpdate(() => new Date()),
  }),
  (t) => [index("verification_identifier_idx").on(t.identifier)]
);
