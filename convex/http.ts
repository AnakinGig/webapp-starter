import { httpRouter } from "convex/server";

import { authComponent, createAuth } from "./auth";

const http = httpRouter();

// Registers every /api/auth/* endpoint on the Convex deployment. Next.js
// proxies requests through src/app/api/auth/[...all]/route.ts.
authComponent.registerRoutes(http, createAuth);

export default http;
