"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent
} from "react";
import { UploadCloud } from "lucide-react";

import {
  PRIORITY_OPTIONS,
  getPriorityMeta
} from "@/features/events/constants";
import { EventAttachmentRecord } from "@/features/attachments/types";
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
  initialAttachments: EventAttachmentRecord[];
  onSubmit: (
    values: EventFormInput,
    files: File[],
    deletedAttachmentIds: string[]
  ) => Promise<void>;
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
  status: "Mới",
  result: "",
  notes: "",
  category: "meeting",
  color: getPriorityMeta("meeting").color
};

export function EventFormModal({
  open,
  mode,
  initialEvent,
  initialAttachments,
  onSubmit,
  onClose,
  submitting
}: EventFormModalProps) {
  const [form, setForm] = useState<EventFormInput>(EMPTY_FORM);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [attachments, setAttachments] = useState<EventAttachmentRecord[]>([]);
  const [deletedAttachmentIds, setDeletedAttachmentIds] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      setAttachments(initialAttachments);
      setDeletedAttachmentIds([]);
      setNewFiles([]);
      return;
    }
    setForm(EMPTY_FORM);
    setAttachments([]);
    setDeletedAttachmentIds([]);
    setNewFiles([]);
  }, [initialAttachments, initialEvent, open]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onSubmit(form, newFiles, deletedAttachmentIds);
  }

  function addSelectedFiles(selected: File[]) {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "image/png",
      "image/jpg",
      "image/jpeg"
    ];

    const validFiles = selected.filter(
      (file) => allowedTypes.includes(file.type) && file.size <= 10 * 1024 * 1024
    );
    const maxRemaining = Math.max(0, 5 - attachments.length - newFiles.length);
    const finalFiles = validFiles.slice(0, maxRemaining);

    setNewFiles((prev) => [...prev, ...finalFiles]);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    addSelectedFiles(selected);
    event.target.value = "";
  }

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const dropped = Array.from(event.dataTransfer.files ?? []);
    addSelectedFiles(dropped);
  }

  function removeNewFile(fileName: string) {
    setNewFiles((prev) => prev.filter((file) => file.name !== fileName));
  }

  function removeExistingAttachment(attachmentId: string) {
    setAttachments((prev) => prev.filter((item) => item.id !== attachmentId));
    setDeletedAttachmentIds((prev) => [...prev, attachmentId]);
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
              placeholder="Ví dụ: Chị Hà"
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
              Hạn chót
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
            <select
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
              className="h-11 w-full rounded-xl border border-brand-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            >
              <option value="Mới">Mới</option>
              <option value="Đang xử lý">Đang xử lý</option>
              <option value="Hoàn thành">Hoàn thành</option>
            </select>
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
            <p className="mb-2 font-medium text-slate-700">Đăng tải tài liệu (tối đa 5 tệp)</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              className="hidden"
            />
            <label
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
                dragging
                  ? "border-brand-500 bg-brand-50"
                  : "border-brand-200 bg-white hover:border-brand-400 hover:bg-brand-50/60"
              }`}
            >
              <UploadCloud className="mb-2 h-6 w-6 text-brand-700" />
              <p className="text-base font-semibold text-brand-900">
                Kéo và thả tệp vào đây hoặc bấm để chọn
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Còn tối đa {Math.max(0, 5 - attachments.length - newFiles.length)} tệp
              </p>
            </label>
            <p className="mt-2 text-xs text-slate-500">
              Hỗ trợ: pdf, doc/docx, xls/xlsx, png/jpg/jpeg. Mỗi tệp tối đa 10MB.
            </p>
          </div>
          <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-3 text-sm">
            <p className="font-medium text-slate-700">Tài liệu đã tải</p>
            <div className="mt-2 space-y-2">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-2">
                  <span className="truncate pr-2 text-slate-700">{attachment.file_name}</span>
                  <Button
                    type="button"
                    variant="danger"
                    className="h-8 px-3 text-xs"
                    onClick={() => removeExistingAttachment(attachment.id)}
                  >
                    Xóa
                  </Button>
                </div>
              ))}
              {newFiles.map((file) => (
                <div key={file.name} className="flex items-center justify-between rounded-lg border border-slate-200 p-2">
                  <span className="truncate pr-2 text-slate-700">{file.name}</span>
                  <Button
                    type="button"
                    variant="danger"
                    className="h-8 px-3 text-xs"
                    onClick={() => removeNewFile(file.name)}
                  >
                    Bỏ
                  </Button>
                </div>
              ))}
              {attachments.length === 0 && newFiles.length === 0 && (
                <p className="text-slate-500">Chưa có tài liệu nào.</p>
              )}
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
