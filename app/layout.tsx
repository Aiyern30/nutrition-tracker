import type React from "react";
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/contexts/language-context";
import { MetadataUpdater } from "@/components/metadata-updater";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "NutriAI - Your Personal Nutrition Assistant",
  description:
    "AI-powered nutrition tracking, meal planning, and dietary guidance. Analyze foods, plan meals, and track your nutrition goals.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/Logo.png",
        type: "image/png",
      },
    ],
    apple: "/Logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <MetadataUpdater />
            {children}
            <Toaster />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
