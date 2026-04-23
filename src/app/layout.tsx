import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Nunito } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/hooks/use-toast";

const nunito = Nunito({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"]
});

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
      <body className={nunito.className}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
