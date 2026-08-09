import { ConvexError, v, type GenericId } from "convex/values";

import { authComponent } from "./auth";
import { components } from "./_generated/api";
import { mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { getAuthUser } from "./users";

/**
 * Profile picture upload.
 *
 * Security model:
 * - Every mutation takes the user id from the session - never from input.
 * - The upload URL is only handed to signed-in users.
 * - `setAvatar` validates the uploaded file server-side against the
 *   `_storage` system table: content type must be a raster image (SVG is
 *   rejected - it can carry script and execute in our origin) and the size
 *   must be <= 5 MB. Anything invalid is deleted right away.
 *   NOTE: `contentType` is whatever the client sent on the upload POST (a
 *   header, not a content sniff). The real defense is that the file is then
 *   *served* with that allowlisted type and rendered through <img>, so a
 *   PNG-labeled SVG never executes. Content sniffing would need an action.
 * - Replacing or removing an avatar deletes the previously uploaded file so
 *   storage doesn't leak; OAuth-provided avatars (external URLs) are left
 *   untouched.
 */

/** Raster formats only - no SVG (stored XSS risk) and no arbitrary uploads. */
const ALLOWED_CONTENT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
];
const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB

/** Is this URL one of our Convex storage files (vs. an OAuth avatar)? */
function getStoredFileId(url: string): string | null {
  const marker = "/api/storage/";
  const index = url.indexOf(marker);
  if (index === -1) return null;
  const id = url.slice(index + marker.length);
  return id || null;
}

/** The caller's own user row - always from the session. */
async function requireSessionUser(ctx: MutationCtx) {
  const user = await getAuthUser(ctx);
  if (!user) throw new ConvexError("Unauthenticated.");
  return user;
}

/** Delete the user's previously uploaded avatar file, if it was one of ours. */
async function deletePreviousAvatar(
  ctx: MutationCtx,
  url: string | null | undefined,
) {
  if (!url) return;
  const id = getStoredFileId(url);
  if (!id) return;
  // Best-effort: a stale or malformed id must never block the avatar
  // update itself (worst case the orphaned file is purged later).
  try {
    await ctx.storage.delete(id as GenericId<"_storage">);
  } catch {
    // Ignore - orphaned storage files are harmless.
  }
}

/** Hand out a short-lived storage upload URL. Signed-in users only. */
export const generateAvatarUploadUrl = mutation({
  returns: v.string(),
  handler: async (ctx) => {
    await requireSessionUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/** Attach an uploaded image to the current user as their avatar. */
export const setAvatar = mutation({
  args: { storageId: v.id("_storage") },
  returns: v.union(v.null(), v.string()),
  handler: async (ctx, args) => {
    const user = await requireSessionUser(ctx);

    // Validate the file the client just uploaded (metadata from the
    // `_storage` system table: content type + size are server-side truth).
    const meta = (await ctx.db.system.get("_storage", args.storageId)) as {
      contentType?: string;
      size: number;
    } | null;
    if (!meta) {
      throw new ConvexError("The uploaded file no longer exists.");
    }
    if (!ALLOWED_CONTENT_TYPES.includes(meta.contentType ?? "")) {
      await ctx.storage.delete(args.storageId);
      throw new ConvexError("Only PNG, JPEG, WEBP or GIF images are allowed.");
    }
    if (meta.size > MAX_AVATAR_BYTES) {
      await ctx.storage.delete(args.storageId);
      throw new ConvexError("Image must be 5 MB or smaller.");
    }

    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) {
      await ctx.storage.delete(args.storageId);
      throw new ConvexError("Could not resolve the uploaded image.");
    }

    // Replace the previous avatar (delete our old file, not OAuth URLs).
    await deletePreviousAvatar(ctx, user.image);

    await ctx.runMutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: "user",
        where: [{ field: "_id", value: user._id }],
        update: { image: url, updatedAt: Date.now() },
      },
    });
    return url;
  },
});

/** Remove the current user's avatar (falls back to the initials avatar). */
export const removeAvatar = mutation({
  handler: async (ctx) => {
    const user = await requireSessionUser(ctx);

    await deletePreviousAvatar(ctx, user.image);

    await ctx.runMutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: "user",
        where: [{ field: "_id", value: user._id }],
        update: { image: null, updatedAt: Date.now() },
      },
    });
  },
});
