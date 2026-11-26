import { nextTick, ref } from "vue";

import { PetMood } from "@/constants/companionMoods";
import {
  PET_TIMING,
  PetActivity,
  usePetBehavior,
} from "@/composables/usePetBehavior";

const setup = () => {
  const mood = ref<PetMood>("idle");
  const beat = ref(0);
  const activity = ref<PetActivity>(null);
  const typing = ref(0);
  const behavior = usePetBehavior({
    mood: () => mood.value,
    beat: () => beat.value,
    activity: () => activity.value,
    typingBeat: () => typing.value,
    // 随机小动作固定挑第一个，间隔取最短
    random: () => 0,
  });
  const setMood = async (value: PetMood) => {
    mood.value = value;
    beat.value += 1;
    await nextTick();
  };
  return { mood, beat, activity, typing, behavior, setMood };
};

/** 模拟拖动：每 16ms 动一下，dx 是每步的横向位移 */
const dragFor = (
  behavior: ReturnType<typeof usePetBehavior>,
  steps: number,
  dx: (step: number) => number
) => {
  let x = 100;
  behavior.dragMove(x, 100);
  for (let i = 1; i <= steps; i++) {
    vi.advanceTimersByTime(16);
    x += dx(i);
    behavior.dragMove(x, 100);
  }
};

