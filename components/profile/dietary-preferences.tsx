"use client";
import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/language-context";

interface DietaryPreferencesProps {
  dietaryRestrictions: string[];
  dislikedFoods: string[];
  onAddRestriction: (restriction: string) => void;
  onRemoveRestriction: (restriction: string) => void;
  onAddDislikedFood: (food: string) => void;
  onRemoveDislikedFood: (food: string) => void;
}

export function DietaryPreferences({
  dietaryRestrictions,
  dislikedFoods,
  onAddRestriction,
  onRemoveRestriction,
  onAddDislikedFood,
  onRemoveDislikedFood,
}: DietaryPreferencesProps) {
  const { t } = useLanguage();
  const [newRestriction, setNewRestriction] = useState("");
  const [newDislikedFood, setNewDislikedFood] = useState("");

  const handleAddRestriction = () => {
    if (!newRestriction.trim()) return;
    onAddRestriction(newRestriction.trim());
    setNewRestriction("");
  };

  const handleAddDislikedFood = () => {
    if (!newDislikedFood.trim()) return;
    onAddDislikedFood(newDislikedFood.trim());
    setNewDislikedFood("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.profile.dietaryPreferences.title}</CardTitle>
        <CardDescription>
          {t.profile.dietaryPreferences.subtitle}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>{t.profile.dietaryPreferences.allergiesRestrictions}</Label>
          <div className="flex gap-2">
            <Input
              value={newRestriction}
              onChange={(e) => setNewRestriction(e.target.value)}
              placeholder={t.profile.dietaryPreferences.addRestriction}
              onKeyDown={(e) => e.key === "Enter" && handleAddRestriction()}
            />
            <Button onClick={handleAddRestriction} type="button">
              {t.profile.dietaryPreferences.add}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {dietaryRestrictions.map((item) => (
              <Badge
                key={item}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => onRemoveRestriction(item)}
              >
                {item} ×
              </Badge>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label>{t.profile.dietaryPreferences.foodsToAvoid}</Label>
          <div className="flex gap-2">
            <Input
              value={newDislikedFood}
              onChange={(e) => setNewDislikedFood(e.target.value)}
              placeholder={t.profile.dietaryPreferences.addDislikedFood}
              onKeyDown={(e) => e.key === "Enter" && handleAddDislikedFood()}
            />
            <Button onClick={handleAddDislikedFood} type="button">
              {t.profile.dietaryPreferences.add}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {dislikedFoods.map((item) => (
              <Badge
                key={item}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => onRemoveDislikedFood(item)}
              >
                {item} ×
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
