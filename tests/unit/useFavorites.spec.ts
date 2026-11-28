import type { Mock } from "vitest";
import { useFavorites } from "@/composables/useFavorites";
import { loadFavoriteIds, setFavorite } from "@/services/questionList";

vi.mock("vuex", () => ({
  useStore: () => ({
    state: { user: { loginUser: { id: "7", userRole: "user" } } },
  }),
}));

vi.mock("@/services/questionList", () => ({
  loadFavoriteIds: vi.fn(),
  setFavorite: vi.fn(),
}));

const mockedLoad = loadFavoriteIds as Mock;
const mockedSet = setFavorite as Mock;

describe("favorites", () => {
  let favorites: ReturnType<typeof useFavorites>;

  beforeEach(() => {
    mockedLoad.mockReset();
    mockedSet.mockReset();
    favorites = useFavorites();
    favorites.resetForTest();
  });

  it("loads once per user", async () => {
    mockedLoad.mockResolvedValue(["1", "2"]);
    await favorites.load();
    await favorites.load();
    expect(mockedLoad).toHaveBeenCalledTimes(1);
    expect(favorites.isFavorite("2")).toBe(true);
    expect(favorites.isFavorite(3)).toBe(false);
  });

  it("stars right away and keeps it when the request succeeds", async () => {
    mockedLoad.mockResolvedValue([]);
    await favorites.load();
    let resolve!: () => void;
    mockedSet.mockReturnValue(new Promise<void>((done) => (resolve = done)));

    const result = favorites.toggle("5");
    // 请求还没回来，界面已经是收藏了
    expect(favorites.isFavorite("5")).toBe(true);
    resolve();
    await expect(result).resolves.toBe(true);
    expect(mockedSet).toHaveBeenCalledWith("5", true);
    expect(favorites.isFavorite("5")).toBe(true);
  });

  it("puts the star back when the request fails", async () => {
    mockedLoad.mockResolvedValue(["5"]);
    await favorites.load();
    mockedSet.mockRejectedValue(new Error("取消收藏失败"));

    await expect(favorites.toggle("5")).rejects.toThrow("取消收藏失败");
    expect(mockedSet).toHaveBeenCalledWith("5", false);
    expect(favorites.isFavorite("5")).toBe(true);
  });

  it("ignores a second click while the first one is still saving", async () => {
    mockedLoad.mockResolvedValue([]);
    await favorites.load();
    let resolve!: () => void;
    mockedSet.mockReturnValue(new Promise<void>((done) => (resolve = done)));

    const first = favorites.toggle("5");
    await favorites.toggle("5");
    resolve();
    await first;
    expect(mockedSet).toHaveBeenCalledTimes(1);
    expect(favorites.isFavorite("5")).toBe(true);
  });
});
