import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Input, Textarea, Select } from "@/components/Form";

describe("Input", () => {
  it("renders with label", () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("shows error message", () => {
    render(<Input label="Email" error="Invalid email" />);
    expect(screen.getByText("Invalid email")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("shows required asterisk", () => {
    render(<Input label="Email" required />);
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("shows helper text", () => {
    render(<Input label="Email" helperText="We'll never share your email" />);
    expect(screen.getByText("We'll never share your email")).toBeInTheDocument();
  });

  it("applies minimum font size class", () => {
    const { container } = render(<Input label="Email" />);
    const input = container.querySelector("input");
    expect(input).toHaveClass("text-base");
  });
});

describe("Textarea", () => {
  it("renders with label", () => {
    render(<Textarea label="Message" />);
    expect(screen.getByLabelText("Message")).toBeInTheDocument();
  });

  it("shows error message", () => {
    render(<Textarea label="Message" error="Message is required" />);
    expect(screen.getByText("Message is required")).toBeInTheDocument();
  });
});

describe("Select", () => {
  const options = [
    { value: "1", label: "Option 1" },
    { value: "2", label: "Option 2" },
  ];

  it("renders with label", () => {
    render(<Select label="Choose option" options={options} />);
    expect(screen.getByLabelText("Choose option")).toBeInTheDocument();
  });

  it("renders all options", () => {
    render(<Select label="Choose option" options={options} />);
    expect(screen.getByText("Option 1")).toBeInTheDocument();
    expect(screen.getByText("Option 2")).toBeInTheDocument();
  });
});