describe("pet behavior", () => {
  let current: ReturnType<typeof setup>;

  beforeEach(() => {
    vi.useFakeTimers();
    current = setup();
  });

  afterEach(() => {
    current.behavior.dispose();
    vi.useRealTimers();
  });

  it("never shows the grab pose for a quick click", () => {
    const { behavior } = current;
    const seen: string[] = [];
    behavior.pressStart();
    for (let t = 0; t < 120; t += 20) {
      vi.advanceTimersByTime(20);
      seen.push(behavior.pose.value);
    }
    behavior.release(false);
    vi.advanceTimersByTime(400);
    seen.push(behavior.pose.value);
    expect(seen.every((pose) => pose === "idle")).toBe(true);
  });

  it("lifts the duck after holding still, then lands", () => {
    const { behavior } = current;
    behavior.pressStart();
    vi.advanceTimersByTime(PET_TIMING.grabDelay + 10);
    expect(behavior.pose.value).toBe("grab");
    behavior.release(false);
    expect(behavior.pose.value).toBe("land");
    vi.advanceTimersByTime(PET_TIMING.land + 250);
    expect(behavior.pose.value).toBe("idle");
  });

  it("switches to dragging as soon as it moves, without waiting for the grab delay", () => {
    const { behavior } = current;
    behavior.pressStart();
    behavior.dragMove(100, 100);
    expect(behavior.pose.value).toBe("drag");
    vi.advanceTimersByTime(PET_TIMING.grabDelay + 50);
    expect(behavior.pose.value).toBe("drag");
  });

  it("gets dizzy when shaken hard, and wobbles after landing", () => {
    const { behavior } = current;
    behavior.pressStart();
    dragFor(behavior, 50, (i) => (i % 2 ? 60 : -60));
    expect(behavior.pose.value).toBe("dizzydrag");
    behavior.release(true);
    expect(behavior.pose.value).toBe("land");
    vi.advanceTimersByTime(PET_TIMING.land + 250);
    expect(behavior.pose.value).toBe("dizzy");
    vi.advanceTimersByTime(PET_TIMING.dizzy + 250);
    expect(behavior.pose.value).toBe("idle");
  });

  it("flies when dragged slowly for a while", () => {
    const { behavior } = current;
    behavior.pressStart();
    dragFor(behavior, 120, () => 4);
    expect(behavior.pose.value).toBe("fly");
  });

  it("plays a mood for a while, but keeps thinking until told otherwise", async () => {
    const { behavior, setMood } = current;
    await setMood("excited");
    expect(behavior.pose.value).toBe("excited");
    vi.advanceTimersByTime(PET_TIMING.reaction + 250);
    expect(behavior.pose.value).toBe("idle");

    await setMood("thinking");
    vi.advanceTimersByTime(PET_TIMING.reaction * 3);
    expect(behavior.pose.value).toBe("thinking");
    await setMood("idle");
    expect(behavior.pose.value).toBe("idle");
  });

  it("replays the same mood when it comes again", async () => {
    const { behavior, setMood } = current;
    await setMood("encouraging");
    const key = behavior.poseKey.value;
    await setMood("encouraging");
    expect(behavior.poseKey.value).toBeGreaterThan(key);
  });

  it("types while answering and waits nervously while judging", async () => {
    const { behavior, activity, setMood } = current;
    await setMood("thinking");
    activity.value = "talking";
    await nextTick();
    expect(behavior.pose.value).toBe("talking");
    activity.value = "judging";
    await nextTick();
    expect(behavior.pose.value).toBe("judging");
    activity.value = null;
    await nextTick();
    expect(behavior.pose.value).toBe("thinking");
  });

  it("lets dragging interrupt everything", async () => {
    const { behavior, activity } = current;
    activity.value = "judging";
    await nextTick();
    behavior.pressStart();
    behavior.dragMove(10, 10);
    expect(behavior.pose.value).toBe("drag");
    behavior.release(true);
    vi.advanceTimersByTime(PET_TIMING.land + 250);
    expect(behavior.pose.value).toBe("judging");
  });

  it("watches the code while you type", async () => {
    const { behavior, typing } = current;
    typing.value += 1;
    await nextTick();
    expect(behavior.pose.value).toBe("watch");
    vi.advanceTimersByTime(PET_TIMING.watch + 250);
    expect(behavior.pose.value).toBe("idle");
  });

  it("waves once when hovered, then cools down", () => {
    const { behavior } = current;
    behavior.hover();
    expect(behavior.pose.value).toBe("wave");
    vi.advanceTimersByTime(PET_TIMING.wave + 250);
    behavior.hover();
    expect(behavior.pose.value).toBe("idle");
  });

  it("does a small idle action now and then", () => {
    const { behavior } = current;
    vi.advanceTimersByTime(PET_TIMING.idleActionMin + 250);
    expect(behavior.pose.value).toBe("lookaround");
    vi.advanceTimersByTime(PET_TIMING.idleAction + 250);
    expect(behavior.pose.value).toBe("idle");
  });

  it("falls asleep when nobody is around, and wakes up startled", () => {
    const { behavior } = current;
    vi.advanceTimersByTime(PET_TIMING.sleepAfter + 250);
    expect(behavior.pose.value).toBe("yawn");
    vi.advanceTimersByTime(PET_TIMING.yawn + 250);
    expect(behavior.pose.value).toBe("doze");
    vi.advanceTimersByTime(PET_TIMING.doze + 250);
    expect(behavior.pose.value).toBe("sleep");

    // 鼠标轻轻抖一下不算
    behavior.noteUserActivity({ x: 0, y: 0 });
    behavior.noteUserActivity({ x: 10, y: 10 });
    expect(behavior.pose.value).toBe("sleep");
    behavior.noteUserActivity({ x: 80, y: 0 });
    expect(behavior.pose.value).toBe("startled");
    vi.advanceTimersByTime(PET_TIMING.startled + 250);
    expect(behavior.pose.value).toBe("idle");
  });

  it("lands with a squash after flying to a new place", () => {
    const { behavior } = current;
    behavior.land();
    expect(behavior.pose.value).toBe("land");
    vi.advanceTimersByTime(PET_TIMING.land + 250);
    expect(behavior.pose.value).toBe("idle");
  });

  it("wakes up quietly when the companion has something to say", async () => {
    const { behavior, setMood } = current;
    vi.advanceTimersByTime(
      PET_TIMING.sleepAfter + PET_TIMING.yawn + PET_TIMING.doze + 500
    );
    expect(behavior.pose.value).toBe("sleep");
    await setMood("proud");
    expect(behavior.pose.value).toBe("proud");
  });
});
