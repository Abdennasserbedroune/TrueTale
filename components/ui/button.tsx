"use client";

import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  children: ReactNode;
}

const variants: Record<string, string> = {
  primary:
    "rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white shadow transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-brand-300",
  secondary:
    "rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400",
  ghost:
    "rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400",
};

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return <button className={clsx(variants[variant], className)} {...props} />;
}
