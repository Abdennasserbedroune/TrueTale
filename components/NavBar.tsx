"use client";

import Link from "next/link";
import { Icon } from "./Icon";
import {
  HomeIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const defaultNavItems: NavItem[] = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/marketplace", label: "Marketplace", icon: MagnifyingGlassIcon },
  { href: "/dashboard", label: "Dashboard", icon: ChartBarIcon },
  { href: "/messages", label: "Messages", icon: ChatBubbleLeftRightIcon },
];

export interface NavBarProps {
  items?: NavItem[];
}

export function NavBar({ items = defaultNavItems }: NavBarProps) {
  return (
    <nav aria-label="Primary navigation" className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-base font-medium text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <Icon icon={item.icon} size="md" aria-hidden />
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
