"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

interface DateNavigationProps {
  selectedDate: Date;
  onDateChange: (days: number) => void;
}

export function DateNavigation({
  selectedDate,
  onDateChange,
}: DateNavigationProps) {
  const { language } = useLanguage();

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => onDateChange(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <span className="text-lg font-semibold">
              {selectedDate.toLocaleDateString(
                language === "zh" ? "zh-CN" : "en-US",
                {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                }
              )}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onDateChange(1)}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
