import "@/plugins/axios";
import { OpenAPI } from "../../generated";

describe("generated API runtime configuration", () => {
  it("uses the application proxy and sends session credentials", () => {
    expect(OpenAPI.BASE).toBe("/api");
    expect(OpenAPI.WITH_CREDENTIALS).toBe(true);
    expect(OpenAPI.CREDENTIALS).toBe("include");
  });
});
