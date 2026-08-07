import { createApi } from "@convex-dev/better-auth";

import { createAuthOptions } from "../auth";
import schema from "./schema";

// Exports the adapter functions for the Better Auth component, matching its
// schema. Used internally by the component's public API.
export const {
  create,
  findOne,
  findMany,
  updateOne,
  updateMany,
  deleteOne,
  deleteMany,
} = createApi(schema, createAuthOptions);
