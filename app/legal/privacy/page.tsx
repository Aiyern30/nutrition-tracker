"use client";

import { useLanguage } from "@/contexts/language-context";
import { useLocalizedMetadata } from "@/hooks/use-localized-metadata";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function PrivacyPolicyPage() {
  useLocalizedMetadata({ page: "default" });
  const { t } = useLanguage();
  const policy = t.legal.privacyPolicy;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
          <SidebarTrigger />
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold">{policy.title}</h1>
          </div>
        </header>

        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <p className="text-sm text-muted-foreground">
                  {policy.lastUpdated}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.values(policy.sections).map((section, index) => (
                  <div key={index}>
                    <h2 className="text-lg font-semibold mb-2">
                      {section.title}
                    </h2>
                    <p className="text-muted-foreground whitespace-pre-line">
                      {section.content}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
