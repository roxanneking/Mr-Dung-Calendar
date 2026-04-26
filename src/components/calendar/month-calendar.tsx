"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths
} from "date-fns";
import { vi } from "date-fns/locale";

import { getPriorityMeta } from "@/features/events/constants";
import { EventRecord } from "@/features/events/types";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthCalendarProps {
  month: Date;
  selectedDate: Date;
  onSelectedDateChange: (date: Date) => void;
  onMonthChange: (date: Date) => void;
  eventsByDate: Map<string, EventRecord[]>;
}

export function MonthCalendar({
  month,
  selectedDate,
  onSelectedDateChange,
  onMonthChange,
  eventsByDate
}: MonthCalendarProps) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const monthLabel = format(month, "MMMM yyyy", { locale: vi });
  const formattedMonthLabel = `${monthLabel.charAt(0).toUpperCase()}${monthLabel.slice(1)}`;
  const weekDays = ["Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7", "CN"];

  return (
    <section className="rounded-2xl border border-brand-100 bg-white p-5 shadow-soft md:p-6">
      <header className="mb-4 flex items-center justify-between border-b border-brand-100 pb-3">
        <h2 className="text-xl font-semibold tracking-tight text-brand-900 md:text-2xl">
          {formattedMonthLabel}
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onMonthChange(subMonths(month, 1))}
            className="rounded-lg border border-brand-200 p-2 text-brand-800 transition hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
            aria-label="Tháng trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onMonthChange(addMonths(month, 1))}
            className="rounded-lg border border-brand-200 p-2 text-brand-800 transition hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
            aria-label="Tháng sau"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
            {weekDays.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-2">
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayEvents = eventsByDate.get(key) ?? [];
              const isToday = isSameDay(day, new Date());

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onSelectedDateChange(day)}
                  className={cn(
                    "group min-h-[92px] rounded-xl border p-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200",
                    isSameMonth(day, month)
                      ? "border-brand-100 bg-white hover:border-brand-300 hover:bg-brand-50/40"
                      : "border-slate-100 bg-slate-50/70 text-slate-400",
                    isSameDay(day, selectedDate) &&
                      "border-brand-600 ring-2 ring-brand-200",
                    isToday && "bg-brand-50"
                  )}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        isToday ? "text-brand-800" : "text-slate-700"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {isToday && (
                      <span className="rounded-full bg-brand-700 px-2 py-0.5 text-[10px] font-medium text-white">
                        Hôm nay
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div key={event.id}>
                        <div
                          className="truncate rounded-md px-2 py-0.5 text-xs text-white"
                          style={{ backgroundColor: getPriorityMeta(event.category).color }}
                        >
                          {event.start_time.slice(0, 5)} {event.title}
                        </div>
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <p className="text-xs font-medium text-slate-500">
                        +{dayEvents.length - 2} lịch khác
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
