import { GeistSans } from "geist/font";
import { GeistMono } from "geist/font/mono";
import type { Metadata } from "next";
import {
  AccessibilityProvider,
  SkipToContent,
} from "@/components/accessibility";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://chat.vercel.ai"
  ),
  title: "Iris",
  description: "An open-source AI assistant built on The Burgess Principle.",
};

export const viewport = {
  maximumScale: 1,
};

const geist = GeistSans;
const geistMono = GeistMono;

const LIGHT_THEME_COLOR = "#08080c";
const DARK_THEME_COLOR = "#08080c";
const THEME_COLOR_SCRIPT = `\
(function() {
  var html = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor() {
    var isDark = html.classList.contains('dark');
    meta.setAttribute('content', isDark ? '${DARK_THEME_COLOR}' : '${LIGHT_THEME_COLOR}');
  }
  var observer = new MutationObserver(updateThemeColor);
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${geist.variable} ${geistMono.variable}`}
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: "Required"
          dangerouslySetInnerHTML={{
            __html: THEME_COLOR_SCRIPT,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          disableTransitionOnChange
          enableSystem={false}
          forcedTheme="dark"
        >
          <AccessibilityProvider>
            <SessionProvider
              basePath={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/auth`}
            >
              <SkipToContent />
              <TooltipProvider>{children}</TooltipProvider>
            </SessionProvider>
          </AccessibilityProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
