"use client";

import { useMemo, useState } from "react";
import { addDays, format, startOfMonth, subDays } from "date-fns";
import { MonthCalendar } from "@/components/calendar/month-calendar";
import { DayEventsPanel } from "@/components/events/day-events-panel";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { PRIORITY_OPTIONS } from "@/features/events/constants";
import { EventAttachmentRecord } from "@/features/attachments/types";
import { EventRecord } from "@/features/events/types";
import { groupEventsByDate, sortEventsByTime } from "@/features/events/utils";

interface PublicCalendarViewProps {
  events: EventRecord[];
  attachments: EventAttachmentRecord[];
}

export function PublicCalendarView({ events, attachments }: PublicCalendarViewProps) {
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(new Date());

  const eventsByDate = useMemo(() => groupEventsByDate(events), [events]);

  const selectedDateEvents = useMemo(() => {
    const key = format(selectedDate, "yyyy-MM-dd");
    return sortEventsByTime(eventsByDate.get(key) ?? []);
  }, [eventsByDate, selectedDate]);
  const attachmentsByEvent = useMemo(() => {
    const grouped = new Map<string, EventAttachmentRecord[]>();
    attachments.forEach((attachment) => {
      const bucket = grouped.get(attachment.event_id) ?? [];
      bucket.push(attachment);
      grouped.set(attachment.event_id, bucket);
    });
    return grouped;
  }, [attachments]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">
      <Card className="mb-6 rounded-2xl border border-brand-100 bg-white py-0 shadow-soft ring-0">
        <CardHeader className="px-5 pt-5 pb-3">
          <CardTitle className="text-2xl font-semibold text-brand-950">
            Lịch Trình Công Việc Mr Dũng
          </CardTitle>
          <CardDescription className="text-sm text-slate-600">
            Theo dõi nhanh lịch theo ngày và theo tháng.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span className="font-medium">Mức độ:</span>
            {PRIORITY_OPTIONS.map((priority) => (
              <Badge
                key={priority.value}
                style={{ backgroundColor: priority.color, color: "#ffffff" }}
              >
                {priority.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <DayEventsPanel
          selectedDate={selectedDate}
          events={selectedDateEvents}
          onPrevDate={() => setSelectedDate((current) => subDays(current, 1))}
          onNextDate={() => setSelectedDate((current) => addDays(current, 1))}
          attachmentsByEvent={attachmentsByEvent}
        />
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
