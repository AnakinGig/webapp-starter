import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import "@/styles/globals.css";

import { appSettings } from "@/lib/app";
import { getToken } from "@/lib/auth-server";
import { ThemeProvider } from "@/components/theme-provider";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { Toaster } from "@/components/ui/sonner";
import { CookieConsent } from "@/components/cookie-consent";
import { CommandPaletteProvider } from "@/components/command-palette";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(appSettings.url),
  applicationName: appSettings.shortName,
  title: {
    default: `${appSettings.name} - ${appSettings.tagline}`,
    template: `%s - ${appSettings.name}`,
  },
  description: appSettings.description,
  icons: {
    icon: [
      {
        url: appSettings.logo.iconLight,
        media: "(prefers-color-scheme: light)",
      },
      { url: appSettings.logo.iconDark, media: "(prefers-color-scheme: dark)" },
      { url: appSettings.logo.iconSvg, type: "image/svg+xml" },
    ],
    apple: appSettings.logo.appleIcon,
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eae8e3" },
    { media: "(prefers-color-scheme: dark)", color: "#131519" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const token = await getToken();
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} bg-background`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider>
            <CommandPaletteProvider>
              <ConvexClientProvider initialToken={token}>
                {children}
              </ConvexClientProvider>
              <Toaster position="top-center" />
              <CookieConsent />
            </CommandPaletteProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
