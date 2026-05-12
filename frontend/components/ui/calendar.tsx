"use client";

import { DayPicker, getDefaultClassNames } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const RU_MONTHS = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь",
];
const RU_WEEKDAYS = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  const defaults = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 select-none", className)}
      formatters={{
        formatMonthCaption: (date) => `${RU_MONTHS[date.getMonth()]} ${date.getFullYear()}`,
        formatWeekdayName: (date) => {
          // date is a Date whose day-of-week we need
          // In react-day-picker v9, week starts Mon (locale-dependent)
          // We map js weekday (0=Sun) to index in RU_WEEKDAYS (0=Mon)
          const dayJs = date.getDay(); // 0=Sun,1=Mon,...,6=Sat
          const idx = dayJs === 0 ? 6 : dayJs - 1; // Mon=0,...,Sun=6
          return RU_WEEKDAYS[idx];
        },
      }}
      classNames={{
        months: cn("flex flex-col sm:flex-row gap-4", classNames?.months),
        month: cn("flex flex-col gap-4", classNames?.month),
        month_caption: cn(
          "flex justify-center items-center gap-1 pt-1 relative",
          classNames?.month_caption
        ),
        caption_label: cn(
          "text-sm font-semibold text-gray-900 dark:text-white",
          classNames?.caption_label
        ),
        nav: cn(
          "flex items-center gap-1 absolute inset-x-0 top-0 justify-between px-1",
          classNames?.nav
        ),
        button_previous: cn(
          "inline-flex items-center justify-center w-7 h-7 rounded-md border border-gray-200 dark:border-gray-600",
          "bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300",
          "transition-colors disabled:opacity-30 disabled:cursor-not-allowed",
          classNames?.button_previous
        ),
        button_next: cn(
          "inline-flex items-center justify-center w-7 h-7 rounded-md border border-gray-200 dark:border-gray-600",
          "bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300",
          "transition-colors disabled:opacity-30 disabled:cursor-not-allowed",
          classNames?.button_next
        ),
        month_grid: cn("w-full border-collapse", classNames?.month_grid),
        weekdays: cn("flex", classNames?.weekdays),
        weekday: cn(
          "text-gray-400 dark:text-gray-500 rounded-md w-9 font-normal text-[0.8rem] text-center pb-1",
          classNames?.weekday
        ),
        week: cn("flex w-full mt-1", classNames?.week),
        day: cn(
          "relative p-0 text-center text-sm",
          classNames?.day
        ),
        day_button: cn(
          "inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-normal",
          "text-gray-800 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30",
          "hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          classNames?.day_button
        ),
        selected: cn(
          "[&>button]:bg-blue-600 [&>button]:text-white [&>button]:hover:bg-blue-700",
          "[&>button]:hover:text-white [&>button]:font-semibold",
          classNames?.selected
        ),
        today: cn(
          "[&>button]:border-2 [&>button]:border-blue-400 [&>button]:font-semibold",
          classNames?.today
        ),
        outside: cn(
          "text-gray-300 dark:text-gray-600 opacity-50",
          classNames?.outside
        ),
        disabled: cn(
          "[&>button]:text-gray-300 dark::[&>button]:text-gray-600 [&>button]:cursor-not-allowed [&>button]:hover:bg-transparent [&>button]:hover:text-gray-300",
          classNames?.disabled
        ),
        hidden: cn("invisible", classNames?.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          ),
      }}
      {...props}
    />
  );
}
