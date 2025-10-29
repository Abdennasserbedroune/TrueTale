import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export function Input({ label, error, helperText, className = "", id, ...props }: InputProps) {
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
        {label}
        {props.required && <span className="ml-1 text-brand-600">*</span>}
      </label>
      <input
        id={inputId}
        className={`rounded-lg border px-4 py-2.5 text-base transition-colors min-h-[2.75rem] ${
          error
            ? "border-red-500 focus:border-red-600 focus:ring-red-500"
            : "border-border focus:border-brand-500 focus:ring-brand-500"
        } bg-surface text-text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={
          error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
        }
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${inputId}-helper`} className="text-sm text-text-tertiary">
          {helperText}
        </p>
      )}
    </div>
  );
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export function Textarea({
  label,
  error,
  helperText,
  className = "",
  id,
  ...props
}: TextareaProps) {
  const textareaId = id || `textarea-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={textareaId} className="text-sm font-medium text-text-primary">
        {label}
        {props.required && <span className="ml-1 text-brand-600">*</span>}
      </label>
      <textarea
        id={textareaId}
        className={`rounded-lg border px-4 py-2.5 text-base transition-colors min-h-[7rem] ${
          error
            ? "border-red-500 focus:border-red-600 focus:ring-red-500"
            : "border-border focus:border-brand-500 focus:ring-brand-500"
        } bg-surface text-text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={
          error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined
        }
        {...props}
      />
      {error && (
        <p id={`${textareaId}-error`} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${textareaId}-helper`} className="text-sm text-text-tertiary">
          {helperText}
        </p>
      )}
    </div>
  );
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  helperText?: string;
  options: Array<{ value: string; label: string }>;
}

export function Select({
  label,
  error,
  helperText,
  options,
  className = "",
  id,
  ...props
}: SelectProps) {
  const selectId = id || `select-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-sm font-medium text-text-primary">
        {label}
        {props.required && <span className="ml-1 text-brand-600">*</span>}
      </label>
      <select
        id={selectId}
        className={`rounded-lg border px-4 py-2.5 text-base transition-colors min-h-[2.75rem] ${
          error
            ? "border-red-500 focus:border-red-600 focus:ring-red-500"
            : "border-border focus:border-brand-500 focus:ring-brand-500"
        } bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={
          error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined
        }
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${selectId}-error`} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${selectId}-helper`} className="text-sm text-text-tertiary">
          {helperText}
        </p>
      )}
    </div>
  );
}
