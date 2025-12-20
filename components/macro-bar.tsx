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
  statusMessage?: string;
}

export function MacroBar({
  label,
  current,
  goal,
  color = "primary",
  showValues = true,
  statusMessage,
}: MacroBarProps) {
  const percentage = Math.min((current / goal) * 100, 100);
  const exceeded = current > goal;

  // Map color prop to Tailwind classes
  const getColorClasses = (colorType: string) => {
    const bgMap: Record<string, string> = {
      primary: "bg-primary",
      accent: "bg-accent",
      "chart-3": "bg-chart-3",
      success: "bg-green-500",
      warning: "bg-yellow-500",
      destructive: "bg-red-500",
    };

    const textMap: Record<string, string> = {
      primary: "text-primary",
      accent: "text-accent",
      "chart-3": "text-chart-3",
      success: "text-green-500",
      warning: "text-yellow-500",
      destructive: "text-red-500",
    };

    return {
      bg: bgMap[colorType] || "bg-primary",
      text: textMap[colorType] || "text-primary",
    };
  };

  const colors = getColorClasses(color);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        {showValues && (
          <span className={cn("font-medium", colors.text)}>
            {Math.round(current)}g / {goal}g
          </span>
        )}
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            colors.bg,
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
      {statusMessage && (
        <p className={cn("text-xs font-medium", colors.text)}>
          {statusMessage}
        </p>
      )}
    </div>
  );
}
