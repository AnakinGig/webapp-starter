"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CircleUserRound, LogOut, Settings } from "lucide-react";

export function NavUser() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const isAdmin = user?.role === "admin";
  const name = user?.name ?? user?.email ?? "User";
  const email = user?.email ?? "";
  const initial = name.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Open menu for ${name}`}
            className="data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
          >
            <Avatar className="size-8 rounded-lg">
              {user?.image ? (
                <AvatarImage src={user.image} alt={name} />
              ) : (
                <AvatarFallback className="rounded-lg">
                  {initial}
                </AvatarFallback>
              )}
            </Avatar>
          </Button>
        }
      />
      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar className="size-8 rounded-lg">
                {user?.image ? (
                  <AvatarImage src={user.image} alt={name} />
                ) : (
                  <AvatarFallback className="rounded-lg">
                    {initial}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {email}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {isAdmin && (
            <DropdownMenuItem render={<Link href="/dashboard" />}>
              <CircleUserRound className="size-4" />
              Dashboard
            </DropdownMenuItem>
          )}
          <DropdownMenuItem render={<Link href="/settings" />}>
            <Settings className="size-4" />
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
          onClick={() => {
            // Leave the dashboard immediately after the session is cleared so
            // admin queries don't re-run without a token (they throw and crash
            // the page while still mounted).
            void authClient
              .signOut()
              .then(() => {
                router.push("/");
                router.refresh();
              })
              .catch(() => {
                // If the request fails, keep the user on the page - the
                // session is still valid and the queries keep working.
              });
          }}
        >
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
