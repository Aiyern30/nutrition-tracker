"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { zhCN, enUS } from "date-fns/locale";

interface DateNavigationProps {
  selectedDate: Date;
  onDateChange: (days: number) => void;
  onDateSelect: (date: Date) => void;
}

export function DateNavigation({
  selectedDate,
  onDateChange,
  onDateSelect,
}: DateNavigationProps) {
  const { language } = useLanguage();
  const dateLocale = language === "zh" ? zhCN : enUS;

  return (
    <Card className="border-none shadow-none bg-background/50 backdrop-blur-sm">
      <CardContent className="p-0">
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onDateChange(-1)}
            className="h-9 w-9 rounded-full border-muted-foreground/20 hover:bg-background hover:text-primary transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "flex-1 min-w-[200px] justify-center font-normal text-base h-10 rounded-full border-muted-foreground/20 hover:bg-background hover:text-primary transition-all group shadow-sm bg-card"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="font-semibold">
                  {format(selectedDate, "EEEE, MMMM d", { locale: dateLocale })}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && onDateSelect(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="icon"
            onClick={() => onDateChange(1)}
            className="h-9 w-9 rounded-full border-muted-foreground/20 hover:bg-background hover:text-primary transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
