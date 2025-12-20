"use client";
import { Target } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useLanguage } from "@/contexts/language-context";
import { useEffect } from "react";

interface PersonalGoalsProps {
  formData: {
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

  // Define validation schema with proper error messages
  const formSchema = z.object({
    height: z.number().nullable().optional(),
    weight: z.number().nullable().optional(),
    daily_calorie_goal: z
      .number()
      .min(1, { message: t.profile.personalGoals.errors.calorieInvalid }),
    daily_protein_goal: z
      .number()
      .min(1, { message: t.profile.personalGoals.errors.proteinInvalid }),
    daily_carbs_goal: z
      .number()
      .min(1, { message: t.profile.personalGoals.errors.carbsInvalid }),
    daily_fats_goal: z
      .number()
      .min(1, { message: t.profile.personalGoals.errors.fatsInvalid }),
    activity_level: z.string(),
    goal_type: z.string(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      height: formData.height,
      weight: formData.weight,
      daily_calorie_goal: formData.daily_calorie_goal,
      daily_protein_goal: formData.daily_protein_goal,
      daily_carbs_goal: formData.daily_carbs_goal,
      daily_fats_goal: formData.daily_fats_goal,
      activity_level: formData.activity_level,
      goal_type: formData.goal_type,
    },
  });

  // Update form when formData changes
  useEffect(() => {
    form.reset({
      height: formData.height,
      weight: formData.weight,
      daily_calorie_goal: formData.daily_calorie_goal,
      daily_protein_goal: formData.daily_protein_goal,
      daily_carbs_goal: formData.daily_carbs_goal,
      daily_fats_goal: formData.daily_fats_goal,
      activity_level: formData.activity_level,
      goal_type: formData.goal_type,
    });
  }, [formData, form]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onFormDataChange(values);
    onSave();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <CardTitle>{t.profile.personalGoals.title}</CardTitle>
        </div>
        <CardDescription>{t.profile.personalGoals.subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Height and Weight */}
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t.profile.personalGoals.height} (
                      {formData.units === "metric" ? "cm" : "in"})
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={formData.units === "metric" ? "170" : "67"}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const value = e.target.value
                            ? parseInt(e.target.value)
                            : null;
                          field.onChange(value);
                          onFormDataChange({ height: value });
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t.profile.personalGoals.weight} (
                      {formData.units === "metric" ? "kg" : "lbs"})
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder={
                          formData.units === "metric" ? "70.0" : "154.3"
                        }
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const value = e.target.value
                            ? parseFloat(e.target.value)
                            : null;
                          field.onChange(value);
                          onFormDataChange({ weight: value });
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Nutrition Goals */}
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="daily_calorie_goal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t.profile.personalGoals.dailyCalorieGoal} *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = e.target.value
                            ? parseInt(e.target.value)
                            : 0;
                          field.onChange(value);
                          onFormDataChange({ daily_calorie_goal: value });
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="daily_protein_goal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t.profile.personalGoals.dailyProteinGoal} *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = e.target.value
                            ? parseInt(e.target.value)
                            : 0;
                          field.onChange(value);
                          onFormDataChange({ daily_protein_goal: value });
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="daily_carbs_goal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t.profile.personalGoals.dailyCarbsGoal} *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = e.target.value
                            ? parseInt(e.target.value)
                            : 0;
                          field.onChange(value);
                          onFormDataChange({ daily_carbs_goal: value });
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="daily_fats_goal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t.profile.personalGoals.dailyFatsGoal} *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = e.target.value
                            ? parseInt(e.target.value)
                            : 0;
                          field.onChange(value);
                          onFormDataChange({ daily_fats_goal: value });
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="activity_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t.profile.personalGoals.activityLevel}
                    </FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        onFormDataChange({ activity_level: value });
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="goal_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.profile.personalGoals.primaryGoal}</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        onFormDataChange({ goal_type: value });
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={saving}>
              {saving
                ? t.profile.personalGoals.updating
                : t.profile.personalGoals.updateGoals}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
