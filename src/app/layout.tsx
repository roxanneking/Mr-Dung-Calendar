import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ToastProvider } from "@/hooks/use-toast";

export const metadata: Metadata = {
  title: "Lịch Trình Sếp",
  description: "Web app quản trị lịch trình sếp với phân quyền public/admin"
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
