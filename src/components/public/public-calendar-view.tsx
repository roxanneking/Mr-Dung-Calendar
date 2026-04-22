"use client";

import { useMemo, useState } from "react";
import { format, startOfMonth } from "date-fns";
import { MonthCalendar } from "@/components/calendar/month-calendar";
import { DayEventsPanel } from "@/components/events/day-events-panel";
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
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          Lịch trình công việc
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-brand-950">
          Lịch làm việc của sếp
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Mở website là xem lịch ngay, không cần đăng nhập.
        </p>
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
