import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
}

export function Badge({ children, className, ...props }: BadgeProps) {
  return (
    <span
      {...props}
      className={cn(
        "inline-flex rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800",
        className
      )}
    >
      {children}
    </span>
  );
}
