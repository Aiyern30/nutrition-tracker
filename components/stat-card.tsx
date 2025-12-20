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
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
}: StatCardProps) {
  const variantStyles = {
    default: "text-primary bg-primary/10",
    success: "text-green-500 bg-green-500/10",
    destructive: "text-red-500 bg-red-500/10",
    warning: "text-yellow-500 bg-yellow-500/10",
  };

  const iconBgStyles = {
    default: "bg-primary/10",
    success: "bg-green-500/10",
    destructive: "bg-red-500/10 animate-pulse",
    warning: "bg-yellow-500/10",
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p
              className={cn(
                "text-2xl font-bold",
                variant === "destructive" && "text-red-500",
                variant === "success" && "text-green-500",
                variant === "warning" && "text-yellow-500"
              )}
            >
              {value}
            </p>
            {subtitle && (
              <p
                className={cn(
                  "text-xs text-muted-foreground",
                  variant === "destructive" && "text-red-500/70 font-medium",
                  variant === "success" && "text-green-500/70 font-medium"
                )}
              >
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
          <div className={cn("rounded-full p-3", iconBgStyles[variant])}>
            <Icon
              className={cn("h-6 w-6", variantStyles[variant].split(" ")[0])}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
