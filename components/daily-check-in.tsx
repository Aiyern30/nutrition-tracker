"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scale, Footprints, Moon, Droplets, PenLine } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface DailyMetrics {
  weight?: number;
  steps?: number;
  sleep_hours?: number;
  water_intake?: number;
}

export function DailyCheckIn({
  currentMetrics,
  onUpdate,
}: {
  currentMetrics?: DailyMetrics;
  onUpdate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState<DailyMetrics>({
    weight: currentMetrics?.weight || undefined,
    steps: currentMetrics?.steps || undefined,
    sleep_hours: currentMetrics?.sleep_hours || undefined,
    water_intake: currentMetrics?.water_intake || undefined,
  });

  // Sync state with props when dialog opens or metrics change
  useEffect(() => {
    if (open && currentMetrics) {
      setFormData({
        weight: currentMetrics.weight,
        steps: currentMetrics.steps,
        sleep_hours: currentMetrics.sleep_hours,
        water_intake: currentMetrics.water_intake,
      });
    }
  }, [open, currentMetrics]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split("T")[0];

      // Upsert: Create or update today's summary
      const { error } = await supabase.from("daily_summaries").upsert(
        {
          user_id: user.id,
          date: today,
          weight: formData.weight,
          steps: formData.steps,
          sleep_hours: formData.sleep_hours,
          water_intake: formData.water_intake,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id, date" }
      );

      if (error) throw error;

      // Also update profile weight if provided (current weight)
      if (formData.weight) {
        await supabase
          .from("profiles")
          .update({ weight: formData.weight })
          .eq("id", user.id);
      }

      toast.success("Daily stats updated successfully!");
      setOpen(false);
      onUpdate?.();
      router.refresh();
    } catch (error) {
      console.error("Error updating stats:", error);
      toast.error("Failed to update daily stats.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-full hover:bg-muted"
        >
          <PenLine className="h-4 w-4" />
          <span className="sr-only">Log Daily Stats</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Daily Check-in</DialogTitle>
          <DialogDescription>
            Log your daily health metrics to track your progress.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="weight"
              className="text-right flex items-center justify-end gap-2"
            >
              <Scale className="h-4 w-4 text-orange-500" /> Weight
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="kg"
                value={formData.weight || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    weight: parseFloat(e.target.value) || undefined,
                  })
                }
              />
              <span className="text-sm text-muted-foreground w-8">kg</span>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="steps"
              className="text-right flex items-center justify-end gap-2"
            >
              <Footprints className="h-4 w-4 text-orange-500" /> Steps
            </Label>
            <div className="col-span-3">
              <Input
                id="steps"
                type="number"
                placeholder="steps"
                value={formData.steps || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    steps: parseInt(e.target.value) || undefined,
                  })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="sleep"
              className="text-right flex items-center justify-end gap-2"
            >
              <Moon className="h-4 w-4 text-lime-500" /> Sleep
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              <Input
                id="sleep"
                type="number"
                step="0.5"
                placeholder="hours"
                value={formData.sleep_hours || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sleep_hours: parseFloat(e.target.value) || undefined,
                  })
                }
              />
              <span className="text-sm text-muted-foreground w-8">hrs</span>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="water"
              className="text-right flex items-center justify-end gap-2"
            >
              <Droplets className="h-4 w-4 text-blue-500" /> Water
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              <Input
                id="water"
                type="number"
                step="0.25"
                placeholder="Liters"
                value={formData.water_intake || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    water_intake: parseFloat(e.target.value) || undefined,
                  })
                }
              />
              <span className="text-sm text-muted-foreground w-8">L</span>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Metrics"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
