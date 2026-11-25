import {
  clampPetPosition,
  clampPetSize,
  parsePetPlacement,
  PET_MARGIN,
  PET_SIZE,
} from "@/composables/usePetPlacement";

describe("pet placement", () => {
  const viewport = { width: 1200, height: 800 };

  it("keeps the whole pet inside the viewport", () => {
    expect(clampPetPosition({ x: -50, y: 900 }, 64, viewport)).toEqual({
      x: PET_MARGIN,
      y: 800 - 64 - PET_MARGIN,
    });
    expect(clampPetPosition({ x: 300.4, y: 200.6 }, 64, viewport)).toEqual({
      x: 300,
      y: 201,
    });
  });

  it("limits the size", () => {
    expect(clampPetSize(10)).toBe(PET_SIZE.min);
    expect(clampPetSize(500)).toBe(PET_SIZE.max);
    expect(clampPetSize(72.6)).toBe(73);
  });

  it("falls back to the default for missing or broken storage", () => {
    const fallback = { position: null, size: PET_SIZE.default };
    expect(parsePetPlacement(null)).toEqual(fallback);
    expect(parsePetPlacement("not json")).toEqual(fallback);
    expect(parsePetPlacement('{"x":"1","y":2,"size":"big"}')).toEqual(fallback);
  });

  it("reads a saved position and size", () => {
    expect(parsePetPlacement('{"x":120,"y":80,"size":90}')).toEqual({
      position: { x: 120, y: 80 },
      size: 90,
    });
    expect(parsePetPlacement('{"size":200}')).toEqual({
      position: null,
      size: PET_SIZE.max,
    });
  });
});
