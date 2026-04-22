"use client";

import { useEffect, useState, type FormEvent } from "react";

import { EVENT_CATEGORIES, EVENT_COLORS } from "@/features/events/constants";
import { EventFormInput, EventRecord } from "@/features/events/types";
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
  category: "meeting",
  color: "#059669"
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
              Tiêu đề
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
              Ngày
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
              Loại lịch
            </label>
            <Select
              value={form.category}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  category: e.target.value as EventFormInput["category"]
                }))
              }
            >
              {EVENT_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </Select>
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
              Mô tả
            </label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Nội dung cần chuẩn bị..."
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Màu nhận diện
            </label>
            <div className="flex gap-2">
              {EVENT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, color }))}
                  className={[
                    "h-7 w-7 rounded-full border-2",
                    form.color === color ? "border-slate-800" : "border-transparent"
                  ].join(" ")}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
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
