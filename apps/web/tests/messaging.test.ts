import { describe, expect, it } from "vitest";
import { canMessage, createThreadId } from "@/lib/messaging";

describe("messaging permissions", () => {
  it("allows open inbox writers to receive messages from anyone", () => {
    expect(canMessage("writer-aria", "writer-jules")).toBe(true);
    expect(canMessage("writer-ronin", "writer-jules")).toBe(true);
  });

  it("restricts messaging to followers when required", () => {
    // Aria only accepts messages from writers who follow her.
    expect(canMessage("writer-jules", "writer-aria")).toBe(true);
    expect(canMessage("writer-ronin", "writer-aria")).toBe(false);

    // Ronin only accepts followers; Jules does not follow Ronin.
    expect(canMessage("writer-jules", "writer-ronin")).toBe(false);
    expect(canMessage("writer-aria", "writer-ronin")).toBe(true);
  });

  it("requires mutual follows when preference is set to mutuals", () => {
    expect(canMessage("writer-aria", "writer-nova")).toBe(true);
    expect(canMessage("writer-jules", "writer-nova")).toBe(false);
  });

  it("prevents writers from messaging themselves", () => {
    expect(canMessage("writer-aria", "writer-aria")).toBe(false);
  });
});

describe("thread identifiers", () => {
  it("creates deterministic thread ids irrespective of order", () => {
    const ab = createThreadId("writer-aria", "writer-jules");
    const ba = createThreadId("writer-jules", "writer-aria");
    expect(ab).toEqual(ba);
    expect(ab).toContain("writer-aria");
    expect(ab).toContain("writer-jules");
  });
});
