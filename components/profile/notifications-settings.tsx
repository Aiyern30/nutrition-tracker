"use client";
import { Bell } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/contexts/language-context";

interface NotificationsSettingsProps {
  mealReminders: boolean;
  weeklySummary: boolean;
  aiInsights: boolean;
  onMealRemindersChange: (value: boolean) => void;
  onWeeklySummaryChange: (value: boolean) => void;
  onAiInsightsChange: (value: boolean) => void;
  onSave: () => void;
  saving: boolean;
}

export function NotificationsSettings({
  mealReminders,
  weeklySummary,
  aiInsights,
  onMealRemindersChange,
  onWeeklySummaryChange,
  onAiInsightsChange,
  onSave,
  saving,
}: NotificationsSettingsProps) {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <CardTitle>{t.profile.notifications.title}</CardTitle>
        </div>
        <CardDescription>{t.profile.notifications.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>{t.profile.notifications.mealReminders}</Label>
            <p className="text-sm text-muted-foreground">
              {t.profile.notifications.mealRemindersDesc}
            </p>
          </div>
          <Switch checked={mealReminders} onCheckedChange={onMealRemindersChange} />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>{t.profile.notifications.weeklySummary}</Label>
            <p className="text-sm text-muted-foreground">
              {t.profile.notifications.weeklySummaryDesc}
            </p>
          </div>
          <Switch checked={weeklySummary} onCheckedChange={onWeeklySummaryChange} />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>{t.profile.notifications.aiInsights}</Label>
            <p className="text-sm text-muted-foreground">
              {t.profile.notifications.aiInsightsDesc}
            </p>
          </div>
          <Switch checked={aiInsights} onCheckedChange={onAiInsightsChange} />
        </div>
        <Separator />
        <Button onClick={onSave} disabled={saving} className="w-full mt-4">
          {saving ? t.common.saving : t.profile.notifications.saveSettings}
        </Button>
      </CardContent>
    </Card>
  );
}
