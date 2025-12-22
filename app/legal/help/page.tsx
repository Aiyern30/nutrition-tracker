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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, Mail } from "lucide-react";

export default function HelpSupportPage() {
  useLocalizedMetadata({ page: "default" });
  const { t } = useLanguage();
  const help = t.profile.legal.helpSupport;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
          <SidebarTrigger />
          <div className="flex items-center gap-3">
            <HelpCircle className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold">{help.title}</h1>
          </div>
        </header>

        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {Object.entries(help.sections).map(([key, section]) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {"questions" in section ? (
                    <Accordion type="single" collapsible className="w-full">
                      {section.questions.map((qa, index) => (
                        <AccordionItem key={index} value={`item-${index}`}>
                          <AccordionTrigger className="text-left">
                            {qa.q}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {qa.a}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-muted-foreground">{section.content}</p>
                      <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                        <Mail className="h-5 w-5 text-primary" />
                        <a
                          href={`mailto:${section.email}`}
                          className="text-primary hover:underline font-medium"
                        >
                          {section.email}
                        </a>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {section.response}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
