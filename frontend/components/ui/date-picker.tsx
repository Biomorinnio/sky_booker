"use client";

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "./calendar";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value: string; // YYYY-MM-DD или ""
  onChange: (value: string) => void;
  placeholder?: string;
  min?: string; // YYYY-MM-DD
  max?: string; // YYYY-MM-DD
  disabled?: boolean;
  className?: string;
  required?: boolean;
}

function formatRuDate(iso: string): string {
  if (!iso) return "";
  const [year, month, day] = iso.split("-").map(Number);
  const months = [
    "января","февраля","марта","апреля","мая","июня",
    "июля","августа","сентября","октября","ноября","декабря",
  ];
  return `${day} ${months[month - 1]} ${year}`;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Выберите дату",
  min,
  max,
  disabled = false,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const selected = value ? new Date(value + "T12:00:00") : undefined;
  const minDate = min ? new Date(min + "T00:00:00") : undefined;
  const maxDate = max ? new Date(max + "T23:59:59") : undefined;

  const handleSelect = (day: Date | undefined) => {
    if (!day) return;
    const y = day.getFullYear();
    const m = String(day.getMonth() + 1).padStart(2, "0");
    const d = String(day.getDate()).padStart(2, "0");
    onChange(`${y}-${m}-${d}`);
    setOpen(false); // закрываем только после выбора даты
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "w-full flex items-center gap-2 px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg",
            "bg-white dark:bg-gray-700 text-left transition-all cursor-pointer",
            "focus:outline-none focus:ring-2 focus:ring-blue-500",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            open && "ring-2 ring-blue-500 border-blue-500",
            value ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500",
            className
          )}
        >
          <CalendarIcon className={cn("w-4 h-4 flex-shrink-0", value ? "text-blue-500" : "text-gray-400")} />
          <span>{value ? formatRuDate(value) : placeholder}</span>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={6}
          className={cn(
            "z-[9999] rounded-xl shadow-xl border border-gray-200 dark:border-gray-600",
            "bg-white dark:bg-gray-800 p-0 outline-none",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          )}
        >
          <Calendar
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            disabled={(day) => {
              if (minDate && day < minDate) return true;
              if (maxDate && day > maxDate) return true;
              return false;
            }}
            defaultMonth={selected ?? minDate}
            initialFocus
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
