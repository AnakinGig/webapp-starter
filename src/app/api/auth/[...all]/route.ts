import { handler } from "@/lib/auth-server";

// Proxies every /api/auth/* request to the better-auth instance running on
// the Convex deployment (see convex/http.ts).
export const { GET, POST } = handler;
