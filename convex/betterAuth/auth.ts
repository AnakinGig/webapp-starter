import { createAuth } from "../auth";

// Static instance used for Better Auth schema generation (`npx auth
// generate`). The real authComponent + options live at `convex/auth.ts`.
export const auth = createAuth({} as never);
