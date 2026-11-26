import type { Mock } from "vitest";
import { UserControllerService } from "../../generated";
import { clearUserSummaryCache, getUserSummary } from "@/services/userSummary";

vi.mock("../../generated", () => ({
  UserControllerService: {
    getUserVoById: vi.fn(),
  },
}));

const getUserVoById = UserControllerService.getUserVoById as Mock;

describe("user summary cache", () => {
  beforeEach(() => {
    clearUserSummaryCache();
    getUserVoById.mockReset();
  });

  it("deduplicates requests for the same user id", async () => {
    getUserVoById.mockResolvedValue({
      code: 0,
      data: { id: "2013621883695575042", userName: "Nelson" },
    });

    const first = getUserSummary("2013621883695575042");
    const second = getUserSummary("2013621883695575042");

    await expect(first).resolves.toMatchObject({ userName: "Nelson" });
    await expect(second).resolves.toMatchObject({ userName: "Nelson" });
    expect(getUserVoById).toHaveBeenCalledTimes(1);
    expect(getUserVoById).toHaveBeenCalledWith("2013621883695575042");
  });

  it("returns no summary for an unsuccessful response", async () => {
    getUserVoById.mockResolvedValue({ code: 40400 });

    await expect(getUserSummary("404")).resolves.toBeUndefined();
  });
});
