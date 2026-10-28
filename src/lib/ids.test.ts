import { afterEach, describe, expect, it, vi } from "vitest";
import { createInquirySchema } from "@/features/inquiries/schema";
import { newId } from "./ids";

describe("newId", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("genera UUID v4 válidos aunque no exista randomUUID", () => {
    const { getRandomValues } = globalThis.crypto;
    vi.stubGlobal("crypto", { getRandomValues: getRandomValues.bind(globalThis.crypto) });
    const ids = new Set(Array.from({ length: 50 }, () => newId()));
    expect(ids.size).toBe(50);
    for (const id of ids) {
      expect(createInquirySchema.shape.id.safeParse(id).success).toBe(true);
    }
  });
});
