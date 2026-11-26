import {
  angleTo,
  DUCK_POSES,
  duckWingAngles,
  getDuckPose,
} from "@/components/companion/duck/duckPoses";
import {
  duckBeakShapes,
  duckEyeShapes,
  ellipsePath,
} from "@/components/companion/duck/duckShapes";
import { COMPANION_MOOD_LABELS } from "@/constants/companionMoods";

describe("duck poses", () => {
  it("has a pose with a label for every mood the backend can send", () => {
    for (const mood of Object.keys(COMPANION_MOOD_LABELS)) {
      const pose = DUCK_POSES[mood as keyof typeof DUCK_POSES];
      expect(pose).toBeDefined();
      expect(pose.label).toBe(
        COMPANION_MOOD_LABELS[mood as keyof typeof COMPANION_MOOD_LABELS]
      );
    }
    expect(DUCK_POSES.idle.label).toBe("待机");
    expect(DUCK_POSES.thinking.label).toBe("思考中");
  });

  it("falls back to idle for unknown poses", () => {
    expect(getDuckPose(undefined)).toBe(DUCK_POSES.idle);
    expect(getDuckPose("nope" as never)).toBe(DUCK_POSES.idle);
  });

  it("only lets idle-like poses follow the cursor", () => {
    expect(DUCK_POSES.idle.track).toBe(true);
    expect(DUCK_POSES.drag.track).toBeFalsy();
    expect(DUCK_POSES.sleep.track).toBeFalsy();
  });

  it("dangles the feet only while held", () => {
    const held = Object.entries(DUCK_POSES)
      .filter(([, spec]) => spec.dangle)
      .map(([name]) => name)
      .sort();
    expect(held).toEqual(["dizzydrag", "drag", "fly", "grab"]);
  });
});

describe("duck wing angles", () => {
  it("measures clockwise from hanging straight down", () => {
    expect(angleTo(0, 0, 0, 10)).toBeCloseTo(0);
    // 往左（外侧）抬平是 +90°，往右是 -90°
    expect(angleTo(0, 0, -10, 0)).toBeCloseTo(90);
    expect(angleTo(0, 0, 10, 0)).toBeCloseTo(-90);
  });

  it("mirrors the two wings for symmetric poses", () => {
    for (const arms of ["rest", "up", "out", "flap", "limp", "hips"] as const) {
      const [left, right] = duckWingAngles(arms);
      expect(right).toBe(-left);
    }
  });

  it("points the wings at the face or the keyboard", () => {
    const [, chin] = duckWingAngles("chin");
    // 右翅膀往左上抬到下巴
    expect(chin).toBeGreaterThan(100);
    expect(chin).toBeLessThan(170);
    const [typeLeft, typeRight] = duckWingAngles("type");
    // 打字时两只翅膀都朝身体前面往里收
    expect(typeLeft).toBeLessThan(0);
    expect(typeRight).toBeGreaterThan(0);
  });
});

describe("duck face shapes", () => {
  it("writes ellipses as closed paths", () => {
    expect(ellipsePath(10, 20, 3, 4)).toBe(
      "M7 20 a3 4 0 1 0 6 0 a3 4 0 1 0 -6 0 Z"
    );
  });

  it("tracks and blinks open eyes only", () => {
    const dots = duckEyeShapes("dot");
    expect(dots).toHaveLength(2);
    expect(dots.every((shape) => shape.track && shape.blink)).toBe(true);
    expect(duckEyeShapes("happy").some((shape) => shape.track)).toBe(false);
    const wink = duckEyeShapes("wink");
    expect(wink.filter((shape) => shape.track)).toHaveLength(1);
  });

  it("opens the beak with a dark mouth inside", () => {
    expect(duckBeakShapes("open").some((shape) => shape.cls === "fs")).toBe(
      true
    );
    expect(duckBeakShapes("calm")).toHaveLength(2);
  });
});
