# TrueTale Design System (Redesign)

A premium, creative, and unique design system for the "Letterboxd for books".

## Overview

The new design system focuses on:
- **Premium Aesthetic**: Dark mode first, rich backgrounds, and subtle gradients.
- **Glassmorphism**: Translucent layers to create depth and context.
- **Vibrant Accents**: Electric purples, golds, and blues to stand out against the dark theme.
- **Typography**: `Inter` for UI, with a secondary serif font (e.g., `Playfair Display` or `Merriweather`) for editorial headings.
- **Micro-interactions**: Smooth transitions, hover lifts, and glow effects.

## Color Palette

### Brand Colors (Premium Dark)
- **Primary**: `brand-500` (#8b5cf6) - Electric Violet (Vibrant accent)
- **Secondary**: `brand-400` (#f59e0b) - Amber Gold (Highlights/Awards)
- **Accent**: `brand-300` (#06b6d4) - Cyan (Actions/Links)

### Background Colors
- **Page**: `bg-page` (#0a0a0a) - Deepest black/gray
- **Surface**: `bg-surface` (#171717) - Slightly lighter for cards
- **Glass**: `bg-glass` (rgba(23, 23, 23, 0.7)) - For overlays and sticky headers (requires backdrop-blur)

### Text Colors
- **Primary**: `text-primary` (#f3f4f6) - High contrast white/gray
- **Secondary**: `text-secondary` (#9ca3af) - Muted gray
- **Muted**: `text-muted` (#4b5563) - Darker gray for subtle details

## Typography

### Font Family
- **Sans**: `Inter` (UI elements, body text)
- **Serif**: `Playfair Display` (Headings, Book Titles, Quotes)

### Scale
- **Display**: 3rem+ (Hero sections)
- **H1**: 2.25rem (Page titles)
- **H2**: 1.875rem (Section headers)
- **Body**: 1rem (Standard reading)
- **Small**: 0.875rem (Metadata)

## Core Components

### Buttons
- **Primary**: Gradient background, rounded-full, glow effect on hover.
- **Secondary**: Glass background, thin border, white text.
- **Ghost**: Transparent, text-only with underline hover.

### Cards (Glassmorphism)
- Background: `bg-surface` or `bg-glass`
- Border: 1px solid `rgba(255,255,255,0.1)`
- Shadow: `shadow-xl` with slight colored glow based on context.

### Navigation
- **Sticky Header**: Glass effect with blur.
- **Links**: subtle opacity change on hover, active state has a bottom glow.

## Animation
- **Hover**: `transform: translateY(-2px)`
- **Fade In**: `opacity: 0 -> 1` with `translateY(10px)`
- **Transition**: `all 0.3s ease-out`

## Accessibility
- Maintain WCAG AA contrast ratios even in dark mode.
- Focus rings should be distinct (e.g., a bright cyan or purple ring).
