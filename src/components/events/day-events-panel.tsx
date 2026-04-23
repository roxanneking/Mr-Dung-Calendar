"use client";

import { useMemo, useState } from "react";
import { addDays, format, isSameDay, subDays } from "date-fns";
import { vi } from "date-fns/locale";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleCheckBig,
  Clock3,
  ExternalLink,
  FileText,
  MapPin,
  NotebookText,
  Timer,
  User
} from "lucide-react";
import { getPriorityMeta } from "@/features/events/constants";
import { EventRecord } from "@/features/events/types";
import { EventAttachmentRecord } from "@/features/attachments/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent
} from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/supabase/client";

interface DayEventsPanelProps {
  selectedDate: Date;
  events: EventRecord[];
  onPrevDate?: () => void;
  onNextDate?: () => void;
  mode?: "boss" | "admin";
  onEditEvent?: (event: EventRecord) => void;
  onDeleteEvent?: (event: EventRecord) => void;
  attachmentsByEvent?: Map<string, EventAttachmentRecord[]>;
}

export function DayEventsPanel({
  selectedDate,
  events,
  onPrevDate,
  onNextDate,
  mode = "boss",
  onEditEvent,
  onDeleteEvent,
  attachmentsByEvent
}: DayEventsPanelProps) {
  const [detailEvent, setDetailEvent] = useState<EventRecord | null>(null);
  const supabase = createClient();
  const marker = useMemo(() => {
    const today = new Date();
    if (isSameDay(selectedDate, today)) {
      return "Hôm nay";
    }
    if (isSameDay(selectedDate, addDays(today, 1))) {
      return "Ngày mai";
    }
    if (isSameDay(selectedDate, subDays(today, 1))) {
      return "Hôm qua";
    }
    return null;
  }, [selectedDate]);
  const detailAttachments = useMemo(() => {
    if (!detailEvent) {
      return [];
    }
    return attachmentsByEvent?.get(detailEvent.id) ?? [];
  }, [attachmentsByEvent, detailEvent]);

  return (
    <Card className="rounded-2xl border border-brand-100 bg-white py-0 shadow-soft ring-0">
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold tracking-wide uppercase text-slate-500">
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
      </div>
      <Separator className="bg-brand-100" />

      <CardContent className="space-y-3 px-5 pt-2 pb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-brand-900">
            {format(selectedDate, "EEEE, dd/MM/yyyy", { locale: vi })}
          </h3>
          {marker && (
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-900">
              {marker}
            </span>
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
                <li key={event.id}>
                  <Card className="rounded-xl border border-slate-100 bg-white py-0 ring-0 transition hover:shadow-sm">
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
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
                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="text-sm font-semibold text-brand-800 hover:text-brand-900"
                          onClick={() => setDetailEvent(event)}
                        >
                          Chi tiết
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
      
      <Modal
        open={detailEvent !== null}
        onClose={() => setDetailEvent(null)}
        title="Chi tiết lịch trình"
      >
        {detailEvent && (
          <div className="space-y-4 text-sm text-slate-700">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="text-xl font-semibold text-slate-900">{detailEvent.title}</p>
              <Badge
                style={{
                  backgroundColor: getPriorityMeta(detailEvent.category).color,
                  color: "#ffffff"
                }}
              >
                {getPriorityMeta(detailEvent.category).label}
              </Badge>
            </div>
            <div className="grid gap-2">
              <p className="flex items-start gap-2">
                <CalendarDays className="mt-0.5 h-4 w-4 text-brand-700" />
                <span>
                  <span className="font-semibold">Thời gian:</span>{" "}
                  {format(new Date(detailEvent.date), "dd/MM/yyyy")} |{" "}
                  {detailEvent.start_time.slice(0, 5)} - {detailEvent.end_time.slice(0, 5)}
                </span>
              </p>
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-brand-700" />
                <span>
                  <span className="font-semibold">Địa điểm:</span>{" "}
                  {detailEvent.location || "Không có"}
                </span>
              </p>
              <p className="flex items-start gap-2">
                <User className="mt-0.5 h-4 w-4 text-brand-700" />
                <span>
                  <span className="font-semibold">Nhân sự:</span>{" "}
                  {detailEvent.owner || "Không có"}
                </span>
              </p>
              <p className="flex items-start gap-2">
                <NotebookText className="mt-0.5 h-4 w-4 text-brand-700" />
                <span>
                  <span className="font-semibold">Chi tiết công việc:</span>{" "}
                  {detailEvent.description || "Không có"}
                </span>
              </p>
              <p className="flex items-start gap-2">
                <Clock3 className="mt-0.5 h-4 w-4 text-brand-700" />
                <span>
                  <span className="font-semibold">Trạng thái:</span>{" "}
                  {detailEvent.status || "Không có"}
                </span>
              </p>
              <p className="flex items-start gap-2">
                <CircleCheckBig className="mt-0.5 h-4 w-4 text-brand-700" />
                <span>
                  <span className="font-semibold">Kết quả:</span>{" "}
                  {detailEvent.result || "Không có"}
                </span>
              </p>
              <p className="flex items-start gap-2">
                <NotebookText className="mt-0.5 h-4 w-4 text-brand-700" />
                <span>
                  <span className="font-semibold">Ghi chú:</span>{" "}
                  {detailEvent.notes || "Không có"}
                </span>
              </p>
            </div>
            <div className="space-y-2">
              <p className="flex items-center gap-2 font-semibold text-slate-900">
                <FileText className="h-4 w-4 text-brand-700" />
                Tệp đính kèm
              </p>
              {detailAttachments.length === 0 ? (
                <p className="text-sm text-slate-500">Không có tệp đính kèm.</p>
              ) : (
                <ul className="space-y-1">
                  {detailAttachments.map((attachment) => {
                    const publicUrl = supabase.storage
                      .from("event-documents")
                      .getPublicUrl(attachment.file_path).data.publicUrl;
                    return (
                      <li key={attachment.id}>
                        <a
                          href={publicUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-900"
                        >
                          {attachment.file_name}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            {mode === "admin" && (
              <div className="mt-4 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onEditEvent?.(detailEvent)}
                >
                  Sửa
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => onDeleteEvent?.(detailEvent)}
                >
                  Xóa
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Card>
  );
}
