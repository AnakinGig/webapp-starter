import { ConvexError, v } from "convex/values";
import { verifyPassword } from "better-auth/crypto";

import { authComponent } from "./auth";
import { components } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";

/**
 * User management, ported from the old tRPC router to Convex.
 *
 * Authorization model:
 * - Admin functions (`getMany`, `getStats`, `create`, `update`, `remove`)
 *   require the caller's session user to have `role: "admin"`.
 * - Self-service functions (`deleteAccount`, `exportData`) always use the
 *   session user's id - never client input.
 * - Auth tables (user/session/account/verification) live inside the
 *   betterAuth component and are only reachable through the component's
 *   adapter, always behind the checks above.
 *
 * NOTE on scaling: the admin list/stats page through every user row (capped
 * at 1000). That is fine for a starter workspace; add a dedicated search
 * index or switch to cursor pagination when the user count grows.
 */

type UserDoc = {
  _id: string;
  _creationTime: number;
  name?: string | null;
  email: string;
  emailVerified?: boolean;
  image?: string | null;
  role?: string | null;
  createdAt: number;
  updatedAt: number;
};

const PAGE_SIZE = 10;

/**
 * Dev-grade in-memory throttle for failed delete-account password attempts
 * (5 strikes, then a 60s lockout). better-auth's own verify-password route
 * is rate-limited; this direct verification path needs its own guard.
 * Single-instance only - swap for a distributed limiter (e.g.
 * convex-helpers rateLimiter) when the app scales beyond one process.
 */
const passwordAttempts = new Map<
  string,
  { count: number; lockedUntil: number }
>();

/** Client-facing user shape (same as the old DashboardUser type). */
function toClientUser(doc: UserDoc) {
  return {
    id: doc._id,
    name: doc.name ?? null,
    email: doc.email,
    role: doc.role ?? "user",
    emailVerified: doc.emailVerified === true,
    image: doc.image ?? null,
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

type Ctx = QueryCtx | MutationCtx;

/** Current session user (from the better-auth JWT), or null when logged out. */
export async function getAuthUser(ctx: Ctx): Promise<UserDoc | null> {
  const raw: unknown = await authComponent.safeGetAuthUser(ctx);
  return raw as UserDoc | null;
}

/** Require an admin session - throws otherwise. */
async function requireAdmin(ctx: Ctx): Promise<UserDoc> {
  const user = await getAuthUser(ctx);
  if (!user) throw new ConvexError("Unauthenticated.");
  if (user.role !== "admin") {
    throw new ConvexError("Admin access required.");
  }
  return user;
}

type PageResult = {
  page: unknown[];
  isDone: boolean;
  continueCursor: string | null;
};

/** Page through every user in the component (capped at 1000 rows). */
async function fetchAllUsers(ctx: Ctx): Promise<UserDoc[]> {
  const users: UserDoc[] = [];
  let cursor: string | null = null;
  for (let i = 0; i < 10; i++) {
    const result = (await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: "user",
      paginationOpts: { numItems: 200, cursor },
    })) as PageResult;
    users.push(...(result.page as unknown as UserDoc[]));
    if (result.isDone) break;
    cursor = result.continueCursor;
  }
  return users;
}

/** Read a single user by id from the component's user table. */
async function findUserById(ctx: Ctx, id: string): Promise<UserDoc | null> {
  const raw: unknown = await ctx.runQuery(
    components.betterAuth.adapter.findOne,
    {
      model: "user",
      where: [{ field: "_id", value: id }],
    },
  );
  return raw as UserDoc | null;
}

/** Read a single user by email from the component's user table. */
async function findUserByEmail(
  ctx: Ctx,
  email: string,
): Promise<UserDoc | null> {
  const raw: unknown = await ctx.runQuery(
    components.betterAuth.adapter.findOne,
    {
      model: "user",
      where: [{ field: "email", operator: "eq", value: email }],
    },
  );
  return raw as UserDoc | null;
}

/** Shared cascade delete: sessions, accounts, then the user row. */
async function deleteUserRows(ctx: MutationCtx, userId: string) {
  // Auth component rows. No FK cascades in Convex - clean up explicitly.
  // `paginationOpts` is required by the component's adapter signature.
  await ctx.runMutation(components.betterAuth.adapter.deleteMany, {
    input: {
      model: "session",
      where: [{ field: "userId", value: userId }],
    },
    paginationOpts: { numItems: 200, cursor: null },
  });
  await ctx.runMutation(components.betterAuth.adapter.deleteMany, {
    input: {
      model: "account",
      where: [{ field: "userId", value: userId }],
    },
    paginationOpts: { numItems: 200, cursor: null },
  });
  await ctx.runMutation(components.betterAuth.adapter.deleteMany, {
    input: {
      model: "user",
      where: [{ field: "_id", value: userId }],
    },
    paginationOpts: { numItems: 200, cursor: null },
  });
}

