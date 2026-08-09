"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { KeyRoundIcon, TriangleAlertIcon } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import {
  OAuthProviderIcon,
  providerLabel,
  useConfiguredProviders,
} from "@/lib/oauth-providers";

type LinkedAccount = {
  id: string;
  providerId: string;
  accountId: string;
  /** Epoch-ms from better-auth; normalize before display. */
  createdAt: number;
};

/** providerId better-auth uses for the email/password row. */
const CREDENTIAL_PROVIDER = "credential";

export function AccountSection() {
  const providers = useConfiguredProviders();
  const [accounts, setAccounts] = useState<LinkedAccount[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linking, setLinking] = useState<string | null>(null);
  const [unlinkTarget, setUnlinkTarget] = useState<LinkedAccount | null>(null);
  const [unlinking, setUnlinking] = useState(false);

  const hasPassword = accounts?.some(
    (a) => a.providerId === CREDENTIAL_PROVIDER,
  );

  async function loadAccounts() {
    setLoading(true);
    const { data, error: listError } = await authClient.listAccounts();
    setLoading(false);
    if (listError) {
      setError(listError.message ?? "Failed to load connected accounts.");
      return;
    }
    setAccounts(
      (data ?? []).map((a) => ({ ...a, createdAt: Number(a.createdAt) })),
    );
  }

  useEffect(() => {
    void loadAccounts();
  }, []);

  const linkedByProvider = useMemo(() => {
    const map = new Map<string, LinkedAccount>();
    for (const a of accounts ?? []) {
      if (a.providerId !== CREDENTIAL_PROVIDER) map.set(a.providerId, a);
    }
    return map;
  }, [accounts]);

  // Server refuses to unlink the last sign-in method (allowUnlinkingAll is
  // false). Mirror it here so the UI disables the button instead of failing.
  const totalMethods = accounts?.length ?? 0;

  async function handleLink(id: string) {
    setLinking(id);
    setError(null);
    const { error: linkError } = await authClient.linkSocial({
      provider: id,
      callbackURL: "/settings",
    });
    setLinking(null);
    if (linkError) {
      setError(linkError.message ?? "Couldn't connect this account.");
      return;
    }
    // The browser is redirected to the provider; when the user comes back the
    // list reloads on mount. Nothing else to do here.
  }

  async function handleUnlink() {
    if (!unlinkTarget) return;
    setUnlinking(true);
    setError(null);
    const { error: unlinkError } = await authClient.unlinkAccount({
      providerId: unlinkTarget.providerId,
    });
    setUnlinking(false);
    setUnlinkTarget(null);
    if (unlinkError) {
      setError(unlinkError.message ?? "Couldn't disconnect this account.");
      return;
    }
    await loadAccounts();
    toast.success("Account disconnected.");
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Connected accounts</CardTitle>
          <CardDescription>
            Link a provider to sign in with it and access your account from
            anywhere. The provider&apos;s email must match your account email.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading || !providers ? (
            <div className="flex flex-col gap-3 px-4 py-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error && !accounts ? (
            <p className="text-muted-foreground px-4 py-6 text-sm">
              Couldn&apos;t load your connected accounts. Reload the page to try
              again.
            </p>
          ) : (
            <ul className="divide-border divide-y">
              {providers.map((p) => {
                const linked = linkedByProvider.get(p.id);
                const isOnlyMethod = Boolean(totalMethods === 1 && linked);
                return (
                  <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="border-border bg-muted/50 flex size-9 shrink-0 items-center justify-center rounded-lg border">
                      <OAuthProviderIcon id={p.id} className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {providerLabel(p.id)}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {linked
                          ? `Connected ${formatDate(new Date(linked.createdAt))}`
                          : "Not connected"}
                      </p>
                    </div>
                    {linked ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isOnlyMethod}
                        title={
                          isOnlyMethod
                            ? "You need another way to sign in before disconnecting this account."
                            : undefined
                        }
                        onClick={() => setUnlinkTarget(linked)}
                      >
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={linking === p.id}
                        onClick={() => void handleLink(p.id)}
                      >
                        {linking === p.id ? "Connecting…" : "Connect"}
                      </Button>
                    )}
                  </li>
                );
              })}
              {hasPassword && (
                <li className="flex items-center gap-3 px-4 py-3">
                  <span className="border-border bg-muted/50 flex size-9 shrink-0 items-center justify-center rounded-lg border">
                    <KeyRoundIcon className="text-muted-foreground size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      Email and password
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Your password sign-in method
                    </p>
                  </div>
                  <Badge variant="secondary">Connected</Badge>
                </li>
              )}
            </ul>
          )}
        </CardContent>
        {error && accounts && (
          <div className="px-4 pb-4">
            <p
              role="alert"
              className="text-destructive flex items-center gap-1.5 text-sm"
            >
              <TriangleAlertIcon className="size-3.5 shrink-0" />
              {error}
            </p>
          </div>
        )}
      </Card>

      <AlertDialog
        open={Boolean(unlinkTarget)}
        onOpenChange={(open) => {
          if (!open && !unlinking) setUnlinkTarget(null);
        }}
      >
        <AlertDialogContent size="default">
          <AlertDialogHeader>
            <AlertDialogMedia>
              <TriangleAlertIcon className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Disconnect this account?</AlertDialogTitle>
            <AlertDialogDescription>
              {unlinkTarget ? (
                <>
                  You&apos;ll no longer be able to sign in with{" "}
                  <strong>{providerLabel(unlinkTarget.providerId)}</strong>. You
                  can connect it again at any time.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={unlinking}
              onClick={() => void handleUnlink()}
            >
              {unlinking ? "Disconnecting…" : "Disconnect"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
