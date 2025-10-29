import React from "react";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  "aria-label": string;
}

const variantStyles = {
  primary:
    "bg-brand-600 text-text-inverse hover:bg-brand-700 focus-visible:ring-brand-500 shadow-sm",
  secondary:
    "bg-bg-tertiary text-text-primary hover:bg-border-medium focus-visible:ring-brand-500",
  ghost: "bg-transparent text-text-secondary hover:bg-bg-secondary focus-visible:ring-brand-500",
};

const sizeStyles = {
  sm: "p-2 min-w-[2.5rem] min-h-[2.5rem]",
  md: "p-2.5 min-w-[2.75rem] min-h-[2.75rem]",
  lg: "p-3 min-w-[3rem] min-h-[3rem]",
};

export function IconButton({
  icon,
  variant = "ghost",
  size = "md",
  className = "",
  "aria-label": ariaLabel,
  disabled,
  ...props
}: IconButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      aria-label={ariaLabel}
      disabled={disabled}
      {...props}
    >
      {icon}
    </button>
  );
}
