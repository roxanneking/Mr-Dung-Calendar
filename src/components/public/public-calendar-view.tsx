"use client";

import { useMemo, useState } from "react";
import { format, startOfMonth } from "date-fns";
import { MonthCalendar } from "@/components/calendar/month-calendar";
import { DayEventsPanel } from "@/components/events/day-events-panel";
import { Badge } from "@/components/ui/badge";
import { PRIORITY_OPTIONS } from "@/features/events/constants";
import { EventRecord } from "@/features/events/types";
import { groupEventsByDate, sortEventsByTime } from "@/features/events/utils";

interface PublicCalendarViewProps {
  events: EventRecord[];
}

export function PublicCalendarView({ events }: PublicCalendarViewProps) {
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(new Date());

  const eventsByDate = useMemo(() => groupEventsByDate(events), [events]);

  const selectedDateEvents = useMemo(() => {
    const key = format(selectedDate, "yyyy-MM-dd");
    return sortEventsByTime(eventsByDate.get(key) ?? []);
  }, [eventsByDate, selectedDate]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">
      <div className="mb-6 rounded-2xl border border-brand-100 bg-white p-5 shadow-soft">
        <h1 className="text-2xl font-semibold text-brand-950">
          Lịch trình công việc Mr Dũng
        </h1>
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <p className="text-sm font-semibold text-slate-800">Ghi chú màu ưu tiên</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PRIORITY_OPTIONS.map((priority) => (
            <Badge
              key={priority.value}
              style={{ backgroundColor: `${priority.color}20`, color: priority.color }}
            >
              {priority.label}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        <MonthCalendar
          month={month}
          selectedDate={selectedDate}
          onMonthChange={setMonth}
          onSelectedDateChange={setSelectedDate}
          eventsByDate={eventsByDate}
        />
        <DayEventsPanel selectedDate={selectedDate} events={selectedDateEvents} />
      </div>
    </main>
  );
}
