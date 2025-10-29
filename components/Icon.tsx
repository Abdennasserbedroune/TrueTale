import React from "react";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  "aria-label"?: string;
  "aria-hidden"?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
};

export function Icon({
  icon: IconComponent,
  "aria-label": ariaLabel,
  "aria-hidden": ariaHidden,
  size = "md",
  className = "",
  ...props
}: IconProps) {
  const sizeClass = sizeMap[size];

  return (
    <IconComponent
      className={`${sizeClass} ${className}`}
      aria-label={ariaLabel}
      aria-hidden={ariaHidden ?? (ariaLabel ? false : true)}
      {...props}
    />
  );
}
