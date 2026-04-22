"use client";

import { useEffect, useState, type FormEvent } from "react";

import {
  PRIORITY_OPTIONS,
  getPriorityMeta
} from "@/features/events/constants";
import { EventFormInput, EventRecord } from "@/features/events/types";
import { getWeekOfMonthLabel } from "@/features/events/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface EventFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialEvent?: EventRecord;
  onSubmit: (values: EventFormInput) => Promise<void>;
  onClose: () => void;
  submitting: boolean;
}

const EMPTY_FORM: EventFormInput = {
  title: "",
  date: "",
  start_time: "09:00",
  end_time: "10:00",
  location: "",
  description: "",
  owner: "",
  deadline: "",
  status: "",
  result: "",
  notes: "",
  category: "meeting",
  color: getPriorityMeta("meeting").color
};

export function EventFormModal({
  open,
  mode,
  initialEvent,
  onSubmit,
  onClose,
  submitting
}: EventFormModalProps) {
  const [form, setForm] = useState<EventFormInput>(EMPTY_FORM);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (initialEvent) {
      setForm({
        title: initialEvent.title,
        date: initialEvent.date,
        start_time: initialEvent.start_time.slice(0, 5),
        end_time: initialEvent.end_time.slice(0, 5),
        location: initialEvent.location ?? "",
        description: initialEvent.description ?? "",
        owner: initialEvent.owner ?? "",
        deadline: initialEvent.deadline ?? "",
        status: initialEvent.status ?? "",
        result: initialEvent.result ?? "",
        notes: initialEvent.notes ?? "",
        category: initialEvent.category,
        color: initialEvent.color
      });
      return;
    }
    setForm(EMPTY_FORM);
  }, [initialEvent, open]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onSubmit(form);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "Thêm lịch trình mới" : "Cập nhật lịch trình"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Nội dung công việc
            </label>
            <Input
              required
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Ví dụ: Họp chiến lược quý"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Thời gian (ngày)
            </label>
            <Input
              required
              type="date"
              value={form.date}
              onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Tuần trong tháng
            </label>
            <Input
              readOnly
              value={form.date ? getWeekOfMonthLabel(form.date) : ""}
              placeholder="Tự động theo ngày"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Mức độ
            </label>
            <Select
              value={form.category}
              onChange={(e) => {
                const category = e.target.value as EventFormInput["category"];
                setForm((prev) => ({
                  ...prev,
                  category,
                  color: getPriorityMeta(category).color
                }));
              }}
            >
              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Người phụ trách
            </label>
            <Input
              value={form.owner}
              onChange={(e) => setForm((prev) => ({ ...prev, owner: e.target.value }))}
              placeholder="Ví dụ: Mrs Hà"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Giờ bắt đầu
            </label>
            <Input
              required
              type="time"
              value={form.start_time}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, start_time: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Giờ kết thúc
            </label>
            <Input
              required
              type="time"
              value={form.end_time}
              onChange={(e) => setForm((prev) => ({ ...prev, end_time: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Deadline
            </label>
            <Input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm((prev) => ({ ...prev, deadline: e.target.value }))}
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Địa điểm
            </label>
            <Input
              value={form.location}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, location: e.target.value }))
              }
              placeholder="Ví dụ: Phòng họp tầng 8"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Chi tiết công việc
            </label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Nội dung cần chuẩn bị..."
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Trạng thái
            </label>
            <Input
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
              placeholder="Đang thực hiện / Hoàn thành"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Kết quả
            </label>
            <Input
              value={form.result}
              onChange={(e) => setForm((prev) => ({ ...prev, result: e.target.value }))}
              placeholder="Ví dụ: Đạt"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Ghi chú
            </label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Ghi chú bổ sung..."
            />
          </div>
          <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <p className="font-medium text-slate-700">Ghi chú màu ưu tiên</p>
            <ul className="mt-2 space-y-1 text-slate-600">
              <li>- Đỏ: Quan trọng</li>
              <li>- Vàng: Trung bình</li>
              <li>- Xanh lá: Thấp</li>
            </ul>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Đang lưu..." : mode === "create" ? "Tạo lịch" : "Lưu thay đổi"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