/** The current user - used by server components (e.g. the dashboard guard). */
export const getCurrentUser = query({
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);
    return user ? toClientUser(user) : null;
  },
});

/** Workspace-wide aggregates for the dashboard stat cards. Admin only. */
export const getStats = query({
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const users = await fetchAllUsers(ctx);
    return {
      total: users.length,
      admins: users.filter((u) => u.role === "admin").length,
      verified: users.filter((u) => u.emailVerified === true).length,
    };
  },
});

/** List users with optional search + pagination. Admin only. */
export const getMany = query({
  args: {
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
    query: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const page = Math.max(1, args.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, args.pageSize ?? PAGE_SIZE));
    const rawQuery = args.query?.trim().toLowerCase();

    const all = await fetchAllUsers(ctx);
    const filtered = rawQuery
      ? all.filter(
          (u) =>
            u.email.toLowerCase().includes(rawQuery) ||
            (u.name ?? "").toLowerCase().includes(rawQuery),
        )
      : all;

    // Admins first, then users in creation order (oldest first).
    const sorted = [...filtered].sort((a, b) => {
      const aAdmin = a.role === "admin" ? 0 : 1;
      const bAdmin = b.role === "admin" ? 0 : 1;
      if (aAdmin !== bAdmin) return aAdmin - bAdmin;
      if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
      return a._id.localeCompare(b._id);
    });

    const total = sorted.length;
    const offset = (page - 1) * pageSize;
    const data = sorted.slice(offset, offset + pageSize).map(toClientUser);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },
});

/** Create a user record. Admin only. The very first user becomes admin. */
export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("user")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const email = args.email.trim().toLowerCase();
    const name = args.name.trim();
    if (!name) throw new ConvexError("Name is required.");
    if (!email.includes("@")) {
      throw new ConvexError("Enter a valid email address.");
    }

    const existing = await findUserByEmail(ctx, email);
    if (existing) {
      throw new ConvexError("A user with this email already exists.");
    }

    const now = Date.now();
    await ctx.runMutation(components.betterAuth.adapter.create, {
      input: {
        model: "user",
        data: {
          name,
          email,
          emailVerified: false,
          role: args.role,
          createdAt: now,
          updatedAt: now,
        },
      },
    });
  },
});

/** Update a user record (name / email / role / verification). Admin only. */
export const update = mutation({
  args: {
    id: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("user"))),
    emailVerified: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const { id, ...updates } = args;
    const changes: Record<string, unknown> = { ...updates };

    if (Object.keys(changes).length === 0) return;

    const target = await findUserById(ctx, id);
    if (!target) throw new ConvexError("User not found.");

    // Email must stay unique (excluding the user being edited).
    if (typeof changes.email === "string") {
      const email = changes.email.trim().toLowerCase();
      changes.email = email;
      if (email !== target.email) {
        const dup = await findUserByEmail(ctx, email);
        if (dup && dup._id !== id) {
          throw new ConvexError("A user with this email already exists.");
        }
      }
    }
    if (typeof changes.name === "string") {
      const name = changes.name.trim();
      if (!name) throw new ConvexError("Name is required.");
      changes.name = name;
    }

    // Guard rail: you cannot change your own role.
    if (changes.role && changes.role !== target.role && id === admin._id) {
      throw new ConvexError("You cannot change your own role.");
    }

    // Guard rail: cannot demote the last admin.
    if (changes.role === "user" && target.role === "admin") {
      const adminCount = (await fetchAllUsers(ctx)).filter(
        (u) => u.role === "admin",
      ).length;
      if (adminCount <= 1) {
        throw new ConvexError("Cannot demote the last admin.");
      }
    }

    await ctx.runMutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: "user",
        where: [{ field: "_id", value: id }],
        update: { ...changes, updatedAt: Date.now() },
      },
    });
  },
});

/** Delete a user and their sessions/accounts. Admin only. */
export const remove = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    // Guard rail: you cannot delete your own account (use Settings instead).
    if (args.id === admin._id) {
      throw new ConvexError("You cannot delete your own account.");
    }

    const target = await findUserById(ctx, args.id);
    if (!target) throw new ConvexError("User not found.");

    // Guard rail: cannot delete the last admin.
    if (target.role === "admin") {
      const adminCount = (await fetchAllUsers(ctx)).filter(
        (u) => u.role === "admin",
      ).length;
      if (adminCount <= 1) {
        throw new ConvexError("Cannot delete the last admin.");
      }
    }

    await deleteUserRows(ctx, args.id);
  },
});

