"use client";
import { Shield, FileText, HelpCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLanguage } from "@/contexts/language-context";
import Link from "next/link";

export function LegalSupport() {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.profile.legal.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Alert className="border-accent/50 bg-accent/5">
          <AlertCircle className="h-4 w-4 text-accent" />
          <AlertDescription className="text-sm">
            <strong>{t.profile.legal.disclaimer}</strong>{" "}
            {t.profile.legal.disclaimerText}
          </AlertDescription>
        </Alert>
        <Button
          asChild
          variant="outline"
          className="w-full justify-start bg-transparent"
        >
          <Link href="/legal/privacy">
            <Shield className="mr-2 h-4 w-4" />
            {t.profile.legal.privacyPolicy}
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="w-full justify-start bg-transparent"
        >
          <Link href="/legal/terms">
            <FileText className="mr-2 h-4 w-4" />
            {t.profile.legal.termsOfService}
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="w-full justify-start bg-transparent"
        >
          <Link href="/legal/help">
            <HelpCircle className="mr-2 h-4 w-4" />
            {t.profile.legal.helpSupport}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
