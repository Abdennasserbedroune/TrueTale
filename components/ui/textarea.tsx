"use client";

import clsx from "clsx";
import type { TextareaHTMLAttributes } from "react";

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const TextArea = ({ className, ...props }: TextAreaProps) => (
  <textarea
    className={clsx(
      "w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:cursor-not-allowed disabled:bg-slate-100",
      className,
    )}
    {...props}
  />
);
