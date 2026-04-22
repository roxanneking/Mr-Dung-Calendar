"use client";

import { format } from "date-fns";
import { ChevronLeft, ChevronRight, MapPin, NotebookText, Timer } from "lucide-react";
import { getPriorityMeta } from "@/features/events/constants";
import { EventRecord } from "@/features/events/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DayEventsPanelProps {
  selectedDate: Date;
  events: EventRecord[];
  onPrevDate?: () => void;
  onNextDate?: () => void;
}

export function DayEventsPanel({
  selectedDate,
  events,
  onPrevDate,
  onNextDate
}: DayEventsPanelProps) {
  return (
    <section className="rounded-2xl border border-brand-100 bg-white p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between border-b border-brand-100 pb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Chi tiết trong ngày
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="h-8 px-2" onClick={onPrevDate}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" className="h-8 px-2" onClick={onNextDate}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <h3 className="mb-4 text-lg font-semibold text-brand-900">
        {format(selectedDate, "EEEE, dd/MM/yyyy")}
      </h3>

      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
          Chưa có lịch trình cho ngày này.
        </div>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => {
            const priority = getPriorityMeta(event.category);
            return (
              <li
                key={event.id}
                className="rounded-xl border border-slate-100 bg-white p-4"
              >
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{event.title}</p>
                  <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                    <Timer className="h-4 w-4" />
                    {event.start_time.slice(0, 5)} - {event.end_time.slice(0, 5)}
                  </p>
                </div>
                <Badge
                  style={{
                    backgroundColor: `${priority.color}20`,
                    color: priority.color
                  }}
                >
                  {priority.label}
                </Badge>
              </div>

              <div className="space-y-1 text-sm text-slate-600">
                {event.location && (
                  <p className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {event.location}
                  </p>
                )}
                {event.description && (
                  <p className="flex items-start gap-1">
                    <NotebookText className="mt-0.5 h-4 w-4" />
                    <span>{event.description}</span>
                  </p>
                )}
              </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
