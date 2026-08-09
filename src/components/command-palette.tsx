"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { useTheme } from "next-themes";
import {
  Cookie,
  CornerDownLeft,
  FileText,
  House,
  LayoutDashboard,
  LogIn,
  LogOut,
  Monitor,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  UserPlus,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { appSettings } from "@/lib/app";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type CommandItem = {
  id: string;
  label: string;
  keywords: string[];
  icon: React.ReactNode;
  action: () => void;
};

type CommandGroup = {
  id: string;
  label: string;
  items: CommandItem[];
};

const CommandPaletteContext = React.createContext<{
  openPalette: () => void;
} | null>(null);

export function useCommandPalette() {
  const ctx = React.useContext(CommandPaletteContext);
  if (!ctx) {
    throw new Error(
      "useCommandPalette must be used within a CommandPaletteProvider",
    );
  }
  return ctx;
}

// Match rank: lower is better. A label that starts with the query ranks
// above one that merely contains it; keyword hits rank last. This is what
// makes type-ahead feel right - "s" anchors Settings (label prefix), not
// Home (which only matches via a weak keyword like "start").
function scoreMatch(item: CommandItem, q: string): number | null {
  const label = item.label.toLowerCase();
  if (label.startsWith(q)) return 0;
  if (label.includes(q)) return 1;
  if (item.keywords.some((keyword) => keyword.toLowerCase().startsWith(q)))
    return 2;
  if (item.keywords.some((keyword) => keyword.toLowerCase().includes(q)))
    return 3;
  return null;
}

export function CommandPaletteProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const isAdmin = user?.role === "admin";

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const openPalette = React.useCallback(() => {
    setQuery("");
    setActiveId(null);
    setOpen(true);
  }, []);

  const closePalette = React.useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveId(null);
  }, []);

  // Open/close with Cmd+K (macOS) or Ctrl+K (everywhere else).
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (open) {
          closePalette();
        } else {
          openPalette();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, openPalette, closePalette]);

  // Focus the input the moment the palette opens so the first keystroke
  // lands in it (no focus race). autoFocus on the input covers the initial
  // mount; this effect also re-focuses after the open transition.
  React.useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  // The best match can sit in a lower group than the first rendered one
  // (e.g. "u" anchors "Use system theme" below the Pages group), so keep
  // the highlighted option in view inside the scrollable list.
  React.useEffect(() => {
    if (!activeId) return;
    document.getElementById(`command-${activeId}`)?.scrollIntoView({
      block: "nearest",
    });
  }, [activeId]);

  const go = React.useCallback(
    (href: string) => () => {
      router.push(href);
    },
    [router],
  );

  const handleSignOut = React.useCallback(() => {
    // Leave the current page immediately after the session is cleared so
    // protected queries don't re-run without a token.
    void authClient
      .signOut()
      .then(() => {
        router.push("/");
        router.refresh();
      })
      .catch(() => {
        // If the request fails the session is still valid - keep the page.
      });
  }, [router]);

  // useMemo keeps item identities stable across re-renders.
  const groups = React.useMemo(() => {
    const groups: CommandGroup[] = [
      {
        id: "pages",
        label: "Pages",
        items: [
          {
            id: "home",
            label: "Home",
            keywords: ["overview", "landing", "start", "homepage"],
            icon: <House className="size-4" />,
            action: go("/"),
          },
          ...(isAdmin
            ? [
                {
                  id: "dashboard",
                  label: "Dashboard",
                  keywords: ["admin", "users", "manage", "panel"],
                  icon: <LayoutDashboard className="size-4" />,
                  action: go("/dashboard"),
                },
              ]
            : []),
          {
            id: "settings",
            label: "Settings",
            keywords: [
              "preferences",
              "profile",
              "account",
              "appearance",
              "security",
            ],
            icon: <Settings className="size-4" />,
            action: go("/settings"),
          },
          ...(session
            ? []
            : [
                {
                  id: "sign-in",
                  label: "Sign in",
                  keywords: ["login", "log in", "auth"],
                  icon: <LogIn className="size-4" />,
                  action: go("/login"),
                },
                {
                  id: "create-account",
                  label: "Create account",
                  keywords: ["register", "sign up", "join"],
                  icon: <UserPlus className="size-4" />,
                  action: go("/register"),
                },
              ]),
        ],
      },
      {
        id: "actions",
        label: "Actions",
        items: [
          {
            id: "toggle-theme",
            label:
              resolvedTheme === "dark"
                ? "Switch to light theme"
                : "Switch to dark theme",
            keywords: ["dark", "light", "mode", "appearance", "color"],
            icon:
              resolvedTheme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              ),
            action: () => {
              setTheme(resolvedTheme === "dark" ? "light" : "dark");
            },
          },
          {
            id: "system-theme",
            label: "Use system theme",
            keywords: ["auto", "default", "follow", "device"],
            icon: <Monitor className="size-4" />,
            action: () => {
              setTheme("system");
            },
          },
          ...(session
            ? [
                {
                  id: "sign-out",
                  label: "Sign out",
                  keywords: ["logout", "log out", "exit"],
                  icon: <LogOut className="size-4" />,
                  action: handleSignOut,
                },
              ]
            : []),
        ],
      },
      {
        id: "legal",
        label: "Legal",
        items: appSettings.footerNav.legal.map((link) => ({
          id: link.href.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, ""),
          label: link.label,
          keywords: [link.label.toLowerCase(), "legal"],
          icon:
            link.href === "/legal/terms" ? (
              <FileText className="size-4" />
            ) : link.href === "/legal/privacy" ? (
              <ShieldCheck className="size-4" />
            ) : (
              <Cookie className="size-4" />
            ),
          action: go(link.href),
        })),
      },
    ];
    return groups;
  }, [session, isAdmin, resolvedTheme, setTheme, go, handleSignOut]);

  // Only the groups/items matching the query are rendered, best matches
  // first within each group (label prefix > label contains > keyword).
  const visibleGroups = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((group) => ({
        ...group,
        items: group.items
          .map((item) => ({ item, score: scoreMatch(item, q) }))
          .filter(
            (entry): entry is { item: CommandItem; score: number } =>
              entry.score !== null,
          )
          .sort((a, b) => a.score - b.score)
          .map((entry) => entry.item),
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, query]);

  const visibleIds = React.useMemo(
    () => visibleGroups.flatMap((group) => group.items.map((item) => item.id)),
    [visibleGroups],
  );

  const runItem = (item: CommandItem) => {
    item.action();
    closePalette();
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setQuery(value);
    // Type-ahead: highlight the best matching command on every keystroke,
    // wherever it sits in the list - "u" anchors "Use system theme" even
    // though the Pages group is rendered above it.
    const q = value.trim().toLowerCase();
    if (!q) {
      setActiveId(null);
      return;
    }
    let best: { id: string; score: number } | null = null;
    for (const group of groups) {
      for (const item of group.items) {
        const score = scoreMatch(item, q);
        if (score === null) continue;
        if (!best || score < best.score) best = { id: item.id, score };
      }
    }
    setActiveId(best?.id ?? null);
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (visibleIds.length === 0) return;
      const current = visibleIds.indexOf(activeId ?? "");
      // Wrap around: ArrowDown from the last item (or from nothing) goes to
      // the first, ArrowUp from nothing goes to the last.
      const next =
        event.key === "ArrowDown"
          ? (current + 1) % visibleIds.length
          : current <= 0
            ? visibleIds.length - 1
            : current - 1;
      setActiveId(visibleIds[next] ?? null);
    } else if (event.key === "Enter") {
      const active = visibleGroups
        .flatMap((group) => group.items)
        .find((item) => item.id === activeId);
      if (active) {
        event.preventDefault();
        runItem(active);
      }
    }
  };

  return (
    <CommandPaletteContext.Provider value={{ openPalette }}>
      {children}

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 fixed inset-0 z-50 bg-black/40 backdrop-blur-xs duration-100" />
          <Dialog.Popup className="bg-popover text-popover-foreground ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 fixed top-[12vh] left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border shadow-xl ring-1 duration-100 outline-none">
            <div className="flex items-center gap-2.5 border-b px-3">
              <Search className="text-muted-foreground size-4 shrink-0" />
              <input
                ref={inputRef}
                autoFocus
                value={query}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                placeholder="Type a command or search..."
                role="combobox"
                aria-expanded={open}
                aria-controls="command-palette-list"
                aria-activedescendant={
                  activeId ? `command-${activeId}` : undefined
                }
                className="placeholder:text-muted-foreground h-11 w-full bg-transparent text-sm outline-none"
              />
            </div>

            <div
              id="command-palette-list"
              role="listbox"
              className="max-h-72 overflow-y-auto p-1.5"
            >
              {visibleGroups.length > 0 ? (
                visibleGroups.map((group) => (
                  <div key={group.id} role="group" aria-label={group.label}>
                    <div className="text-muted-foreground px-2 py-1.5 text-xs font-medium">
                      {group.label}
                    </div>
                    {group.items.map((item) => {
                      const active = item.id === activeId;
                      return (
                        <button
                          key={item.id}
                          id={`command-${item.id}`}
                          type="button"
                          role="option"
                          tabIndex={-1}
                          aria-selected={active}
                          onMouseEnter={() => setActiveId(item.id)}
                          onClick={() => runItem(item)}
                          className={cn(
                            "flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm outline-none select-none",
                            active
                              ? "bg-accent text-accent-foreground"
                              : "text-popover-foreground",
                          )}
                        >
                          <span
                            className={cn(
                              "text-muted-foreground flex size-5 shrink-0 items-center justify-center [&_svg]:size-4",
                              active && "text-accent-foreground",
                            )}
                          >
                            {item.icon}
                          </span>
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground px-2 py-6 text-center text-sm">
                  No results found.
                </div>
              )}
            </div>

            <div className="text-muted-foreground flex items-center gap-4 border-t px-3 py-2 text-xs">
              <span className="flex items-center gap-1">
                <kbd className="bg-muted rounded border px-1.5 py-0.5 font-mono text-[10px]">
                  ↑
                </kbd>
                <kbd className="bg-muted rounded border px-1.5 py-0.5 font-mono text-[10px]">
                  ↓
                </kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="bg-muted rounded border px-1.5 py-0.5 font-mono text-[10px]">
                  <CornerDownLeft className="size-2.5" />
                </kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="bg-muted rounded border px-1.5 py-0.5 font-mono text-[10px]">
                  esc
                </kbd>
                Close
              </span>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </CommandPaletteContext.Provider>
  );
}

export function CommandPaletteTrigger() {
  const { openPalette } = useCommandPalette();
  const [isMac, setIsMac] = React.useState(false);

  React.useEffect(() => {
    setIsMac(/mac/i.test(navigator.platform));
  }, []);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={openPalette}
        aria-label={
          isMac
            ? "Open command palette (Cmd+K)"
            : "Open command palette (Ctrl+K)"
        }
        className="text-muted-foreground hidden w-40 justify-between gap-2 sm:flex"
      >
        <span className="flex items-center gap-2">
          <Search className="size-3.5" />
          Search
        </span>
        <kbd className="bg-muted text-muted-foreground pointer-events-none rounded border px-1.5 py-0.5 font-mono text-[10px]">
          {isMac ? "⌘K" : "Ctrl K"}
        </kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={openPalette}
        aria-label={
          isMac
            ? "Open command palette (Cmd+K)"
            : "Open command palette (Ctrl+K)"
        }
        className="sm:hidden"
      >
        <Search className="size-4" />
      </Button>
    </>
  );
}
