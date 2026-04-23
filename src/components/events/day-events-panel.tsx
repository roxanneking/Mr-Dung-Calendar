"use client";

import { useMemo, useState } from "react";
import { differenceInCalendarDays, format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  MapPin,
  NotebookText,
  Timer,
  User,
  CircleCheckBig
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { getPriorityMeta } from "@/features/events/constants";
import { EventRecord } from "@/features/events/types";
import { EventAttachmentRecord } from "@/features/attachments/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DayEventsPanelProps {
  selectedDate: Date;
  events: EventRecord[];
  attachmentsByEvent?: Map<string, EventAttachmentRecord[]>;
  mode?: "boss" | "admin";
  onPrevDate?: () => void;
  onNextDate?: () => void;
  onEditEvent?: (event: EventRecord) => void;
  onDeleteEvent?: (event: EventRecord) => void;
}

export function DayEventsPanel({
  selectedDate,
  events,
  attachmentsByEvent,
  mode = "boss",
  onPrevDate,
  onNextDate,
  onEditEvent,
  onDeleteEvent
}: DayEventsPanelProps) {
  const [detailEvent, setDetailEvent] = useState<EventRecord | null>(null);

  const dayNote = useMemo(() => {
    const diff = differenceInCalendarDays(selectedDate, new Date());
    if (diff === 0) {
      return "Hôm nay";
    }
    if (diff === 1) {
      return "Ngày mai";
    }
    if (diff === -1) {
      return "Hôm qua";
    }
    return null;
  }, [selectedDate]);

  function buildAttachmentUrl(filePath: string) {
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!baseUrl) {
      return "#";
    }
    return `${baseUrl}/storage/v1/object/public/event-documents/${encodeURIComponent(filePath).replace(/%2F/g, "/")}`;
  }

  const detailAttachments = detailEvent
    ? attachmentsByEvent?.get(detailEvent.id) ?? []
    : [];
  const selectedDateLabel = format(selectedDate, "EEEE, dd/MM/yyyy", { locale: vi });

  return (
    <section className="rounded-2xl border border-brand-100 bg-white p-5 shadow-soft">
      <div className="mb-2 flex items-center justify-between border-b border-brand-100 pb-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Tóm tắt công việc
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
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-semibold text-brand-900">{selectedDateLabel}</h3>
        {dayNote && (
          <Badge className="bg-brand-100 text-brand-900">
            {dayNote}
          </Badge>
        )}
      </div>

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
                    backgroundColor: priority.color,
                    color: "#ffffff"
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
                {event.owner && (
                  <p className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {event.owner}
                  </p>
                )}
                {event.description && (
                  <p className="flex items-start gap-1">
                    <NotebookText className="mt-0.5 h-4 w-4" />
                    <span>{event.description}</span>
                  </p>
                )}
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setDetailEvent(event)}
                  className="text-sm font-semibold text-brand-700 hover:text-brand-900"
                >
                  Chi tiết
                </button>
              </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={detailEvent !== null}
        title="Chi tiết lịch trình"
        onClose={() => setDetailEvent(null)}
      >
        {detailEvent && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <h4 className="text-2xl font-semibold text-brand-950">{detailEvent.title}</h4>
              <Badge
                style={{
                  backgroundColor: getPriorityMeta(detailEvent.category).color,
                  color: "#ffffff"
                }}
              >
                {getPriorityMeta(detailEvent.category).label}
              </Badge>
            </div>

            <div className="space-y-2 text-slate-700">
              <p className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-brand-700" />
                <span>
                  {format(new Date(detailEvent.date), "dd/MM/yyyy")} | {detailEvent.start_time.slice(0, 5)} - {detailEvent.end_time.slice(0, 5)}
                </span>
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-700" />
                <span>{detailEvent.location || "Không có"}</span>
              </p>
              <p className="flex items-center gap-2">
                <User className="h-4 w-4 text-brand-700" />
                <span>{detailEvent.owner || "Không có"}</span>
              </p>
              <p className="flex items-start gap-2">
                <NotebookText className="mt-1 h-4 w-4 text-brand-700" />
                <span>{detailEvent.description || "Không có"}</span>
              </p>
              <p className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-brand-700" />
                <span>{detailEvent.status || "Không có"}</span>
              </p>
              <p className="flex items-center gap-2">
                <CircleCheckBig className="h-4 w-4 text-brand-700" />
                <span>{detailEvent.result || "Không có"}</span>
              </p>
              <p className="flex items-start gap-2">
                <FileText className="mt-1 h-4 w-4 text-brand-700" />
                <span>{detailEvent.notes || "Không có"}</span>
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700">Tệp đính kèm</p>
              {detailAttachments.length === 0 ? (
                <p className="text-sm text-slate-500">Không có</p>
              ) : (
                <ul className="space-y-1">
                  {detailAttachments.map((attachment) => (
                    <li key={attachment.id}>
                      <a
                        href={buildAttachmentUrl(attachment.file_path)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-brand-700 underline hover:text-brand-900"
                      >
                        {attachment.file_name}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {mode === "admin" && (
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onEditEvent?.(detailEvent);
                    setDetailEvent(null);
                  }}
                >
                  Sửa
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => {
                    onDeleteEvent?.(detailEvent);
                    setDetailEvent(null);
                  }}
                >
                  Xóa
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </section>
  );
}
