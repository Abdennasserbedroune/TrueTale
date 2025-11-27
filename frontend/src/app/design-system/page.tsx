"use client";

import { Button, IconButton, Input, Textarea, Select, Icon } from "@/components";
import { HomeIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

export default function DesignSystemPage() {
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState("");

  const validateInput = (value: string) => {
    if (value.length < 3) {
      setInputError("Must be at least 3 characters");
    } else {
      setInputError("");
    }
  };

  return (
    <div className="space-y-12">
      <section>
        <h1 className="mb-2 text-4xl font-bold text-text-primary">Design System</h1>
        <p className="text-lg text-text-secondary">
          A calm, professional design system with accessible components and gentle styling.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-text-primary">Colors</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface p-6">
            <h3 className="mb-3 font-medium text-text-primary">Brand</h3>
            <div className="flex gap-2">
              {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                <div
                  key={shade}
                  className={`h-12 w-full rounded-lg bg-brand-${shade}`}
                  title={`brand-${shade}`}
                />
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-6">
            <h3 className="mb-3 font-medium text-text-primary">Background</h3>
            <div className="space-y-2">
              <div className="h-12 rounded-lg bg-bg-primary border border-border" />
              <div className="h-12 rounded-lg bg-bg-secondary border border-border" />
              <div className="h-12 rounded-lg bg-bg-tertiary border border-border" />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-6">
            <h3 className="mb-3 font-medium text-text-primary">Text</h3>
            <div className="space-y-2">
              <div className="rounded-lg bg-bg-secondary p-3 text-text-primary">Primary</div>
              <div className="rounded-lg bg-bg-secondary p-3 text-text-secondary">Secondary</div>
              <div className="rounded-lg bg-bg-secondary p-3 text-text-tertiary">Tertiary</div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-text-primary">Typography</h2>
        <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
          <p className="text-4xl">Heading 1 - Inter Font</p>
          <p className="text-3xl">Heading 2 - Clean & Professional</p>
          <p className="text-2xl">Heading 3 - Gentle Hierarchy</p>
          <p className="text-xl">Heading 4 - Readable</p>
          <p className="text-lg">Large text - Great for introductions</p>
          <p className="text-base">Base text - Default readable size (16px minimum)</p>
          <p className="text-sm">Small text - Still readable</p>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-text-primary">Buttons</h2>
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="font-medium text-text-primary">Primary Buttons</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" size="sm">
                  Small
                </Button>
                <Button variant="primary" size="md">
                  Medium
                </Button>
                <Button variant="primary" size="lg">
                  Large
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium text-text-primary">With Icons</h3>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  icon={<Icon icon={HomeIcon} size="sm" aria-hidden />}
                  iconPosition="left"
                >
                  Home
                </Button>
                <Button
                  variant="secondary"
                  icon={<Icon icon={PlusIcon} size="sm" aria-hidden />}
                  iconPosition="left"
                >
                  Add New
                </Button>
                <Button
                  variant="ghost"
                  icon={<Icon icon={TrashIcon} size="sm" aria-hidden />}
                  iconPosition="right"
                >
                  Delete
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium text-text-primary">Icon Buttons</h3>
              <div className="flex flex-wrap gap-3">
                <IconButton
                  icon={<Icon icon={HomeIcon} aria-hidden />}
                  aria-label="Go home"
                  variant="primary"
                />
                <IconButton
                  icon={<Icon icon={PlusIcon} aria-hidden />}
                  aria-label="Add item"
                  variant="secondary"
                />
                <IconButton
                  icon={<Icon icon={TrashIcon} aria-hidden />}
                  aria-label="Delete item"
                  variant="ghost"
                />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium text-text-primary">States</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Normal</Button>
                <Button variant="primary" disabled>
                  Disabled
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-text-primary">Form Components</h2>
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="max-w-md space-y-6">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              helperText="We'll never share your email"
            />

            <Input
              label="Username"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                validateInput(e.target.value);
              }}
              error={inputError}
              placeholder="Enter username"
              required
            />

            <Textarea
              label="Message"
              placeholder="Write your message here..."
              helperText="Maximum 500 characters"
            />

            <Select
              label="Category"
              options={[
                { value: "", label: "Select a category" },
                { value: "fiction", label: "Fiction" },
                { value: "non-fiction", label: "Non-Fiction" },
                { value: "poetry", label: "Poetry" },
              ]}
              required
            />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-text-primary">Spacing & Borders</h2>
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <h3 className="font-medium text-text-primary">Border Radius</h3>
              <div className="space-y-2">
                <div className="rounded-sm bg-brand-100 p-4 text-sm">Small (0.375rem)</div>
                <div className="rounded bg-brand-100 p-4 text-sm">Default (0.5rem)</div>
                <div className="rounded-lg bg-brand-100 p-4 text-sm">Large (0.875rem)</div>
                <div className="rounded-xl bg-brand-100 p-4 text-sm">XL (1.125rem)</div>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium text-text-primary">Elevated Padding</h3>
              <div className="space-y-2">
                <div className="rounded-lg bg-brand-100 p-4 text-sm">Standard padding</div>
                <div className="rounded-lg bg-brand-100 p-5 text-sm">Medium padding</div>
                <div className="rounded-lg bg-brand-100 p-6 text-sm">Large padding</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