/**
 * Self-service account deletion (Settings danger zone). The id always comes
 * from the session - never from client input. Users with an email/password
 * account must confirm their password: the session alone is not enough for
 * an irreversible action, so the hash is verified server-side (never trust
 * a client-side check for this).
 */
export const deleteAccount = mutation({
  args: {
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user) throw new ConvexError("Unauthenticated.");

    // If this user has a credential (email/password) account, require the
    // password to confirm. OAuth-only accounts have no password to verify.
    // Look the account up by userId (single-condition filter, same as
    // exportData/deleteUserRows) and check providerId in code, so a filter
    // quirk can never silently skip the verification.
    const accountRows = (await ctx.runQuery(
      components.betterAuth.adapter.findMany,
      {
        model: "account",
        where: [{ field: "userId", value: user._id }],
        paginationOpts: { numItems: 200, cursor: null },
      },
    )) as PageResult;
    const credentialAccount = (
      accountRows.page as Array<{
        providerId?: string;
        password?: string | null;
      }>
    ).find((a) => a.providerId === "credential");

    if (credentialAccount?.password) {
      if (!args.password) {
        throw new ConvexError("Enter your password to confirm.");
      }

      const bucket = passwordAttempts.get(user._id);
      if (bucket && bucket.lockedUntil > Date.now()) {
        throw new ConvexError("Too many attempts. Try again in a minute.");
      }

      const valid = await verifyPassword({
        hash: credentialAccount.password,
        password: args.password,
      });
      if (!valid) {
        const attempt = bucket ?? { count: 0, lockedUntil: 0 };
        attempt.count += 1;
        if (attempt.count >= 5) {
          attempt.count = 0;
          attempt.lockedUntil = Date.now() + 60_000;
        }
        passwordAttempts.set(user._id, attempt);
        throw new ConvexError("Incorrect password.");
      }
      passwordAttempts.delete(user._id);
    }

    // Guard: the last admin cannot delete their account.
    if (user.role === "admin") {
      const adminCount = (await fetchAllUsers(ctx)).filter(
        (u) => u.role === "admin",
      ).length;
      if (adminCount <= 1) {
        throw new ConvexError(
          "You are the last admin and cannot delete your account. Promote another user to admin first.",
        );
      }
    }

    await deleteUserRows(ctx, user._id);
  },
});

/**
 * Self-service data export (GDPR portability). Any logged-in user gets their
 * OWN data only. Credentials are redacted on purpose: session tokens, OAuth
 * access/refresh/id tokens, and password hashes are secrets, not portable
 * personal data, and must never leave the server.
 */
export const exportData = query({
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);
    if (!user) throw new ConvexError("Unauthenticated.");

    const accountsRaw: unknown = await ctx.runQuery(
      components.betterAuth.adapter.findMany,
      {
        model: "account",
        where: [{ field: "userId", value: user._id }],
        paginationOpts: { numItems: 200, cursor: null },
      },
    );
    const sessionsRaw: unknown = await ctx.runQuery(
      components.betterAuth.adapter.findMany,
      {
        model: "session",
        where: [{ field: "userId", value: user._id }],
        paginationOpts: { numItems: 200, cursor: null },
      },
    );
    const accounts = (accountsRaw as PageResult).page as Array<
      Record<string, unknown>
    >;
    const sessions = (sessionsRaw as PageResult).page as Array<
      Record<string, unknown>
    >;

    return {
      exportedAt: new Date().toISOString(),
      user: {
        id: user._id,
        name: user.name ?? null,
        email: user.email,
        emailVerified: user.emailVerified === true,
        role: user.role ?? "user",
        image: user.image ?? null,
        createdAt: new Date(user.createdAt).toISOString(),
        updatedAt: new Date(user.updatedAt).toISOString(),
      },
      accounts: accounts.map((a) => ({
        providerId: a.providerId,
        accountId: a.accountId,
        scope: a.scope ?? null,
        createdAt: new Date(Number(a.createdAt)).toISOString(),
        updatedAt: new Date(Number(a.updatedAt)).toISOString(),
      })),
      sessions: sessions.map((s) => ({
        ipAddress: s.ipAddress ?? null,
        userAgent: s.userAgent ?? null,
        createdAt: new Date(Number(s.createdAt)).toISOString(),
        expiresAt: new Date(Number(s.expiresAt)).toISOString(),
      })),
    };
  },
});
