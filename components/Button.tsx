import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

const variantStyles = {
  primary:
    "bg-brand-600 text-text-inverse hover:bg-brand-700 focus-visible:ring-brand-500 shadow-sm",
  secondary: "bg-bg-tertiary text-text-primary hover:bg-border-medium focus-visible:ring-brand-500",
  ghost: "bg-transparent text-text-secondary hover:bg-bg-secondary focus-visible:ring-brand-500",
};

const sizeStyles = {
  sm: "px-4 py-2 text-sm min-h-[2.5rem]",
  md: "px-5 py-2.5 text-base min-h-[2.75rem]",
  lg: "px-6 py-3 text-lg min-h-[3rem]",
};

export function Button({
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && iconPosition === "left" && <span className="flex-shrink-0">{icon}</span>}
      {children}
      {icon && iconPosition === "right" && <span className="flex-shrink-0">{icon}</span>}
    </button>
  );
}
