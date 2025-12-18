interface MacroBarProps {
  label: string;
  current: number;
  goal: number;
  color: "primary" | "accent" | "chart-3";
}

export function MacroBar({ label, current, goal, color }: MacroBarProps) {
  const percentage = Math.min((current / goal) * 100, 100);

  const colorClasses = {
    primary: "bg-primary",
    accent: "bg-accent",
    "chart-3": "bg-chart-3",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {current}g / {goal}g
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
