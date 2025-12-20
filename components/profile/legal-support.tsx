"use client";
import { Shield, FileText, HelpCircle, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLanguage } from "@/contexts/language-context";

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
          variant="outline"
          className="w-full justify-start bg-transparent"
        >
          <Shield className="mr-2 h-4 w-4" />
          {t.profile.legal.privacyPolicy}
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start bg-transparent"
        >
          <FileText className="mr-2 h-4 w-4" />
          {t.profile.legal.termsOfService}
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start bg-transparent"
        >
          <HelpCircle className="mr-2 h-4 w-4" />
          {t.profile.legal.helpSupport}
        </Button>
      </CardContent>
    </Card>
  );
}
