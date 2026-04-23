"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, title, onClose, children, className }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 md:items-center">
      <div
        className={cn(
          "my-6 w-full max-w-2xl overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-soft",
          className
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-brand-100 bg-white px-5 py-4">
          <h3 className="text-lg font-semibold text-brand-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto rounded-b-2xl p-5">{children}</div>
      </div>
    </div>
  );
}
