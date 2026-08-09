import Link from "next/link";
import type { Metadata } from "next";
import { TriangleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Something went wrong",
};

/**
 * OAuth failure landing page. better-auth redirects failed callbacks (email
 * mismatch, access denied, cancelled flow, ...) to `/error?error=...`.
 * Map the known codes to plain-language messages and always give a way back.
 */
const ERROR_MESSAGES: Record<string, { title: string; message: string }> = {
  "email_doesn't_match": {
    title: "Email doesn't match",
    message:
      "The account you tried to connect uses a different email address than this account. Connect with a provider that uses the same email.",
  },
  account_already_linked_to_different_user: {
    title: "Account already in use",
    message:
      "This provider account is already connected to a different user. Sign out and connect it with that account instead.",
  },
  unable_to_link_account: {
    title: "Couldn't connect account",
    message:
      "The provider account couldn't be connected right now. Please try again.",
  },
  email_not_found: {
    title: "No email from provider",
    message:
      "The provider didn't return an email address, so the account can't be connected or created. Try another provider.",
  },
  access_denied: {
    title: "Access denied",
    message:
      "You chose not to authorize the sign-in. You can try again whenever you're ready.",
  },
  no_code: {
    title: "Sign-in couldn't be completed",
    message:
      "The provider didn't return an authorization code. Please try again.",
  },
  invalid_code: {
    title: "Sign-in couldn't be completed",
    message:
      "The provider returned an invalid authorization code. Please try again.",
  },
  invalid_callback_request: {
    title: "Invalid sign-in link",
    message:
      "The sign-in link is invalid or was opened twice. Please try again.",
  },
  no_callback_url: {
    title: "Invalid sign-in link",
    message:
      "The sign-in link is missing a callback. Please try again from the start.",
  },
  oauth_provider_not_found: {
    title: "Provider unavailable",
    message:
      "This sign-in provider isn't configured on this app. Choose another method.",
  },
  unable_to_get_user_info: {
    title: "Provider error",
    message: "The provider couldn't return your profile. Please try again.",
  },
  server_error: {
    title: "Something went wrong",
    message: "An unexpected error occurred. Please try again in a moment.",
  },
  temporarily_unavailable: {
    title: "Temporarily unavailable",
    message:
      "The sign-in service is temporarily unavailable. Please try again soon.",
  },
};

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; error_description?: string }>;
}) {
  const { error, error_description } = await searchParams;
  const info = ERROR_MESSAGES[error ?? ""] ?? {
    title: error_description
      ? "Sign-in couldn't be completed"
      : "Something went wrong",
    message:
      error_description ??
      "An unexpected error occurred. Please try again or go back.",
  };

  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="bg-destructive/10 text-destructive mb-4 flex size-12 items-center justify-center rounded-full">
            <TriangleAlertIcon className="size-6" aria-hidden="true" />
          </div>
          <CardTitle>{info.title}</CardTitle>
          <CardDescription className="leading-relaxed">
            {info.message}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <Button nativeButton={false} render={<Link href="/" />}>
              Back to home
            </Button>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/login" />}
            >
              Go to sign in
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
