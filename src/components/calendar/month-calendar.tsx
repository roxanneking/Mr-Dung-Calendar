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

  return (
    <section className="rounded-2xl border border-brand-100 bg-white p-5 shadow-soft">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-brand-900">
          {format(month, "MMMM yyyy")}
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onMonthChange(subMonths(month, 1))}
            className="rounded-lg border border-brand-200 p-2 text-brand-800 hover:bg-brand-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onMonthChange(addMonths(month, 1))}
            className="rounded-lg border border-brand-200 p-2 text-brand-800 hover:bg-brand-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase text-slate-500">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
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
                "group min-h-[84px] rounded-xl border p-2 text-left transition",
                isSameMonth(day, month)
                  ? "border-brand-100 bg-white hover:border-brand-300"
                  : "border-slate-100 bg-slate-50/70 text-slate-400",
                isSameDay(day, selectedDate) &&
                  "border-brand-600 ring-2 ring-brand-200",
                isToday && "bg-brand-50"
              )}
            >
              <div className="mb-2 flex items-center justify-between">
                <span
                  className={cn(
                    "text-sm font-semibold",
                    isToday ? "text-brand-800" : "text-slate-700"
                  )}
                >
                  {format(day, "d")}
                </span>
                {isToday && (
                  <span className="rounded-full bg-brand-700 px-2 py-0.5 text-[10px] font-medium text-white">
                    Today
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
    </section>
  );
}
