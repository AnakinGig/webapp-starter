"use client";

import { ConvexBetterAuthProvider, type AuthClient } from "@convex-dev/better-auth/react";
import { ConvexReactClient } from "convex/react";

import { authClient } from "@/lib/auth-client";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({
  children,
  initialToken,
}: {
  children: React.ReactNode;
  initialToken?: string | null;
}) {
  return (
    <ConvexBetterAuthProvider
      client={convex}
      // The provider's AuthClient union type is stricter than the plugin
      // inference on the created client - the shapes are identical at runtime.
      authClient={authClient as unknown as AuthClient}
      initialToken={initialToken}
    >
      {children}
    </ConvexBetterAuthProvider>
  );
}
