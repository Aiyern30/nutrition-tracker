"use client";
import { Moon, Globe } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/language-context";

interface AppSettingsProps {
  theme: string;
  language: string;
  units: string;
  onThemeChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
  onUnitsChange: (value: string) => void;
  onSave: () => void;
  saving: boolean;
}

export function AppSettings({
  theme,
  language,
  units,
  onThemeChange,
  onLanguageChange,
  onUnitsChange,
  onSave,
  saving,
}: AppSettingsProps) {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.profile.appSettings.title}</CardTitle>
        <CardDescription>{t.profile.appSettings.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4" />
            <Label>{t.profile.appSettings.theme}</Label>
          </div>
          <Select value={theme} onValueChange={onThemeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">
                {t.profile.appSettings.themes.light}
              </SelectItem>
              <SelectItem value="dark">
                {t.profile.appSettings.themes.dark}
              </SelectItem>
              <SelectItem value="system">
                {t.profile.appSettings.themes.system}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <Label>{t.profile.appSettings.language}</Label>
          </div>
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">
                {t.profile.appSettings.languages.en}
              </SelectItem>
              <SelectItem value="zh">
                {t.profile.appSettings.languages.zh}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <Label>{t.profile.appSettings.units}</Label>
          <Select value={units} onValueChange={onUnitsChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="metric">
                {t.profile.appSettings.unitsOptions.metric}
              </SelectItem>
              <SelectItem value="imperial">
                {t.profile.appSettings.unitsOptions.imperial}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Separator />
        <Button onClick={onSave} disabled={saving} className="w-full mt-4">
          {saving ? t.common.saving : t.profile.appSettings.saveSettings}
        </Button>
      </CardContent>
    </Card>
  );
}
