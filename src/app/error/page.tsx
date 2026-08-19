import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TriangleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("errorPage");

  return {
    title: t("somethingWentWrong"),
  };
}

/**
 * OAuth failure landing page. better-auth redirects failed callbacks (email
 * mismatch, access denied, cancelled flow, ...) to `/error?error=...`.
 * Map the known codes to plain-language messages and always give a way back.
 * Keys are the better-auth error codes; values are message keys in the
 * `errorPage` namespace (each code keeps its own title + message pair).
 */
const ERROR_KEYS: Record<string, { title: string; message: string }> = {
  "email_doesn't_match": {
    title: "emailMismatch",
    message: "emailMismatchMsg",
  },
  account_already_linked_to_different_user: {
    title: "accountInUse",
    message: "accountInUseMsg",
  },
  unable_to_link_account: {
    title: "couldNotConnect",
    message: "couldNotConnectMsg",
  },
  email_not_found: {
    title: "noEmail",
    message: "noEmailMsg",
  },
  access_denied: {
    title: "accessDenied",
    message: "accessDeniedMsg",
  },
  no_code: {
    title: "signInIncomplete",
    message: "noCodeMsg",
  },
  invalid_code: {
    title: "signInIncomplete",
    message: "invalidCodeMsg",
  },
  invalid_callback_request: {
    title: "invalidLink",
    message: "invalidCallbackMsg",
  },
  no_callback_url: {
    title: "invalidLink",
    message: "noCallbackUrlMsg",
  },
  oauth_provider_not_found: {
    title: "providerUnavailable",
    message: "providerNotFoundMsg",
  },
  unable_to_get_user_info: {
    title: "providerError",
    message: "providerErrorMsg",
  },
  server_error: {
    title: "somethingWentWrong",
    message: "serverErrorMsg",
  },
  temporarily_unavailable: {
    title: "temporarilyUnavailable",
    message: "temporarilyUnavailableMsg",
  },
};

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; error_description?: string }>;
}) {
  const t = await getTranslations("errorPage");
  const { error, error_description } = await searchParams;
  const keys = ERROR_KEYS[error ?? ""];
  const title = keys?.title
    ? t(keys.title)
    : error_description
      ? t("signInIncomplete")
      : t("somethingWentWrong");
  const message = keys?.message
    ? t(keys.message)
    : (error_description ?? t("genericMsg"));

  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="bg-destructive/10 text-destructive mb-4 flex size-12 items-center justify-center rounded-full">
            <TriangleAlertIcon className="size-6" aria-hidden="true" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="leading-relaxed">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <Button nativeButton={false} render={<Link href="/" />}>
              {t("backToHome")}
            </Button>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/login" />}
            >
              {t("goToSignIn")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
