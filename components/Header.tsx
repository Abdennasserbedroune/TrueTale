"use client";

import Link from "next/link";
import { Icon } from "./Icon";
import { IconButton } from "./IconButton";
import { Bars3Icon, UserCircleIcon } from "@heroicons/react/24/outline";

export interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <IconButton
            icon={<Icon icon={Bars3Icon} aria-hidden />}
            aria-label="Open menu"
            variant="ghost"
            size="md"
            onClick={onMenuClick}
            className="lg:hidden"
          />
          <Link href="/" className="flex items-center gap-2.5 text-lg font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-text-inverse">
              <Icon icon={UserCircleIcon} size="md" aria-hidden />
            </span>
            <span className="text-text-primary">TrueTale</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <IconButton
            icon={<Icon icon={UserCircleIcon} aria-hidden />}
            aria-label="User profile"
            variant="ghost"
            size="md"
          />
        </div>
      </div>
    </header>
  );
}
