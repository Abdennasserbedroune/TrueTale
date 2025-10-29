import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/Button";
import { HomeIcon } from "@heroicons/react/24/outline";

describe("Button", () => {
  it("renders with text content", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("renders with an icon", () => {
    render(
      <Button icon={<HomeIcon data-testid="home-icon" />}>
        Home
      </Button>
    );
    expect(screen.getByTestId("home-icon")).toBeInTheDocument();
  });

  it("applies correct variant styles", () => {
    const { container } = render(<Button variant="primary">Primary</Button>);
    const button = container.querySelector("button");
    expect(button).toHaveClass("bg-brand-600");
  });

  it("handles click events", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    screen.getByText("Click me").click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByText("Disabled");
    expect(button).toBeDisabled();
  });

  it("applies minimum font size class", () => {
    const { container } = render(<Button size="md">Click me</Button>);
    const button = container.querySelector("button");
    expect(button).toHaveClass("text-base");
  });
});
