import { parseRouteApiId, toGeneratedApiId } from "@/services/apiId";

describe("API ID precision", () => {
  const longId = "2013621883695575042";

  it("preserves a Long ID from the route as a decimal string", () => {
    const parsed = parseRouteApiId(longId);

    expect(parsed).toBe(longId);
    if (parsed == null) throw new Error("expected a valid API ID");
    expect(toGeneratedApiId(parsed)).toBe(longId);
  });

  it("rejects invalid and already unsafe numeric route IDs", () => {
    expect(parseRouteApiId("not-an-id")).toBeUndefined();
    expect(parseRouteApiId(Number(longId))).toBeUndefined();
  });
});
