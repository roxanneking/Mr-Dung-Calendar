"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";

import { EventFormModal } from "@/components/admin/event-form-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/supabase/client";
import { EventFormInput, EventRecord } from "@/features/events/types";
import { useToast } from "@/hooks/use-toast";
import { signOutAdmin } from "@/services/auth.service";

interface AdminDashboardProps {
  initialEvents: EventRecord[];
}

type ModalState =
  | { open: false; mode: "create" | "edit"; event?: undefined }
  | { open: true; mode: "create" | "edit"; event?: EventRecord };

export function AdminDashboard({ initialEvents }: AdminDashboardProps) {
  const [events, setEvents] = useState<EventRecord[]>(initialEvents);
  const [modal, setModal] = useState<ModalState>({ open: false, mode: "create" });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const { notify } = useToast();
  const supabase = createClient();

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) =>
      a.date === b.date
        ? a.start_time.localeCompare(b.start_time)
        : a.date.localeCompare(b.date)
    );
  }, [events]);

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
    setEvents((data as EventRecord[]) ?? []);
  }

  async function saveEvent(values: EventFormInput) {
    setSubmitting(true);
    const payload = {
      ...values,
      location: values.location || null,
      description: values.description || null,
      start_time: `${values.start_time}:00`,
      end_time: `${values.end_time}:00`
    };

    const query =
      modal.mode === "create"
        ? supabase.from("events").insert(payload)
        : supabase.from("events").update(payload).eq("id", modal.event?.id ?? "");

    const { error } = await query;
    setSubmitting(false);

    if (error) {
      notify(`Lưu lịch thất bại: ${error.message}`, "error");
      return;
    }

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

  async function handleSignOut() {
    await signOutAdmin();
    window.location.href = "/admin/login";
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-brand-100 bg-white p-5 shadow-soft md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            Khu vực quản trị
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-brand-950">
            Quản lý lịch trình sếp
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Chỉ tài khoản admin mới có quyền thêm, sửa, xóa.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshEvents} disabled={loading}>
            {loading ? "Đang tải..." : "Tải lại"}
          </Button>
          <Button
            variant="primary"
            onClick={() => setModal({ open: true, mode: "create" })}
          >
            Thêm lịch
          </Button>
          <Button variant="ghost" onClick={handleSignOut}>
            Đăng xuất
          </Button>
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
      ) : (
        <div className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-soft">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-brand-50 text-left text-xs uppercase tracking-wide text-brand-800">
                <th className="px-4 py-3">Ngày</th>
                <th className="px-4 py-3">Giờ</th>
                <th className="px-4 py-3">Nội dung</th>
                <th className="px-4 py-3">Loại</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {sortedEvents.map((event) => (
                <tr key={event.id} className="border-t border-slate-100 align-top">
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {format(new Date(event.date), "dd/MM/yyyy")}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {event.start_time.slice(0, 5)} - {event.end_time.slice(0, 5)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{event.title}</p>
                    {event.location && (
                      <p className="mt-1 text-sm text-slate-500">{event.location}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge style={{ backgroundColor: `${event.color}20`, color: event.color }}>
                      {event.category}
                    </Badge>
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
              ))}
            </tbody>
          </table>
        </div>
      )}

      <EventFormModal
        open={modal.open}
        mode={modal.mode}
        initialEvent={modal.event}
        onSubmit={saveEvent}
        onClose={() => setModal({ open: false, mode: "create" })}
        submitting={submitting}
      />
    </main>
  );
}
