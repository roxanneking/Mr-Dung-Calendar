"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, format, startOfMonth, subDays } from "date-fns";

import { EventFormModal } from "@/components/admin/event-form-modal";
import { EventAttachmentRecord } from "@/features/attachments/types";
import { MonthCalendar } from "@/components/calendar/month-calendar";
import { DayEventsPanel } from "@/components/events/day-events-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/supabase/client";
import { PRIORITY_OPTIONS, getPriorityMeta } from "@/features/events/constants";
import { EventFormInput, EventRecord } from "@/features/events/types";
import {
  getWeekOfMonthLabel,
  groupEventsByDate,
  groupEventsByWeek,
  sortEventsByTime
} from "@/features/events/utils";
import { useToast } from "@/hooks/use-toast";

interface AdminDashboardProps {
  initialEvents: EventRecord[];
}

type ModalState =
  | { open: false; mode: "create" | "edit"; event?: undefined }
  | { open: true; mode: "create" | "edit"; event?: EventRecord };

export function AdminDashboard({ initialEvents }: AdminDashboardProps) {
  const [events, setEvents] = useState<EventRecord[]>(initialEvents);
  const [attachmentsByEvent, setAttachmentsByEvent] = useState<
    Map<string, EventAttachmentRecord[]>
  >(new Map());
  const [modal, setModal] = useState<ModalState>({ open: false, mode: "create" });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"overview" | "detail">("overview");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [detailMonth, setDetailMonth] = useState(format(new Date(), "yyyy-MM"));
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const { notify } = useToast();
  const supabase = createClient();

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) =>
      a.date === b.date
        ? a.start_time.localeCompare(b.start_time)
        : a.date.localeCompare(b.date)
    );
  }, [events]);

  const eventsByDate = useMemo(() => groupEventsByDate(sortedEvents), [sortedEvents]);

  const selectedDateEvents = useMemo(() => {
    const key = format(selectedDate, "yyyy-MM-dd");
    return sortEventsByTime(eventsByDate.get(key) ?? []);
  }, [eventsByDate, selectedDate]);

  const monthEvents = useMemo(() => {
    if (!detailMonth) {
      return sortedEvents;
    }
    return sortedEvents.filter((event) => event.date.startsWith(detailMonth));
  }, [detailMonth, sortedEvents]);

  const filteredDetailEvents = useMemo(() => {
    return monthEvents.filter((event) => {
      if (fromDate && event.date < fromDate) {
        return false;
      }
      if (toDate && event.date > toDate) {
        return false;
      }
      return true;
    });
  }, [fromDate, monthEvents, toDate]);

  const weekEvents = useMemo(
    () => groupEventsByWeek(filteredDetailEvents),
    [filteredDetailEvents]
  );

  useEffect(() => {
    void refreshEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshEvents() {
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });
    setLoading(false);

    if (error) {
      notify(`Không thể tải lại lịch: ${error.message}`, "error");
      return;
    }
    const nextEvents = (data as EventRecord[]) ?? [];
    setEvents(nextEvents);

    if (nextEvents.length === 0) {
      setAttachmentsByEvent(new Map());
      setLoading(false);
      return;
    }

    const eventIds = nextEvents.map((event) => event.id);
    const { data: attachments, error: attachmentError } = await supabase
      .from("event_attachments")
      .select("*")
      .in("event_id", eventIds)
      .order("created_at", { ascending: true });

    if (attachmentError) {
      notify(`Không thể tải danh sách tài liệu: ${attachmentError.message}`, "error");
      setLoading(false);
      return;
    }

    const grouped = new Map<string, EventAttachmentRecord[]>();
    (attachments as EventAttachmentRecord[]).forEach((attachment) => {
      const bucket = grouped.get(attachment.event_id) ?? [];
      bucket.push(attachment);
      grouped.set(attachment.event_id, bucket);
    });
    setAttachmentsByEvent(grouped);
    setLoading(false);
  }

  async function uploadAttachments(eventId: string, files: File[]) {
    if (files.length === 0) {
      return;
    }

    for (const file of files) {
      const path = `${eventId}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("event-documents")
        .upload(path, file, { upsert: true });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { error: insertError } = await supabase.from("event_attachments").upsert(
        {
          event_id: eventId,
          file_name: file.name,
          file_path: path,
          file_size: file.size,
          mime_type: file.type
        },
        { onConflict: "event_id,file_name" }
      );

      if (insertError) {
        throw new Error(insertError.message);
      }
    }
  }

  async function removeAttachments(attachmentIds: string[]) {
    if (attachmentIds.length === 0) {
      return;
    }

    const { data, error } = await supabase
      .from("event_attachments")
      .select("id,file_path")
      .in("id", attachmentIds);

    if (error) {
      throw new Error(error.message);
    }

    const paths = (data ?? []).map((item) => item.file_path);
    if (paths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("event-documents")
        .remove(paths);
      if (storageError) {
        throw new Error(storageError.message);
      }
    }

    const { error: deleteError } = await supabase
      .from("event_attachments")
      .delete()
      .in("id", attachmentIds);

    if (deleteError) {
      throw new Error(deleteError.message);
    }
  }

  async function saveEvent(
    values: EventFormInput,
    files: File[],
    deletedAttachmentIds: string[]
  ) {
    setSubmitting(true);
    const payload = {
      ...values,
      location: values.location || null,
      description: values.description || null,
      owner: values.owner || null,
      deadline: values.deadline || null,
      status: values.status || null,
      result: values.result || null,
      notes: values.notes || null,
      start_time: `${values.start_time}:00`,
      end_time: `${values.end_time}:00`
    };

    const query =
      modal.mode === "create"
        ? supabase.from("events").insert(payload).select("*").single()
        : supabase
            .from("events")
            .update(payload)
            .eq("id", modal.event?.id ?? "")
            .select("*")
            .single();

    const { data, error } = await query;

    if (error) {
      setSubmitting(false);
      if (error.message.includes("row-level security")) {
        notify(
          "Bạn chưa được map vào bảng admin_users nên chưa có quyền thêm/sửa/xóa.",
          "error"
        );
        return;
      }
      notify(`Lưu lịch thất bại: ${error.message}`, "error");
      return;
    }

    const eventId = (data as EventRecord).id;
    try {
      await removeAttachments(deletedAttachmentIds);
      await uploadAttachments(eventId, files);
    } catch (attachmentError) {
      const message =
        attachmentError instanceof Error ? attachmentError.message : "Lỗi tải tài liệu";
      setSubmitting(false);
      notify(`Lưu lịch thất bại: ${message}`, "error");
      return;
    }

    setSubmitting(false);
    notify(
      modal.mode === "create" ? "Đã thêm lịch thành công." : "Đã cập nhật lịch thành công.",
      "success"
    );
    setModal({ open: false, mode: "create" });
    await refreshEvents();
  }

  async function deleteEvent(event: EventRecord) {
    const ok = window.confirm(`Xóa lịch "${event.title}"?`);
    if (!ok) {
      return;
    }

    const { error } = await supabase.from("events").delete().eq("id", event.id);
    if (error) {
      notify(`Xóa lịch thất bại: ${error.message}`, "error");
      return;
    }
    notify("Đã xóa lịch.", "success");
    await refreshEvents();
  }

  async function copyPublicLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/boss`);
    notify("Đã copy link gửi sếp.", "success");
  }

  async function exportToExcel() {
    if (filteredDetailEvents.length === 0) {
      notify("Không có dữ liệu để xuất.", "info");
      return;
    }

    const XLSX = await import("xlsx");
    const rows = filteredDetailEvents.map((event) => ({
      Tuan: getWeekOfMonthLabel(event.date),
      ThoiGian: `${format(new Date(event.date), "dd/MM/yyyy")} ${event.start_time.slice(0, 5)}-${event.end_time.slice(0, 5)}`,
      NoiDungCongViec: event.title,
      ChiTietCongViec: event.description ?? "",
      NguoiPhuTrach: event.owner ?? "",
      Deadline: event.deadline ? format(new Date(event.deadline), "dd/MM/yyyy") : "",
      DiaDiem: event.location ?? "",
      TrangThai: event.status ?? "",
      KetQua: event.result ?? "",
      GhiChu: event.notes ?? ""
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "LichChiTiet");
    XLSX.writeFile(workbook, `lich-chi-tiet-${format(new Date(), "yyyyMMdd-HHmm")}.xlsx`);
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-brand-100 bg-white p-5 shadow-soft md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            Xin chào Mrs Hà
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-brand-950">
            Quản Lý Lịch Trình Mr PKD
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Gửi sếp theo dõi lịch trình:{" "}
            <button
              type="button"
              onClick={copyPublicLink}
              className="font-semibold text-brand-700 underline hover:text-brand-900"
            >
              Sao chép
            </button>
            {" | "}
            <a
              href="/boss"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-brand-700 underline hover:text-brand-900"
            >
              Mở trực tiếp
            </a>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={viewMode === "overview" ? "primary" : "outline"}
            onClick={() => setViewMode("overview")}
          >
            Tổng quan
          </Button>
          <Button
            variant={viewMode === "detail" ? "primary" : "outline"}
            onClick={() => setViewMode("detail")}
          >
            Chi tiết
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
        <span className="font-medium">Ghi chú:</span>
        <div className="flex flex-wrap gap-2">
          {PRIORITY_OPTIONS.map((priority) => (
            <Badge
              key={priority.value}
              style={{ backgroundColor: priority.color, color: "#ffffff" }}
            >
              {priority.label}
            </Badge>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-brand-100 bg-white p-5 text-sm text-slate-600 shadow-soft">
          Đang tải dữ liệu...
        </div>
      ) : sortedEvents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50 p-5 text-sm text-brand-900">
          Chưa có lịch trình nào. Nhấn &quot;Thêm lịch&quot; để bắt đầu.
        </div>
      ) : viewMode === "overview" ? (
        <>
          <div className="mb-6">
            <DayEventsPanel
              selectedDate={selectedDate}
              events={selectedDateEvents}
              attachmentsByEvent={attachmentsByEvent}
              mode="admin"
              onPrevDate={() => setSelectedDate((current) => subDays(current, 1))}
              onNextDate={() => setSelectedDate((current) => addDays(current, 1))}
              onEditEvent={(event) => setModal({ open: true, mode: "edit", event })}
              onDeleteEvent={deleteEvent}
            />
          </div>
          <MonthCalendar
            month={month}
            selectedDate={selectedDate}
            onMonthChange={setMonth}
            onSelectedDateChange={setSelectedDate}
            eventsByDate={eventsByDate}
          />
        </>
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 md:flex-row md:items-end">
            <div className="w-full md:w-auto">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tháng xem chi tiết
              </p>
              <input
                type="month"
                value={detailMonth}
                onChange={(event) => setDetailMonth(event.target.value)}
                className="h-10 w-full rounded-xl border border-brand-200 px-3 text-sm md:w-auto"
              />
            </div>
            <div className="w-full md:w-auto">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Từ ngày
              </p>
              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="h-10 w-full rounded-xl border border-brand-200 px-3 text-sm md:w-auto"
              />
            </div>
            <div className="w-full md:w-auto">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Đến ngày
              </p>
              <input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="h-10 w-full rounded-xl border border-brand-200 px-3 text-sm md:w-auto"
              />
            </div>
            <div className="flex w-full gap-2 md:ml-auto md:w-auto">
              <Button className="flex-1 md:flex-none" variant="outline" onClick={refreshEvents} disabled={loading}>
                {loading ? "Đang tải..." : "Làm mới"}
              </Button>
              <Button className="flex-1 md:flex-none" variant="outline" onClick={exportToExcel}>
                Xuất Excel
              </Button>
              <Button className="flex-1 md:flex-none" variant="primary" onClick={() => setModal({ open: true, mode: "create" })}>
                Thêm lịch
              </Button>
            </div>
          </div>

          {filteredDetailEvents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50 p-5 text-sm text-brand-900">
              Không có lịch trình trong tháng đã chọn.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-3 md:hidden">
                {["W1", "W2", "W3", "W4", "W5"].map((week) => (
                  <div key={week} className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="mb-2 text-sm font-semibold text-brand-900">{week}</p>
                    <div className="space-y-2">
                      {(weekEvents.get(week) ?? []).map((event) => {
                        const priority = getPriorityMeta(event.category);
                        return (
                          <div key={event.id} className="rounded-lg border border-brand-100 bg-white p-3">
                            <div className="mb-1 flex items-start justify-between gap-2">
                              <p className="font-semibold text-slate-900">{event.title}</p>
                              <Badge
                                style={{
                                  backgroundColor: `${priority.color}20`,
                                  color: priority.color
                                }}
                              >
                                {priority.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-600">
                              {format(new Date(event.date), "dd/MM/yyyy")} | {event.start_time.slice(0, 5)} - {event.end_time.slice(0, 5)}
                            </p>
                            <div className="mt-2 flex gap-2">
                              <Button
                                className="flex-1"
                                variant="outline"
                                onClick={() => setModal({ open: true, mode: "edit", event })}
                              >
                                Sửa
                              </Button>
                              <Button className="flex-1" variant="danger" onClick={() => deleteEvent(event)}>
                                Xóa
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto rounded-2xl border border-brand-100 bg-white shadow-soft md:block">
                <table className="w-full min-w-[1350px] border-collapse">
                  <thead>
                    <tr className="bg-brand-50 text-left text-xs uppercase tracking-wide text-brand-800">
                      <th className="px-4 py-3">Tuần</th>
                      <th className="px-4 py-3">Giờ</th>
                      <th className="px-4 py-3">Nội dung công việc</th>
                      <th className="px-4 py-3">Chi tiết công việc</th>
                      <th className="px-4 py-3">Người phụ trách</th>
                      <th className="px-4 py-3">Deadline</th>
                      <th className="px-4 py-3">Địa điểm</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3">Kết quả</th>
                      <th className="px-4 py-3">Ghi chú</th>
                      <th className="px-4 py-3">Tài liệu</th>
                      <th className="px-4 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {["W1", "W2", "W3", "W4", "W5"].map((week) =>
                      (weekEvents.get(week) ?? []).map((event) => {
                        return (
                          <tr key={event.id} className="border-t border-slate-100 align-top">
                            <td className="px-4 py-3 text-sm text-slate-700">{week}</td>
                            <td className="px-4 py-3 text-sm text-slate-700">
                              {format(new Date(event.date), "dd/MM/yyyy")} - {event.start_time.slice(0, 5)} - {event.end_time.slice(0, 5)}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-900">{event.title}</td>
                            <td className="px-4 py-3 text-sm text-slate-700">{event.description ?? ""}</td>
                            <td className="px-4 py-3 text-sm text-slate-700">{event.owner ?? ""}</td>
                            <td className="px-4 py-3 text-sm text-slate-700">
                              {event.deadline ? format(new Date(event.deadline), "dd/MM/yyyy") : ""}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-700">{event.location ?? ""}</td>
                            <td className="px-4 py-3 text-sm text-slate-700">{event.status ?? ""}</td>
                            <td className="px-4 py-3 text-sm text-slate-700">{event.result ?? ""}</td>
                            <td className="px-4 py-3 text-sm text-slate-700">{event.notes ?? ""}</td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-slate-700">
                                {(attachmentsByEvent.get(event.id) ?? []).length} file
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setModal({ open: true, mode: "edit", event })}
                                >
                                  Sửa
                                </Button>
                                <Button variant="danger" onClick={() => deleteEvent(event)}>
                                  Xóa
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <EventFormModal
        open={modal.open}
        mode={modal.mode}
        initialEvent={modal.event}
        initialAttachments={
          modal.event ? attachmentsByEvent.get(modal.event.id) ?? [] : []
        }
        onSubmit={saveEvent}
        onClose={() => setModal({ open: false, mode: "create" })}
        submitting={submitting}
      />
    </main>
  );
}
