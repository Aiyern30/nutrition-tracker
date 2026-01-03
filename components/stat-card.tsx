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
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  isRefreshing = false,
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
        "transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-primary/20 cursor-pointer",
        isRefreshing && "ring-2 ring-primary/20"
      )}
    >
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p
              className={cn(
                "text-2xl font-bold transition-all duration-300",
                variant === "destructive" && "text-red-500",
                variant === "success" && "text-green-500",
                variant === "warning" && "text-yellow-500",
                isRefreshing && "opacity-70"
              )}
            >
              {value}
            </p>
            {subtitle && (
              <p
                className={cn(
                  "text-xs text-muted-foreground transition-all duration-300",
                  variant === "destructive" && "text-red-500/70 font-medium",
                  variant === "success" && "text-green-500/70 font-medium",
                  isRefreshing && "opacity-70"
                )}
              >
                {subtitle}
              </p>
            )}
            {trend && (
              <p
                className={cn(
                  "text-xs font-medium transition-all duration-300",
                  trend.isPositive ? "text-green-500" : "text-red-500",
                  isRefreshing && "opacity-70"
                )}
              >
                {trend.isPositive ? "↑" : "↓"} {trend.value}%
              </p>
            )}
          </div>
          <div
            className={cn(
              "rounded-full p-3 transition-all duration-300",
              iconBgStyles[variant],
              isRefreshing && "animate-pulse"
            )}
          >
            <Icon className={cn("h-6 w-6", variantStyles[variant])} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
