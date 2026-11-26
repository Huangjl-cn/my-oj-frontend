import { toFlightRect, useDuckFlight } from "@/composables/useDuckFlight";

const rect = (x: number, size: number) => ({ x, y: 10, size });

describe("duck flight", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("hides both ends while flying and lands when finished", () => {
    const { flight, fly, finish } = useDuckFlight();
    const land = vi.fn();
    fly(rect(0, 56), rect(500, 40), land);
    expect(flight.active).toBe(true);
    expect(flight.from).toEqual(rect(0, 56));
    expect(flight.to).toEqual(rect(500, 40));
    finish(flight.id);
    expect(flight.active).toBe(false);
    expect(land).toHaveBeenCalledTimes(1);
  });

  it("ignores an older flight finishing after a newer one started", () => {
    const { flight, fly, finish } = useDuckFlight();
    const first = vi.fn();
    const second = vi.fn();
    fly(rect(0, 56), rect(500, 40), first);
    const oldId = flight.id;
    fly(rect(500, 40), rect(0, 56), second);
    finish(oldId);
    expect(flight.active).toBe(true);
    finish(flight.id);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("lands right away when the system asks for less motion", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const { flight, fly } = useDuckFlight();
    const land = vi.fn();
    const before = flight.id;
    fly(rect(0, 56), rect(500, 40), land);
    expect(land).toHaveBeenCalledTimes(1);
    expect(flight.id).toBe(before);
  });

  it("turns element boxes into square flight rects", () => {
    expect(toFlightRect({ left: 5, top: 6, width: 40, height: 44 })).toEqual({
      x: 5,
      y: 6,
      size: 44,
    });
    expect(toFlightRect({ left: 0, top: 0, width: 0, height: 0 })).toBeNull();
    expect(toFlightRect(null)).toBeNull();
  });
});
