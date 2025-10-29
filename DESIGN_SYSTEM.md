# TrueTale Design System

A calm, professional design system with accessible components and gentle styling.

## Overview

The design system features:
- **Calm color palette**: Soft blues, off-whites, and muted grays
- **Inter font**: Professional, highly readable typeface
- **Elevated spacing**: Increased padding and border-radius for a polished look
- **Icon-first design**: Using Heroicons for all visual elements
- **Accessibility**: WCAG AA compliant with focus-visible styles
- **Minimum font size**: All interactive elements use at least 16px font size

## Color Palette

### Brand Colors
- **Primary**: `brand-600` (#3a628b) - Main brand color
- **Hover**: `brand-700` (#2f4f71) - Darker variant for hover states
- **Light**: `brand-500` (#4a7ba7) - For accents and highlights

### Background Colors
- **Primary**: `bg-primary` (#fafbfc) - Main background
- **Secondary**: `bg-secondary` (#f5f7f9) - Section backgrounds
- **Tertiary**: `bg-tertiary` (#eef1f4) - Card backgrounds
- **Surface**: `surface` (#ffffff) - Elevated surfaces

### Text Colors
- **Primary**: `text-primary` (#1f2937) - Main text
- **Secondary**: `text-secondary` (#4b5563) - Supporting text
- **Tertiary**: `text-tertiary` (#6b7280) - Muted text
- **Inverse**: `text-inverse` (#ffffff) - Text on dark backgrounds

### Border Colors
- **Default**: `border` (#e5e7eb)
- **Light**: `border-light` (#f3f4f6)
- **Medium**: `border-medium` (#d1d5db)
- **Dark**: `border-dark` (#9ca3af)

## Typography

### Font Family
- **Sans**: Inter (loaded from Google Fonts)

### Font Sizes
- **2xl**: 1.5rem (24px) - Large headings
- **xl**: 1.25rem (20px) - Section headings
- **lg**: 1.125rem (18px) - Subheadings
- **base**: 1rem (16px) - Body text, minimum for interactive elements
- **sm**: 0.875rem (14px) - Small text
- **xs**: 0.75rem (12px) - Captions

## Spacing

### Custom Spacing Scale
- **4.5**: 1.125rem (18px)
- **5.5**: 1.375rem (22px)
- **6.5**: 1.625rem (26px)
- **7.5**: 1.875rem (30px)

### Border Radius
- **sm**: 0.375rem (6px)
- **default**: 0.5rem (8px)
- **md**: 0.625rem (10px)
- **lg**: 0.875rem (14px) - Recommended for buttons and cards
- **xl**: 1.125rem (18px)
- **2xl**: 1.5rem (24px)
- **3xl**: 2rem (32px)

## Components

### Button

```tsx
import { Button } from "@/components";
import { Icon } from "@/components";
import { HomeIcon } from "@heroicons/react/24/outline";

<Button variant="primary" size="md">
  Click me
</Button>

<Button 
  variant="secondary" 
  icon={<Icon icon={HomeIcon} size="sm" aria-hidden />}
  iconPosition="left"
>
  Home
</Button>
```

**Variants**: `primary`, `secondary`, `ghost`  
**Sizes**: `sm`, `md`, `lg`

### IconButton

```tsx
import { IconButton, Icon } from "@/components";
import { HomeIcon } from "@heroicons/react/24/outline";

<IconButton
  icon={<Icon icon={HomeIcon} aria-hidden />}
  aria-label="Go home"
  variant="ghost"
/>
```

**Variants**: `primary`, `secondary`, `ghost`  
**Sizes**: `sm`, `md`, `lg`

### Form Components

#### Input

```tsx
import { Input } from "@/components";

<Input
  label="Email"
  type="email"
  placeholder="you@example.com"
  helperText="We'll never share your email"
  required
/>

<Input
  label="Username"
  error="Username is required"
/>
```

#### Textarea

```tsx
import { Textarea } from "@/components";

<Textarea
  label="Message"
  placeholder="Write your message..."
  helperText="Maximum 500 characters"
  required
/>
```

#### Select

```tsx
import { Select } from "@/components";

<Select
  label="Category"
  options={[
    { value: "", label: "Select a category" },
    { value: "fiction", label: "Fiction" },
    { value: "non-fiction", label: "Non-Fiction" },
  ]}
  required
/>
```

### Icon

Wrapper component for Heroicons with accessibility support:

```tsx
import { Icon } from "@/components";
import { HomeIcon } from "@heroicons/react/24/outline";

// With aria-label (for standalone icons)
<Icon icon={HomeIcon} aria-label="Home" size="md" />

// Without aria-label (decorative, aria-hidden by default)
<Icon icon={HomeIcon} size="md" />
```

**Sizes**: `xs`, `sm`, `md`, `lg`, `xl`

### Header

```tsx
import { Header } from "@/components";

<Header onMenuClick={() => console.log("Menu clicked")} />
```

### NavBar

```tsx
import { NavBar } from "@/components";
import { HomeIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

<NavBar items={[
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/search", label: "Search", icon: MagnifyingGlassIcon },
]} />
```

## Accessibility Guidelines

1. **Focus States**: All interactive elements have visible focus indicators
2. **Color Contrast**: All text meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
3. **Font Size**: Minimum 16px for interactive elements to prevent zoom on mobile
4. **Aria Labels**: Required for icon-only buttons and decorative elements
5. **Semantic HTML**: Use proper landmarks (`header`, `main`, `nav`, `footer`)
6. **Keyboard Navigation**: All interactive elements are keyboard accessible

## Usage

Visit `/design-system` to see all components in action with examples.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format
```
