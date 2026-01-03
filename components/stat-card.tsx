import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "destructive" | "warning";
  isRefreshing?: boolean;
  progress?: {
    value: number;
    max: number;
    color: string;
  };
  customBg?: string;
  customText?: string;
  barChart?: boolean;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  isRefreshing = false,
  progress,
  customBg,
  customText,
  barChart,
}: StatCardProps) {
  const variantStyles = {
    default: "text-primary",
    success: "text-green-500",
    destructive: "text-red-500",
    warning: "text-yellow-500",
  };

  const iconBgStyles = {
    default: "bg-primary/10",
    success: "bg-green-500/10",
    destructive: "bg-red-500/10 animate-pulse",
    warning: "bg-yellow-500/10",
  };

  return (
    <Card
      className={cn(
        "transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-primary/20 cursor-pointer overflow-hidden relative",
        isRefreshing && "ring-2 ring-primary/20"
      )}
    >
      <CardContent className="pt-6 relative z-10">
        <div className="flex items-center justify-between mb-4">
          {/* Header with Value and Icon */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-center gap-2">
              <Icon
                className={cn("h-5 w-5", customText || variantStyles[variant])}
              />
              <span className="text-2xl font-bold">{value}</span>
            </div>
          </div>

          {/* Simple Icon Badge if no custom bg */}
          {!customBg && (
            <div className={cn("rounded-full p-2", iconBgStyles[variant])}>
              <Icon className={cn("h-5 w-5", variantStyles[variant])} />
            </div>
          )}

          {/* Custom BG Icon Badge */}
          {customBg && (
            <div className={cn("rounded-full p-2", customBg, customText)}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="space-y-3">
          {/* Subtitle / Trend */}
          <div className="flex items-center justify-between">
            {subtitle && (
              <p className="text-xs text-muted-foreground font-medium">
                {subtitle}
              </p>
            )}
            {trend && (
              <p
                className={cn(
                  "text-xs font-medium",
                  trend.isPositive ? "text-green-500" : "text-red-500"
                )}
              >
                {trend.isPositive ? "↑" : "↓"} {trend.value}%
              </p>
            )}
          </div>

          {/* Progress Bar */}
          {progress && (
            <div className="h-2 w-full bg-secondary/20 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  progress.color
                )}
                style={{
                  width: `${Math.min(
                    (progress.value / progress.max) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          )}

          {/* Mini Bar Chart for Sleep */}
          {barChart && (
            <div className="flex items-end gap-1 h-8 mt-2 justify-between px-1">
              {[40, 60, 45, 70, 50, 80, 65].map((h, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1 rounded-t-sm bg-lime-200",
                    i === 5 ? "bg-lime-500 h-full" : "h-1/2"
                  )}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
