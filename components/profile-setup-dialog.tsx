"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ProfileSetupDialogProps {
  open: boolean;
  userId: string;
}

export function ProfileSetupDialog({ open, userId }: ProfileSetupDialogProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    display_name: "",
    daily_calorie_goal: 2000,
    daily_protein_goal: 150,
    daily_carbs_goal: 200,
    daily_fats_goal: 65,
    daily_water_goal: 8,
    activity_level: "moderate",
    goal_type: "maintenance",
    height: null as number | null,
    weight: null as number | null,
  });

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.from("profiles").upsert({
        id: userId,
        ...formData,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create minimal profile
      const { error } = await supabase.from("profiles").upsert({
        id: userId,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create profile");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
          <DialogDescription>
            Set up your nutrition goals to get personalized recommendations. You
            can always update these later.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display_name">Display Name</Label>
            <Input
              id="display_name"
              value={formData.display_name}
              onChange={(e) =>
                setFormData({ ...formData, display_name: e.target.value })
              }
              placeholder="Enter your name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                value={formData.height || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    height: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                placeholder="170"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={formData.weight || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    weight: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                placeholder="70.0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="activity_level">Activity Level</Label>
              <Select
                value={formData.activity_level}
                onValueChange={(value) =>
                  setFormData({ ...formData, activity_level: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentary</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="very_active">Very Active</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal_type">Goal</Label>
              <Select
                value={formData.goal_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, goal_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weight_loss">Weight Loss</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Daily Nutrition Goals</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="calories" className="text-sm">
                  Calories
                </Label>
                <Input
                  id="calories"
                  type="number"
                  value={formData.daily_calorie_goal}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      daily_calorie_goal: parseInt(e.target.value) || 2000,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="protein" className="text-sm">
                  Protein (g)
                </Label>
                <Input
                  id="protein"
                  type="number"
                  value={formData.daily_protein_goal}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      daily_protein_goal: parseInt(e.target.value) || 150,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carbs" className="text-sm">
                  Carbs (g)
                </Label>
                <Input
                  id="carbs"
                  type="number"
                  value={formData.daily_carbs_goal}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      daily_carbs_goal: parseInt(e.target.value) || 200,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fats" className="text-sm">
                  Fats (g)
                </Label>
                <Input
                  id="fats"
                  type="number"
                  value={formData.daily_fats_goal}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      daily_fats_goal: parseInt(e.target.value) || 65,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="water">Daily Water Goal (glasses)</Label>
            <Input
              id="water"
              type="number"
              value={formData.daily_water_goal}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  daily_water_goal: parseInt(e.target.value) || 8,
                })
              }
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleSkip} disabled={loading}>
            Skip for Now
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Complete Setup"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
