"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, format, startOfMonth, subDays } from "date-fns";
import {
  ArrowUpDown,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  CircleCheckBig,
  ClipboardList,
  FileText,
  MapPin,
  RefreshCcw,
  User
} from "lucide-react";

import { EventFormModal } from "@/components/admin/event-form-modal";
import { EventAttachmentRecord } from "@/features/attachments/types";
import { MonthCalendar } from "@/components/calendar/month-calendar";
import { DayEventsPanel } from "@/components/events/day-events-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { createClient } from "@/supabase/client";
import { PRIORITY_OPTIONS, getPriorityMeta } from "@/features/events/constants";
import { EventFormInput, EventRecord } from "@/features/events/types";
import { groupEventsByDate, sortEventsByTime } from "@/features/events/utils";
import { useToast } from "@/hooks/use-toast";

interface AdminDashboardProps {
  initialEvents: EventRecord[];
}

type ModalState =
  | { open: false; mode: "create" | "edit"; event?: undefined }
  | { open: true; mode: "create" | "edit"; event?: EventRecord };

type DetailSortKey =
  | "time"
  | "title"
  | "description"
  | "owner"
  | "deadline"
  | "location"
  | "status"
  | "result"
  | "notes";

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
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailEvent, setDetailEvent] = useState<EventRecord | null>(null);
  const [detailSort, setDetailSort] = useState<{
    key: DetailSortKey;
    direction: "asc" | "desc";
  }>({ key: "time", direction: "asc" });
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

  const allDetailSelected =
    filteredDetailEvents.length > 0 &&
    filteredDetailEvents.every((event) => selectedIds.has(event.id));

  const sortedDetailEvents = useMemo(() => {
    const eventsToSort = [...filteredDetailEvents];
    const getSortValue = (event: EventRecord) => {
      switch (detailSort.key) {
        case "time":
          return `${event.date} ${event.start_time}`;
        case "title":
          return event.title;
        case "description":
          return event.description ?? "";
        case "owner":
          return event.owner ?? "";
        case "deadline":
          return event.deadline ?? "";
        case "location":
          return event.location ?? "";
        case "status":
          return event.status ?? "";
        case "result":
          return event.result ?? "";
        case "notes":
          return event.notes ?? "";
        default:
          return "";
      }
    };

    eventsToSort.sort((a, b) => {
      const left = getSortValue(a).toLowerCase();
      const right = getSortValue(b).toLowerCase();
      const compare = left.localeCompare(right);
      return detailSort.direction === "asc" ? compare : -compare;
    });
    return eventsToSort;
  }, [detailSort, filteredDetailEvents]);

  useEffect(() => {
    void refreshEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setSelectedIds((prev) => {
      const allowedIds = new Set(filteredDetailEvents.map((event) => event.id));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (allowedIds.has(id)) {
          next.add(id);
        }
      });
      return next;
    });
  }, [filteredDetailEvents]);

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

  async function exportSelectedToExcel() {
    const selectedEvents = filteredDetailEvents.filter((event) => selectedIds.has(event.id));
    if (selectedEvents.length === 0) {
      notify("Chưa chọn lịch trình để xuất.", "info");
      return;
    }

    const XLSX = await import("xlsx");
    const rows = selectedEvents.map((event) => ({
      ThoiGian: `${format(new Date(event.date), "dd/MM/yyyy")} ${event.start_time.slice(0, 5)}-${event.end_time.slice(0, 5)}`,
      NoiDungCongViec: event.title,
      ChiTietCongViec: event.description ?? "",
      NhanSu: event.owner ?? "",
      Deadline: event.deadline ? format(new Date(event.deadline), "dd/MM/yyyy") : "",
      DiaDiem: event.location ?? "",
      TrangThai: event.status ?? "",
      KetQua: event.result ?? "",
      GhiChu: event.notes ?? ""
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "LichDuocChon");
    XLSX.writeFile(workbook, `lich-duoc-chon-${format(new Date(), "yyyyMMdd-HHmm")}.xlsx`);
  }

  async function deleteSelectedEvents() {
    const targetIds = Array.from(selectedIds);
    if (targetIds.length === 0) {
      notify("Chưa chọn lịch trình để xóa.", "info");
      return;
    }
    const ok = window.confirm(`Xóa ${targetIds.length} lịch trình đã chọn?`);
    if (!ok) {
      return;
    }
    const { error } = await supabase.from("events").delete().in("id", targetIds);
    if (error) {
      notify(`Xóa lịch thất bại: ${error.message}`, "error");
      return;
    }
    setSelectedIds(new Set());
    notify("Đã xóa các lịch trình đã chọn.", "success");
    await refreshEvents();
  }

  function toggleEventSelection(eventId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (allDetailSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(filteredDetailEvents.map((event) => event.id)));
  }

  function buildAttachmentUrl(filePath: string) {
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!baseUrl) {
      return "#";
    }
    return `${baseUrl}/storage/v1/object/public/event-documents/${encodeURIComponent(filePath).replace(/%2F/g, "/")}`;
  }

  function toggleDetailSort(key: DetailSortKey) {
    setDetailSort((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc"
        };
      }
      return {
        key,
        direction: "asc"
      };
    });
  }

  function renderSortIcon(key: DetailSortKey) {
    if (detailSort.key !== key) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />;
    }
    if (detailSort.direction === "asc") {
      return <ChevronUp className="h-3.5 w-3.5 text-brand-700" />;
    }
    return <ChevronDown className="h-3.5 w-3.5 text-brand-700" />;
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8 lg:py-8">
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-brand-100 bg-white p-5 shadow-soft md:flex-row md:items-center md:justify-between md:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            Xin chào Mrs Hà
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-brand-950 md:text-3xl">
            Quản Lý Lịch Trình Mr PKD
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Gửi sếp theo dõi lịch trình:{" "}
            <button
              type="button"
              onClick={copyPublicLink}
              className="font-semibold text-brand-700 underline underline-offset-2 transition hover:text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
            >
              Sao chép
            </button>
            {" | "}
            <a
              href="/boss"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-brand-700 underline underline-offset-2 transition hover:text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
            >
              Mở trực tiếp
            </a>
          </p>
        </div>
        <div className="inline-flex w-full flex-wrap gap-2 rounded-xl border border-brand-100 bg-brand-50 p-1 md:w-auto">
          <Button
            className="flex-1 md:flex-none"
            variant={viewMode === "overview" ? "primary" : "outline"}
            onClick={() => setViewMode("overview")}
          >
            Tổng quan
          </Button>
          <Button
            className="flex-1 md:flex-none"
            variant={viewMode === "detail" ? "primary" : "outline"}
            onClick={() => setViewMode("detail")}
          >
            Chi tiết
          </Button>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-brand-100 bg-white p-3 shadow-soft">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-700">Mức ưu tiên:</span>
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
      </div>

      {loading ? (
        <div className="rounded-2xl border border-brand-100 bg-white p-5 text-sm text-slate-600 shadow-soft">
          Đang tải dữ liệu...
        </div>
      ) : sortedEvents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50 p-5 text-sm font-medium text-brand-900">
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
          <div className="mb-4 flex flex-col gap-3 rounded-xl border border-brand-100 bg-white p-4 shadow-soft md:flex-row md:items-end">
            <button
              type="button"
              onClick={refreshEvents}
              disabled={loading}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-brand-200 text-brand-800 transition hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Làm mới"
              title="Làm mới"
            >
              <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <div className="w-full md:w-auto">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tháng xem chi tiết
              </p>
              <input
                type="month"
                value={detailMonth}
                onChange={(event) => setDetailMonth(event.target.value)}
                className="h-10 w-full rounded-xl border border-brand-200 px-3 text-sm shadow-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 md:w-auto"
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
                className="h-10 w-full rounded-xl border border-brand-200 px-3 text-sm shadow-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 md:w-auto"
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
                className="h-10 w-full rounded-xl border border-brand-200 px-3 text-sm shadow-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 md:w-auto"
              />
            </div>
            <div className="flex w-full gap-2 md:ml-auto md:w-auto">
              <Button
                className="flex-1 md:flex-none"
                variant={selectionMode ? "primary" : "outline"}
                onClick={() => {
                  if (selectionMode) {
                    setSelectionMode(false);
                    setSelectedIds(new Set());
                    return;
                  }
                  setSelectionMode(true);
                }}
              >
                {selectionMode ? "Hủy chọn" : "Chọn"}
              </Button>
              <Button className="flex-1 md:flex-none" variant="primary" onClick={() => setModal({ open: true, mode: "create" })}>
                Thêm lịch
              </Button>
            </div>
          </div>

          {selectionMode && (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-brand-100 bg-brand-50 p-3">
              <label className="inline-flex items-center gap-2 rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-sm font-medium text-brand-900">
                <input
                  type="checkbox"
                  checked={allDetailSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-brand-300 text-brand-700 focus:ring-brand-300"
                />
                Chọn tất cả
              </label>
              <span className="text-sm text-slate-600">Đã chọn: {selectedIds.size}</span>
              <Button variant="outline" className="h-9 px-3 md:ml-auto" onClick={exportSelectedToExcel}>
                Xuất Excel đã chọn
              </Button>
              <Button variant="danger" className="h-9 px-3" onClick={deleteSelectedEvents}>
                Xóa đã chọn
              </Button>
            </div>
          )}

          {sortedDetailEvents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50 p-5 text-sm text-brand-900">
              Không có lịch trình trong tháng đã chọn.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-3 md:hidden">
                {sortedDetailEvents.map((event) => {
                  const priority = getPriorityMeta(event.category);
                  return (
                    <div key={event.id} className="rounded-xl border border-brand-100 bg-white p-3 shadow-sm">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <p className="font-semibold text-slate-900">{event.title}</p>
                        <Badge
                          style={{
                            backgroundColor: priority.color,
                            color: "#ffffff"
                          }}
                        >
                          {priority.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600">
                        {format(new Date(event.date), "dd/MM/yyyy")} | {event.start_time.slice(0, 5)} -{" "}
                        {event.end_time.slice(0, 5)}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">Nhân sự: {event.owner ?? "Chưa cập nhật"}</p>
                      <div className="mt-2 flex items-center justify-between">
                        {selectionMode ? (
                          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(event.id)}
                              onChange={() => toggleEventSelection(event.id)}
                              className="h-4 w-4 rounded border-brand-300 text-brand-700 focus:ring-brand-300"
                            />
                            Chọn
                          </label>
                        ) : (
                          <span />
                        )}
                        <button
                          type="button"
                          onClick={() => setDetailEvent(event)}
                          className="rounded-md px-2 py-1 text-sm font-semibold text-brand-700 underline underline-offset-2 transition hover:bg-brand-50 hover:text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
                        >
                          Chi tiết
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden overflow-x-auto rounded-2xl border border-brand-100 bg-white shadow-soft md:block">
                <table className="w-full min-w-[1280px] border-collapse">
                  <thead>
                    <tr className="bg-brand-50 text-left text-xs uppercase tracking-wide text-brand-800">
                      {selectionMode && <th className="w-12 px-3 py-3 text-center">Chọn</th>}
                      <th className="px-4 py-3">
                        <button type="button" className="inline-flex items-center gap-1 rounded px-1 py-0.5 transition hover:text-brand-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200" onClick={() => toggleDetailSort("time")}>
                          Giờ {renderSortIcon("time")}
                        </button>
                      </th>
                      <th className="px-4 py-3">
                        <button type="button" className="inline-flex items-center gap-1 rounded px-1 py-0.5 transition hover:text-brand-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200" onClick={() => toggleDetailSort("title")}>
                          Nội dung công việc {renderSortIcon("title")}
                        </button>
                      </th>
                      <th className="px-4 py-3">
                        <button type="button" className="inline-flex items-center gap-1 rounded px-1 py-0.5 transition hover:text-brand-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200" onClick={() => toggleDetailSort("description")}>
                          Chi tiết công việc {renderSortIcon("description")}
                        </button>
                      </th>
                      <th className="px-4 py-3">
                        <button type="button" className="inline-flex items-center gap-1 rounded px-1 py-0.5 transition hover:text-brand-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200" onClick={() => toggleDetailSort("owner")}>
                          Nhân sự {renderSortIcon("owner")}
                        </button>
                      </th>
                      <th className="px-4 py-3">
                        <button type="button" className="inline-flex items-center gap-1 rounded px-1 py-0.5 transition hover:text-brand-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200" onClick={() => toggleDetailSort("deadline")}>
                          Deadline {renderSortIcon("deadline")}
                        </button>
                      </th>
                      <th className="px-4 py-3">
                        <button type="button" className="inline-flex items-center gap-1 rounded px-1 py-0.5 transition hover:text-brand-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200" onClick={() => toggleDetailSort("location")}>
                          Địa điểm {renderSortIcon("location")}
                        </button>
                      </th>
                      <th className="px-4 py-3">
                        <button type="button" className="inline-flex items-center gap-1 rounded px-1 py-0.5 transition hover:text-brand-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200" onClick={() => toggleDetailSort("status")}>
                          Trạng thái {renderSortIcon("status")}
                        </button>
                      </th>
                      <th className="px-4 py-3">
                        <button type="button" className="inline-flex items-center gap-1 rounded px-1 py-0.5 transition hover:text-brand-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200" onClick={() => toggleDetailSort("result")}>
                          Kết quả {renderSortIcon("result")}
                        </button>
                      </th>
                      <th className="px-4 py-3">
                        <button type="button" className="inline-flex items-center gap-1 rounded px-1 py-0.5 transition hover:text-brand-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200" onClick={() => toggleDetailSort("notes")}>
                          Ghi chú {renderSortIcon("notes")}
                        </button>
                      </th>
                      <th className="px-4 py-3">Tài liệu</th>
                      <th className="sticky right-0 bg-brand-50 px-4 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedDetailEvents.map((event) => (
                      <tr key={event.id} className="border-t border-slate-100 align-top transition hover:bg-brand-50/30">
                        {selectionMode && (
                          <td className="px-3 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(event.id)}
                              onChange={() => toggleEventSelection(event.id)}
                              className="h-4 w-4 rounded border-brand-300 text-brand-700 focus:ring-brand-300"
                            />
                          </td>
                        )}
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {format(new Date(event.date), "dd/MM/yyyy")} - {event.start_time.slice(0, 5)} -{" "}
                          {event.end_time.slice(0, 5)}
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
                        <td className="sticky right-0 bg-white px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setModal({ open: true, mode: "edit", event })}>
                              Sửa
                            </Button>
                            <button
                              type="button"
                              onClick={() => setDetailEvent(event)}
                              className="rounded-md px-2 py-1 text-sm font-semibold text-brand-700 underline underline-offset-2 transition hover:bg-brand-50 hover:text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
                            >
                              Chi tiết
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
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
            <div className="space-y-2.5 text-slate-700">
              <p className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-brand-700" />
                <span>
                  {format(new Date(detailEvent.date), "dd/MM/yyyy")} |{" "}
                  {detailEvent.start_time.slice(0, 5)} - {detailEvent.end_time.slice(0, 5)}
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
                <FileText className="mt-1 h-4 w-4 text-brand-700" />
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
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700">Tệp đính kèm</p>
              {(attachmentsByEvent.get(detailEvent.id) ?? []).length === 0 ? (
                <p className="text-sm text-slate-500">Không có</p>
              ) : (
                <ul className="space-y-1">
                  {(attachmentsByEvent.get(detailEvent.id) ?? []).map((attachment) => (
                    <li key={attachment.id}>
                      <a
                        href={buildAttachmentUrl(attachment.file_path)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-brand-700 underline underline-offset-2 transition hover:text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
                      >
                        {attachment.file_name}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setModal({ open: true, mode: "edit", event: detailEvent });
                  setDetailEvent(null);
                }}
              >
                Sửa
              </Button>
              <Button
                variant="danger"
                onClick={async () => {
                  await deleteEvent(detailEvent);
                  setDetailEvent(null);
                }}
              >
                Xóa
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </main>
  );
}
