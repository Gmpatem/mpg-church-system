import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/features/i18n";
import { Toaster } from "@/components/feedback/toaster";
import { resolveLocale } from "@/features/i18n/locale";
import { NavigationProgress } from "@/components/navigation-progress";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MPG Church Systems - Church Management Platform",
  description: "A complete church management platform designed for modern ministries. Track members, manage departments, handle finances, and grow your community.",
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
          {children}
          <Toaster />
        </I18nProvider>
      </body>
    </html>
  );
}
