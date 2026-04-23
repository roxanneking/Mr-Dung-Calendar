"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, format, startOfMonth, subDays } from "date-fns";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckSquare,
  RefreshCcw,
  Square
} from "lucide-react";

import { EventFormModal } from "@/components/admin/event-form-modal";
import { EventAttachmentRecord } from "@/features/attachments/types";
import { MonthCalendar } from "@/components/calendar/month-calendar";
import { DayEventsPanel } from "@/components/events/day-events-panel";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { createClient } from "@/supabase/client";
import { PRIORITY_OPTIONS } from "@/features/events/constants";
import { EventFormInput, EventRecord } from "@/features/events/types";
import { groupEventsByDate, sortEventsByTime } from "@/features/events/utils";
import { useToast } from "@/hooks/use-toast";

interface AdminDashboardProps {
  initialEvents: EventRecord[];
}

type ModalState =
  | { open: false; mode: "create" | "edit"; event?: undefined }
  | { open: true; mode: "create" | "edit"; event?: EventRecord };

type SortKey = "time" | "title" | "owner" | "deadline" | "status";
type SortDirection = "asc" | "desc";

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
  const [detailEvent, setDetailEvent] = useState<EventRecord | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("time");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { notify } = useToast();
  const supabase = createClient();
  const publicLink = useMemo(() => {
    if (typeof window === "undefined") {
      return "/boss";
    }
    return `${window.location.origin}/boss`;
  }, []);

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

  const detailEvents = useMemo(() => {
    const list = [...filteredDetailEvents];
    list.sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;
      switch (sortKey) {
        case "title":
          return a.title.localeCompare(b.title) * direction;
        case "owner":
          return (a.owner ?? "").localeCompare(b.owner ?? "") * direction;
        case "deadline":
          return (a.deadline ?? "9999-12-31").localeCompare(b.deadline ?? "9999-12-31") * direction;
        case "status":
          return (a.status ?? "").localeCompare(b.status ?? "") * direction;
        case "time":
        default: {
          const left = `${a.date} ${a.start_time}`;
          const right = `${b.date} ${b.start_time}`;
          return left.localeCompare(right) * direction;
        }
      }
    });
    return list;
  }, [filteredDetailEvents, sortDirection, sortKey]);

  const isAllSelected =
    detailEvents.length > 0 && detailEvents.every((event) => selectedIds.has(event.id));

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

    if (error) {
      setLoading(false);
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
      setLoading(false);
      notify(`Không thể tải danh sách tài liệu: ${attachmentError.message}`, "error");
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

  async function deleteEvent(event: EventRecord, skipConfirm = false) {
    if (!skipConfirm) {
      const ok = window.confirm(`Xóa lịch "${event.title}"?`);
      if (!ok) {
        return;
      }
    }

    const { error } = await supabase.from("events").delete().eq("id", event.id);
    if (error) {
      notify(`Xóa lịch thất bại: ${error.message}`, "error");
      return;
    }

    notify("Đã xóa lịch.", "success");
    setDetailEvent(null);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(event.id);
      return next;
    });
    await refreshEvents();
  }

  async function deleteSelectedEvents() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      notify("Bạn chưa chọn lịch trình nào.", "info");
      return;
    }

    const ok = window.confirm(`Xóa ${ids.length} lịch trình đã chọn?`);
    if (!ok) {
      return;
    }

    const { error } = await supabase.from("events").delete().in("id", ids);
    if (error) {
      notify(`Xóa lịch thất bại: ${error.message}`, "error");
      return;
    }

    notify(`Đã xóa ${ids.length} lịch trình.`, "success");
    setSelectedIds(new Set());
    setSelectMode(false);
    await refreshEvents();
  }

  async function copyPublicLink() {
    await navigator.clipboard.writeText(publicLink);
    notify("Đã sao chép liên kết gửi sếp.", "success");
  }

  async function exportEventsToExcel(items: EventRecord[], suffix: string) {
    if (items.length === 0) {
      notify("Không có dữ liệu để xuất.", "info");
      return;
    }

    const XLSX = await import("xlsx");
    const rows = items.map((event) => ({
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "LichChiTiet");
    XLSX.writeFile(workbook, `lich-chi-tiet-${suffix}-${format(new Date(), "yyyyMMdd-HHmm")}.xlsx`);
  }

  async function exportFilteredEvents() {
    await exportEventsToExcel(detailEvents, "da-loc");
  }

  async function exportSelectedEvents() {
    const selected = detailEvents.filter((event) => selectedIds.has(event.id));
    if (selected.length === 0) {
      notify("Bạn chưa chọn lịch trình nào để xuất.", "info");
      return;
    }
    await exportEventsToExcel(selected, "da-chon");
  }

  function toggleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(nextKey);
    setSortDirection("asc");
  }

  function renderSortIcon(key: SortKey) {
    if (sortKey !== key) {
      return <ArrowUpDown className="h-3.5 w-3.5" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5" />
    );
  }

  function toggleSelectMode() {
    if (selectMode) {
      setSelectMode(false);
      setSelectedIds(new Set());
      return;
    }
    setSelectMode(true);
  }

  function toggleSelectOne(eventId: string) {
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
    if (isAllSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(detailEvents.map((event) => event.id)));
  }

  function openEditModal(event: EventRecord) {
    setDetailEvent(null);
    setModal({ open: true, mode: "edit", event });
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">
      <Card className="mb-6 rounded-2xl border border-brand-100 bg-white py-0 shadow-soft ring-0">
        <CardHeader className="px-5 pt-5 pb-3">
          <CardTitle className="text-2xl font-semibold text-brand-950">
            Quản lý lịch trình ông PKD
          </CardTitle>
          <CardDescription className="text-sm text-slate-600">
            <button
              type="button"
              onClick={() => void copyPublicLink()}
              className="font-semibold text-brand-700 underline-offset-2 hover:text-brand-900 hover:underline"
            >
              Sao chép liên kết
            </button>{" "}
            để gửi sếp theo dõi lịch trình hoặc{" "}
            <a
              href={publicLink}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-brand-700 underline-offset-2 hover:text-brand-900 hover:underline"
            >
              mở link trực tiếp
            </a>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-5">
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
        </CardContent>
      </Card>

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
          Chưa có lịch trình nào. Nhấn "Thêm lịch" để bắt đầu.
        </div>
      ) : viewMode === "overview" ? (
        <>
          <div className="mb-6">
            <DayEventsPanel
              selectedDate={selectedDate}
              events={selectedDateEvents}
              onPrevDate={() => setSelectedDate((current) => subDays(current, 1))}
              onNextDate={() => setSelectedDate((current) => addDays(current, 1))}
              mode="admin"
              onEditEvent={openEditModal}
              onDeleteEvent={(event) => void deleteEvent(event)}
              attachmentsByEvent={attachmentsByEvent}
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
          <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 md:flex-row md:items-end md:gap-2">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-brand-200 text-brand-900 hover:bg-brand-50"
              onClick={() => void refreshEvents()}
              aria-label="Làm mới dữ liệu"
              title="Làm mới"
            >
              <RefreshCcw className="h-4 w-4" />
            </button>
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
            <div className="flex w-full flex-wrap gap-2 md:ml-auto md:w-auto">
              <Button className="flex-1 md:flex-none" variant="outline" onClick={toggleSelectMode}>
                {selectMode ? "Hủy chọn" : "Chọn"}
              </Button>
              <Button className="flex-1 md:flex-none" variant="outline" onClick={() => void exportFilteredEvents()}>
                Xuất Excel
              </Button>
              <Button
                className="flex-1 md:flex-none"
                variant="primary"
                onClick={() => setModal({ open: true, mode: "create" })}
              >
                Thêm lịch
              </Button>
            </div>
          </div>

          {selectMode && (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 p-3">
              <span className="text-sm font-semibold text-brand-900">
                Đã chọn {selectedIds.size} lịch trình
              </span>
              <Button type="button" variant="outline" className="h-9" onClick={toggleSelectAll}>
                {isAllSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
              </Button>
              <Button type="button" variant="outline" className="h-9" onClick={() => void exportSelectedEvents()}>
                Xuất Excel đã chọn
              </Button>
              <Button type="button" variant="danger" className="h-9" onClick={() => void deleteSelectedEvents()}>
                Xóa đã chọn
              </Button>
            </div>
          )}

          {detailEvents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50 p-5 text-sm text-brand-900">
              Không có lịch trình trong phạm vi đã lọc.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2 md:hidden">
                {detailEvents.map((event) => {
                  const files = attachmentsByEvent.get(event.id) ?? [];
                  return (
                    <div key={event.id} className="rounded-xl border border-brand-100 bg-white p-3">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-900">{event.title}</p>
                          <p className="text-xs text-slate-600">
                            {format(new Date(event.date), "dd/MM/yyyy")} | {event.start_time.slice(0, 5)} - {event.end_time.slice(0, 5)}
                          </p>
                        </div>
                        {selectMode && (
                          <button
                            type="button"
                            className="text-brand-900"
                            onClick={() => toggleSelectOne(event.id)}
                            aria-label="Chọn lịch trình"
                          >
                            {selectedIds.has(event.id) ? (
                              <CheckSquare className="h-5 w-5" />
                            ) : (
                              <Square className="h-5 w-5" />
                            )}
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-slate-700">Nhân sự: {event.owner || "Không có"}</p>
                      <p className="text-sm text-slate-700">Trạng thái: {event.status || "Không có"}</p>
                      <p className="text-sm text-slate-700">Tài liệu: {files.length} tệp</p>
                      <div className="mt-2 flex justify-end gap-2">
                        <Button variant="outline" className="h-8 px-3 text-xs" onClick={() => openEditModal(event)}>
                          Sửa
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-8 px-3 text-xs"
                          onClick={() => setDetailEvent(event)}
                        >
                          Chi tiết
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-soft md:block">
                <Table className="min-w-[1250px]">
                  <TableHeader>
                    <TableRow className="bg-brand-50 text-left text-xs uppercase tracking-wide text-brand-800 hover:bg-brand-50">
                      {selectMode && <TableHead className="px-3 py-3" />}
                      <TableHead className="px-4 py-3">
                        <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("time")}>
                          Giờ
                          {renderSortIcon("time")}
                        </button>
                      </TableHead>
                      <TableHead className="px-4 py-3">
                        <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("title")}>
                          Nội dung công việc
                          {renderSortIcon("title")}
                        </button>
                      </TableHead>
                      <TableHead className="px-4 py-3">Chi tiết công việc</TableHead>
                      <TableHead className="px-4 py-3">
                        <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("owner")}>
                          Nhân sự
                          {renderSortIcon("owner")}
                        </button>
                      </TableHead>
                      <TableHead className="px-4 py-3">
                        <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("deadline")}>
                          Deadline
                          {renderSortIcon("deadline")}
                        </button>
                      </TableHead>
                      <TableHead className="px-4 py-3">Địa điểm</TableHead>
                      <TableHead className="px-4 py-3">
                        <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("status")}>
                          Trạng thái
                          {renderSortIcon("status")}
                        </button>
                      </TableHead>
                      <TableHead className="px-4 py-3">Kết quả</TableHead>
                      <TableHead className="px-4 py-3">Ghi chú</TableHead>
                      <TableHead className="px-4 py-3">Tài liệu</TableHead>
                      <TableHead className="sticky right-0 bg-brand-50 px-4 py-3 text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailEvents.map((event) => {
                      const files = attachmentsByEvent.get(event.id) ?? [];
                      return (
                        <TableRow key={event.id} className="border-t border-slate-100 align-top">
                          {selectMode && (
                            <TableCell className="px-3 py-3">
                              <input
                                type="checkbox"
                                checked={selectedIds.has(event.id)}
                                onChange={() => toggleSelectOne(event.id)}
                                className="h-4 w-4"
                              />
                            </TableCell>
                          )}
                          <TableCell className="px-4 py-3 text-sm text-slate-700">
                            {format(new Date(event.date), "dd/MM/yyyy")} | {event.start_time.slice(0, 5)} - {event.end_time.slice(0, 5)}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm text-slate-900">{event.title}</TableCell>
                          <TableCell className="px-4 py-3 text-sm text-slate-700">{event.description ?? ""}</TableCell>
                          <TableCell className="px-4 py-3 text-sm text-slate-700">{event.owner ?? ""}</TableCell>
                          <TableCell className="px-4 py-3 text-sm text-slate-700">
                            {event.deadline ? format(new Date(event.deadline), "dd/MM/yyyy") : ""}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm text-slate-700">{event.location ?? ""}</TableCell>
                          <TableCell className="px-4 py-3 text-sm text-slate-700">{event.status ?? ""}</TableCell>
                          <TableCell className="px-4 py-3 text-sm text-slate-700">{event.result ?? ""}</TableCell>
                          <TableCell className="px-4 py-3 text-sm text-slate-700">{event.notes ?? ""}</TableCell>
                          <TableCell className="px-4 py-3 text-sm text-slate-700">{files.length} tệp</TableCell>
                          <TableCell className="sticky right-0 bg-white px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => openEditModal(event)}>
                                Sửa
                              </Button>
                              <Button variant="ghost" onClick={() => setDetailEvent(event)}>
                                Chi tiết
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
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
        onClose={() => setDetailEvent(null)}
        title="Chi tiết lịch trình"
      >
        {detailEvent && (
          <div className="space-y-3 text-sm text-slate-700">
            <p className="text-lg font-semibold text-slate-900">{detailEvent.title}</p>
            <p>
              <span className="font-semibold">Thời gian:</span>{" "}
              {format(new Date(detailEvent.date), "dd/MM/yyyy")} | {detailEvent.start_time.slice(0, 5)} - {detailEvent.end_time.slice(0, 5)}
            </p>
            <p>
              <span className="font-semibold">Nhân sự:</span> {detailEvent.owner || "Không có"}
            </p>
            <p>
              <span className="font-semibold">Địa điểm:</span> {detailEvent.location || "Không có"}
            </p>
            <p>
              <span className="font-semibold">Chi tiết công việc:</span>{" "}
              {detailEvent.description || "Không có"}
            </p>
            <p>
              <span className="font-semibold">Trạng thái:</span> {detailEvent.status || "Không có"}
            </p>
            <p>
              <span className="font-semibold">Kết quả:</span> {detailEvent.result || "Không có"}
            </p>
            <p>
              <span className="font-semibold">Ghi chú:</span> {detailEvent.notes || "Không có"}
            </p>
            <div>
              <p className="font-semibold">Tài liệu:</p>
              {(attachmentsByEvent.get(detailEvent.id) ?? []).length === 0 ? (
                <p className="text-slate-600">Không có tài liệu.</p>
              ) : (
                <ul className="list-disc pl-5 text-slate-700">
                  {(attachmentsByEvent.get(detailEvent.id) ?? []).map((file) => (
                    <li key={file.id}>{file.file_name}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <Button type="button" variant="outline" onClick={() => openEditModal(detailEvent)}>
                Sửa
              </Button>
              <Button type="button" variant="danger" onClick={() => void deleteEvent(detailEvent)}>
                Xóa
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </main>
  );
}
