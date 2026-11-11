import { describe, expect, it } from "vitest";

// canManageCampaign vive em data.ts (importa o client Supabase), então
// isolamos o módulo mockando o servidor.
import { vi } from "vitest";
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
import { canManageCampaign } from "./data";

describe("canManageCampaign", () => {
  const author = { user: { id: "a" }, isAdmin: false };
  const admin = { user: { id: "z" }, isAdmin: true };
  const other = { user: { id: "b" }, isAdmin: false };

  it("permite autor e admin", () => {
    expect(canManageCampaign(author, "a")).toBe(true);
    expect(canManageCampaign(admin, "a")).toBe(true);
  });
  it("nega outros usuários e visitantes", () => {
    expect(canManageCampaign(other, "a")).toBe(false);
    expect(canManageCampaign(null, "a")).toBe(false);
  });
});
