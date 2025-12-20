"use client";
import { Target } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/language-context";

interface PersonalGoalsProps {
  formData: {
    display_name: string;
    daily_calorie_goal: number;
    daily_protein_goal: number;
    daily_carbs_goal: number;
    daily_fats_goal: number;
    activity_level: string;
    goal_type: string;
    height: number | null;
    weight: number | null;
    units: string;
  };
  onFormDataChange: (data: Partial<PersonalGoalsProps["formData"]>) => void;
  onSave: () => void;
  saving: boolean;
}

export function PersonalGoals({
  formData,
  onFormDataChange,
  onSave,
  saving,
}: PersonalGoalsProps) {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <CardTitle>{t.profile.personalGoals.title}</CardTitle>
        </div>
        <CardDescription>{t.profile.personalGoals.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="display-name">
            {t.profile.personalGoals.displayName}
          </Label>
          <Input
            id="display-name"
            value={formData.display_name}
            onChange={(e) => onFormDataChange({ display_name: e.target.value })}
            placeholder={t.profile.personalGoals.displayNamePlaceholder}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="height">
              {t.profile.personalGoals.height} (
              {formData.units === "metric" ? "cm" : "in"})
            </Label>
            <Input
              id="height"
              type="number"
              value={formData.height || ""}
              onChange={(e) =>
                onFormDataChange({
                  height: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              placeholder={formData.units === "metric" ? "170" : "67"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weight">
              {t.profile.personalGoals.weight} (
              {formData.units === "metric" ? "kg" : "lbs"})
            </Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              value={formData.weight || ""}
              onChange={(e) =>
                onFormDataChange({
                  weight: e.target.value ? parseFloat(e.target.value) : null,
                })
              }
              placeholder={formData.units === "metric" ? "70.0" : "154.3"}
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="calorie-goal">
              {t.profile.personalGoals.dailyCalorieGoal}
            </Label>
            <Input
              id="calorie-goal"
              type="number"
              value={formData.daily_calorie_goal}
              onChange={(e) =>
                onFormDataChange({
                  daily_calorie_goal: parseInt(e.target.value) || 2000,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="protein-goal">
              {t.profile.personalGoals.dailyProteinGoal}
            </Label>
            <Input
              id="protein-goal"
              type="number"
              value={formData.daily_protein_goal}
              onChange={(e) =>
                onFormDataChange({
                  daily_protein_goal: parseInt(e.target.value) || 150,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="carbs-goal">
              {t.profile.personalGoals.dailyCarbsGoal}
            </Label>
            <Input
              id="carbs-goal"
              type="number"
              value={formData.daily_carbs_goal}
              onChange={(e) =>
                onFormDataChange({
                  daily_carbs_goal: parseInt(e.target.value) || 200,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fats-goal">
              {t.profile.personalGoals.dailyFatsGoal}
            </Label>
            <Input
              id="fats-goal"
              type="number"
              value={formData.daily_fats_goal}
              onChange={(e) =>
                onFormDataChange({
                  daily_fats_goal: parseInt(e.target.value) || 65,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="activity-level">
              {t.profile.personalGoals.activityLevel}
            </Label>
            <Select
              value={formData.activity_level}
              onValueChange={(value) => onFormDataChange({ activity_level: value })}
            >
              <SelectTrigger id="activity-level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sedentary">
                  {t.profile.personalGoals.activityLevels.sedentary}
                </SelectItem>
                <SelectItem value="light">
                  {t.profile.personalGoals.activityLevels.light}
                </SelectItem>
                <SelectItem value="moderate">
                  {t.profile.personalGoals.activityLevels.moderate}
                </SelectItem>
                <SelectItem value="active">
                  {t.profile.personalGoals.activityLevels.active}
                </SelectItem>
                <SelectItem value="very_active">
                  {t.profile.personalGoals.activityLevels.veryActive}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal-type">
              {t.profile.personalGoals.primaryGoal}
            </Label>
            <Select
              value={formData.goal_type}
              onValueChange={(value) => onFormDataChange({ goal_type: value })}
            >
              <SelectTrigger id="goal-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weight_loss">
                  {t.profile.personalGoals.goals.weightLoss}
                </SelectItem>
                <SelectItem value="maintenance">
                  {t.profile.personalGoals.goals.maintenance}
                </SelectItem>
                <SelectItem value="muscle_gain">
                  {t.profile.personalGoals.goals.muscleGain}
                </SelectItem>
                <SelectItem value="health">
                  {t.profile.personalGoals.goals.health}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={onSave} disabled={saving}>
          {saving
            ? t.profile.personalGoals.updating
            : t.profile.personalGoals.updateGoals}
        </Button>
      </CardContent>
    </Card>
  );
}
