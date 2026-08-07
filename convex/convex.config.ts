import { defineApp } from "convex/server";

import betterAuth from "./betterAuth/convex.config";

const app = defineApp();

// The Better Auth component (auth tables + all /api/auth endpoints live here).
app.use(betterAuth);

export default app;
