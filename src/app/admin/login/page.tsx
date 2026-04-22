"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { signInAdmin } from "@/services/auth.service";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { notify } = useToast();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const { error } = await signInAdmin(email, password);
    setSubmitting(false);

    if (error) {
      notify(`Đăng nhập thất bại: ${error.message}`, "error");
      return;
    }

    notify("Đăng nhập thành công.", "success");
    router.replace("/admin");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-brand-100 bg-white p-6 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          Admin only
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-brand-950">
          Đăng nhập quản trị
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Chỉ nhân viên quản trị lịch trình mới có quyền truy cập.
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <Input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@company.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <Input
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </form>
      </div>
    </main>
  );
}
