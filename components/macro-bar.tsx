import { cn } from "@/lib/utils";

interface MacroBarProps {
  label: string;
  current: number;
  goal: number;
  color?:
    | "primary"
    | "accent"
    | "chart-3"
    | "success"
    | "warning"
    | "destructive";
  showValues?: boolean;
  translations?: {
    overGoal: string;
    remaining: string;
    almostThere: string;
  };
}

export function MacroBar({
  label,
  current,
  goal,
  color,
  showValues = true,
  translations = {
    overGoal: "over goal",
    remaining: "remaining",
    almostThere: "Almost there!",
  },
}: MacroBarProps) {
  const percentage = Math.min((current / goal) * 100, 100);
  const exceeded = current > goal;
  const nearGoal = percentage >= 90 && percentage <= 100;

  // Auto-determine color based on progress if not provided
  const determineColor = () => {
    if (color) return color;
    if (exceeded) return "destructive";
    if (nearGoal) return "success";
    return "primary";
  };

  const barColor = determineColor();

  const colorClasses = {
    primary: "bg-primary",
    accent: "bg-accent",
    "chart-3": "bg-chart-3",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    destructive: "bg-red-500",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        {showValues && (
          <span
            className={cn(
              "text-muted-foreground",
              exceeded && "text-red-500 font-semibold",
              nearGoal && !exceeded && "text-green-500 font-semibold"
            )}
          >
            {Math.round(current)}g / {goal}g
          </span>
        )}
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            colorClasses[barColor],
            exceeded && "animate-pulse"
          )}
          style={{ width: `${percentage}%` }}
        />
        {exceeded && (
          <div
            className="absolute top-0 left-0 h-full bg-red-500/30 rounded-full"
            style={{ width: "100%" }}
          />
        )}
      </div>
      {exceeded && (
        <p className="text-xs text-red-500 font-medium">
          +{Math.round(current - goal)}g {translations.overGoal}
        </p>
      )}
      {nearGoal && !exceeded && (
        <p className="text-xs text-green-500 font-medium">
          {translations.almostThere} {Math.round(goal - current)}g{" "}
          {translations.remaining}
        </p>
      )}
    </div>
  );
}
