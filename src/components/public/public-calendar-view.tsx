"use client";

import { useMemo, useState } from "react";
import { addDays, format, startOfMonth, subDays } from "date-fns";
import { MonthCalendar } from "@/components/calendar/month-calendar";
import { DayEventsPanel } from "@/components/events/day-events-panel";
import { Badge } from "@/components/ui/badge";
import { EventAttachmentRecord } from "@/features/attachments/types";
import { PRIORITY_OPTIONS } from "@/features/events/constants";
import { EventRecord } from "@/features/events/types";
import { groupEventsByDate, sortEventsByTime } from "@/features/events/utils";

interface PublicCalendarViewProps {
  events: EventRecord[];
  attachmentsByEvent?: Map<string, EventAttachmentRecord[]>;
}

export function PublicCalendarView({ events, attachmentsByEvent }: PublicCalendarViewProps) {
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
          Lịch Trình Công Việc Mr Dũng
        </h1>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
        <span className="font-medium">Ghi chú:</span>
        {PRIORITY_OPTIONS.map((priority) => (
          <Badge
            key={priority.value}
            style={{ backgroundColor: priority.color, color: "#ffffff" }}
          >
            {priority.label}
          </Badge>
        ))}
      </div>

      <div className="mb-6">
        <DayEventsPanel
          selectedDate={selectedDate}
          events={selectedDateEvents}
          attachmentsByEvent={attachmentsByEvent}
          mode="boss"
          onPrevDate={() => setSelectedDate((current) => subDays(current, 1))}
          onNextDate={() => setSelectedDate((current) => addDays(current, 1))}
        />
      </div>

      <div>
        <MonthCalendar
          month={month}
          selectedDate={selectedDate}
          onMonthChange={setMonth}
          onSelectedDateChange={setSelectedDate}
          eventsByDate={eventsByDate}
        />
      </div>
    </main>
  );
}
