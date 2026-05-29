import { describe, expect, it } from "vitest";

import { assertValidOrderTransition, canTransitionOrder } from "@/lib/order/status";

describe("order status transitions", () => {
  it("allows the normal order flow", () => {
    expect(canTransitionOrder("pending_confirm", "confirmed")).toBe(true);
    expect(canTransitionOrder("confirmed", "purchasing")).toBe(true);
    expect(canTransitionOrder("purchasing", "ready_to_ship")).toBe(true);
    expect(canTransitionOrder("ready_to_ship", "shipped")).toBe(true);
    expect(canTransitionOrder("shipped", "completed")).toBe(true);
  });

  it("rejects invalid jumps", () => {
    expect(canTransitionOrder("pending_confirm", "shipped")).toBe(false);
    expect(() => assertValidOrderTransition("completed", "exception")).toThrow();
  });

  it("allows exception recovery paths", () => {
    expect(canTransitionOrder("exception", "confirmed")).toBe(true);
    expect(canTransitionOrder("exception", "purchasing")).toBe(true);
    expect(canTransitionOrder("exception", "cancelled")).toBe(true);
  });
});
