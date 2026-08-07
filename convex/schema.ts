import { defineSchema } from "convex/server";

/**
 * App tables (everything that is not auth). Auth tables live inside the
 * betterAuth component (convex/betterAuth/schema.ts).
 *
 * Add your own domain tables here, e.g. (remember to also import
 * `defineTable` from "convex/server" and `v` from "convex/values"):
 *
 *   export default defineSchema({
 *     myTable: defineTable({
 *       name: v.string(),
 *       ownerId: v.string(),
 *     }).index("by_ownerId", ["ownerId"]),
 *   });
 *
 * Note: `_creationTime` is auto-appended to every index by Convex - never
 * list it explicitly. Ordering by creation time needs no extra index.
 */
export default defineSchema({});
