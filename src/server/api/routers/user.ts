import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, like, ne, or, sql } from "drizzle-orm";
import { z } from "zod";

import {
  account as accountTable,
  session as sessionTable,
  user as userTable,
} from "~/server/db/schema";
import { db } from "~/server/db";
import { auth } from "~/server/better-auth";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

const PAGE_SIZE = 10;

/** Normalized (lowercased) email used by better-auth when signing up. */
const normalizeEmail = (email: string) => email.toLowerCase();

/**
 * NOTE on guard-rail races: the "last admin" / duplicate-email checks are
 * wrapped in transactions for a consistent snapshot. SingleStore's columnstore
 * tables don't support `SELECT ... FOR UPDATE` row locks, so two truly
 * concurrent admin removals could in theory both pass the count check. That is
 * an accepted limitation on the shared tier; the transaction keeps every
 * single-request path consistent.
 */

export const userRouter = createTRPCRouter({
  /**
   * Verify the caller's OWN password (used for blur-time validation on the
   * change-password form). Self-service: any logged-in user, NOT admin-gated.
   * Delegates to better-auth's server-scoped verify-password endpoint, which
   * is intentionally not exposed to the browser client.
   */
  verifyPassword: protectedProcedure
    .input(z.object({ password: z.string().min(1).max(128) }))
    .mutation(async ({ ctx, input }) => {
      try {
        await auth.api.verifyPassword({
          headers: ctx.headers,
          body: { password: input.password },
        })
        return { valid: true }
      } catch {
        return { valid: false }
      }
    }),

  /** Workspace-wide aggregates for the dashboard stat cards. Admin only. */
  getStats: adminProcedure.query(async () => {
    // Single aggregate query instead of three separate counts — SingleStore
    // round trips are the dominant cost on the shared tier.
    const [row] = await db
      .select({
        total: count(),
        admins: sql<number>`COALESCE(SUM(${userTable.role} = 'admin'), 0)`,
        verified: sql<number>`COALESCE(SUM(${userTable.emailVerified}), 0)`,
      })
      .from(userTable);
    // mysql2 returns SUM() as a string, so coerce to numbers.
    return {
      total: row?.total ?? 0,
      admins: Number(row?.admins ?? 0),
      verified: Number(row?.verified ?? 0),
    };
  }),

  /** List users with optional search + pagination. Admin only. */
  getMany: adminProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(PAGE_SIZE),
        query: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const { page, pageSize, query } = input;
      const offset = (page - 1) * pageSize;

      const where = query
        ? or(
            like(userTable.email, `%${query}%`),
            like(userTable.name, `%${query}%`),
          )
        : undefined;

      const [total, data] = await Promise.all([
        db.$count(userTable, where),
        db
          .select()
          .from(userTable)
          .where(where)
          // Admins first, then users in creation order (oldest first).
          .orderBy(
            desc(sql`${userTable.role} = 'admin'`),
            asc(userTable.createdAt),
            asc(userTable.id),
          )
          .limit(pageSize)
          .offset(offset),
      ]);

      return {
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),

  /** Create a user record. Admin only. The very first user becomes admin. */
  create: adminProcedure
    .input(
      z.object({
        name: z.string().trim().min(1),
        email: z.string().trim().email(),
        role: z.enum(["admin", "user"]).default("user"),
      }),
    )
    .mutation(async ({ input }) => {
      const email = normalizeEmail(input.email);
      await db.transaction(async (tx) => {
        const existing = await tx
          .select({ id: userTable.id })
          .from(userTable)
          .where(eq(userTable.email, email))
          .limit(1);
        if (existing.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A user with this email already exists.",
          });
        }

        const count = await tx.$count(userTable);
        const role = count === 0 ? "admin" : input.role;

        await tx.insert(userTable).values({
          name: input.name,
          email,
          role,
        });
      });
    }),

  /** Update a user record (name / email / role / verification). Admin only. */
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().trim().min(1).optional(),
        email: z.string().trim().email().optional(),
        role: z.enum(["admin", "user"]).optional(),
        emailVerified: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      if (Object.keys(updates).length === 0) return;

      const changes: typeof updates = { ...updates };

      await db.transaction(async (tx) => {
        const [target] = await tx
          .select()
          .from(userTable)
          .where(eq(userTable.id, id))
          .limit(1);
        if (!target) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
        }

        // Email must stay unique (excluding the user being edited).
        if (changes.email) {
          changes.email = normalizeEmail(changes.email);
          if (changes.email !== target.email) {
            const dup = await tx
              .select({ id: userTable.id })
              .from(userTable)
              .where(and(eq(userTable.email, changes.email), ne(userTable.id, id)))
              .limit(1);
            if (dup.length > 0) {
              throw new TRPCError({
                code: "CONFLICT",
                message: "A user with this email already exists.",
              });
            }
          }
        }

        // Guard rail: you cannot change your own role.
        if (changes.role && changes.role !== target.role && id === ctx.session.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You cannot change your own role.",
          });
        }

        // Guard rail: cannot demote the last admin.
        if (changes.role === "user" && target.role === "admin") {
          const adminCount = await tx.$count(
            userTable,
            eq(userTable.role, "admin"),
          );
          if (adminCount <= 1) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Cannot demote the last admin.",
            });
          }
        }

        await tx.update(userTable).set(changes).where(eq(userTable.id, id));
      });
    }),

  /** Delete a user and their sessions/accounts. Admin only. */
  remove: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Guard rail: you cannot delete your own account.
      if (input.id === ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot delete your own account.",
        });
      }

      await db.transaction(async (tx) => {
        const [target] = await tx
          .select()
          .from(userTable)
          .where(eq(userTable.id, input.id))
          .limit(1);
        if (!target) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
        }

        // Guard rail: cannot delete the last admin.
        if (target.role === "admin") {
          const adminCount = await tx.$count(
            userTable,
            eq(userTable.role, "admin"),
          );
          if (adminCount <= 1) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Cannot delete the last admin.",
            });
          }
        }

        // SingleStore has no FK cascades — clean up related rows explicitly.
        await tx.delete(sessionTable).where(eq(sessionTable.userId, input.id));
        await tx.delete(accountTable).where(eq(accountTable.userId, input.id));
        await tx.delete(userTable).where(eq(userTable.id, input.id));
      });
    }),
});
