import { describe, expect, it } from "vitest";
import { timeAgo } from "./format";

describe("timeAgo", () => {
  const now = new Date("2026-11-05T12:00:00Z").getTime();
  it("formata em português", () => {
    expect(timeAgo("2026-11-02T12:00:00Z", now)).toBe("há 3 dias");
    expect(timeAgo("2026-11-05T10:00:00Z", now)).toBe("há 2 horas");
    expect(timeAgo("2026-11-05T11:59:50Z", now)).toBe("agora há pouco");
  });
});
