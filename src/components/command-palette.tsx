"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { Combobox } from "@base-ui/react/combobox";
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
  setOpen: (open: boolean) => void;
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

const filter: NonNullable<Combobox.Root.Props<CommandItem>["filter"]> = (
  itemValue,
  query,
  itemToString,
) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const label = (
    itemToString ? itemToString(itemValue) : itemValue.label
  ).toLowerCase();
  const keywords = itemValue.keywords.join(" ").toLowerCase();
  return label.includes(q) || keywords.includes(q);
};

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
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Open/close with Cmd+K (macOS) or Ctrl+K (everywhere else).
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = React.useCallback(
    (href: string) => () => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const handleSignOut = React.useCallback(() => {
    setOpen(false);
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

  // useMemo keeps item identities stable across re-renders so the combobox
  // doesn't lose the keyboard highlight while the list re-renders.
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
              setOpen(false);
            },
          },
          {
            id: "system-theme",
            label: "Use system theme",
            keywords: ["auto", "default", "follow", "device"],
            icon: <Monitor className="size-4" />,
            action: () => {
              setTheme("system");
              setOpen(false);
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
          id: link.href,
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

  return (
    <CommandPaletteContext.Provider value={{ setOpen }}>
      {children}

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 fixed inset-0 z-50 bg-black/40 backdrop-blur-xs duration-100" />
          <Dialog.Popup
            initialFocus={inputRef}
            className="bg-popover text-popover-foreground ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 fixed top-[12vh] left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border shadow-xl ring-1 duration-100 outline-none"
          >
            <Combobox.Root
              items={groups}
              onValueChange={(value: CommandItem | null) => {
                if (value) {
                  value.action();
                }
              }}
              onOpenChange={setOpen}
              itemToStringLabel={(item) => item.label}
              inputRef={inputRef}
              open={open}
              inline
              autoHighlight
              // The mouse must not steal the type-ahead highlight: hover
              // would set an active item and block autoHighlight from
              // picking the first match on the next keystroke. Clicking an
              // item still selects it (Combobox.Item.onClick).
              highlightItemOnHover={false}
              filter={filter}
            >
              <div className="flex items-center gap-2.5 border-b px-3">
                <Search className="text-muted-foreground size-4 shrink-0" />
                <Combobox.Input
                  placeholder="Type a command or search..."
                  className="placeholder:text-muted-foreground h-11 w-full bg-transparent text-sm outline-none"
                />
              </div>

              {/* Function children render only the filtered items (Base UI
                  maps them over `filteredItems`), so group labels disappear
                  when their group has no matches and typing "d" narrows the
                  list to Dashboard alone. */}
              <Combobox.List className="max-h-72 overflow-y-auto p-1.5">
                {(group: CommandGroup) => (
                  <Combobox.Group key={group.id}>
                    <Combobox.GroupLabel className="text-muted-foreground px-2 py-1.5 text-xs font-medium">
                      {group.label}
                    </Combobox.GroupLabel>
                    {group.items.map((item: CommandItem) => (
                      <Combobox.Item
                        key={item.id}
                        value={item}
                        className="group data-highlighted:bg-accent data-highlighted:text-accent-foreground flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm outline-none select-none"
                      >
                        <span className="text-muted-foreground group-data-highlighted:text-accent-foreground flex size-5 shrink-0 items-center justify-center [&_svg]:size-4">
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </Combobox.Item>
                    ))}
                  </Combobox.Group>
                )}
              </Combobox.List>

              <Combobox.Empty className="text-muted-foreground px-2 py-6 text-center text-sm">
                No results found.
              </Combobox.Empty>

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
            </Combobox.Root>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </CommandPaletteContext.Provider>
  );
}

export function CommandPaletteTrigger() {
  const { setOpen } = useCommandPalette();
  const [isMac, setIsMac] = React.useState(false);

  React.useEffect(() => {
    setIsMac(/mac/i.test(navigator.platform));
  }, []);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
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
        onClick={() => setOpen(true)}
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
