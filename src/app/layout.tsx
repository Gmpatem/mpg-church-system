import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/features/i18n";
import { Toaster } from "@/components/feedback/toaster";
import { resolveLocale } from "@/features/i18n/locale";
import { NavigationProgress } from "@/components/navigation-progress";
import { ServiceWorkerRegistration } from "@/components/offline/ServiceWorkerRegistration";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  applicationName: "MPG Church",
  title: "MPG Church Systems - Church Management Platform",
  description: "A complete church management platform designed for modern ministries. Track members, manage departments, handle finances, and grow your community.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "My Church",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icons/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#064e3b",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Resolve locale server-side for initial render
  const { language } = await resolveLocale();

  return (
    <html lang={language}>
      <body className={inter.className}>
        <I18nProvider defaultLanguage={language}>
          <NavigationProgress />
          <ServiceWorkerRegistration />
          {children}
          <Toaster />
        </I18nProvider>
      </body>
    </html>
  );
}
