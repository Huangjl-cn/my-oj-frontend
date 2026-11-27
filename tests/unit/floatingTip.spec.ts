import {
  installFloatingTips,
  placeTip,
  tipAlignOf,
  tipPlacementOf,
} from "@/utils/floatingTip";

const viewport = { width: 1000, height: 800 };

// jsdom 不一定有 PointerEvent：用 MouseEvent 带上 pointerType
const pointer = (
  type: string,
  pointerType: string,
  relatedTarget: EventTarget | null = null
) =>
  Object.assign(new MouseEvent(type, { bubbles: true, relatedTarget }), {
    pointerType,
  });
const tip = { width: 80, height: 24 };
const rect = (left: number, top: number, width = 30, height = 30) => ({
  left,
  top,
  right: left + width,
  bottom: top + height,
});

describe("floating tips", () => {
  it("places the tip on the asked side", () => {
    expect(placeTip(rect(100, 100), tip, viewport, "right")).toEqual({
      placement: "right",
      left: 138,
      top: 103,
    });
    expect(placeTip(rect(100, 100), tip, viewport, "top")).toMatchObject({
      placement: "top",
      left: 75,
      top: 68,
    });
    expect(placeTip(rect(100, 100), tip, viewport, "bottom", "end")).toEqual({
      placement: "bottom",
      left: 50,
      top: 138,
    });
  });

  it("flips to the other side when there is no room", () => {
    // 面板顶上一排的按钮：往上放不下，换到下面
    expect(placeTip(rect(500, 4), tip, viewport, "top")).toMatchObject({
      placement: "bottom",
      top: 42,
    });
    // 窗口右边的按钮：右边放不下，换到左边
    expect(placeTip(rect(960, 300), tip, viewport, "right")).toMatchObject({
      placement: "left",
      left: 872,
    });
  });

  it("keeps the tip inside the window", () => {
    // 靠左的按钮往上居中会出界：收回到左边距
    expect(placeTip(rect(0, 300, 20), tip, viewport, "top").left).toBe(8);
    expect(placeTip(rect(990, 300, 10), tip, viewport, "bottom").left).toBe(
      912
    );
  });

  it("reads the direction from the old class names", () => {
    const button = document.createElement("button");
    expect(tipPlacementOf(button)).toBe("right");
    button.className = "tip-up tip-end";
    expect(tipPlacementOf(button)).toBe("top");
    expect(tipAlignOf(button)).toBe("end");
    button.className = "tip-down tip-start";
    expect(tipPlacementOf(button)).toBe("bottom");
    expect(tipAlignOf(button)).toBe("start");
  });

  it("shows on hover outside any clipping panel and hides on leave", () => {
    const uninstall = installFloatingTips(document);
    const panel = document.createElement("div");
    panel.style.overflow = "hidden";
    const button = document.createElement("button");
    button.setAttribute("data-tip", "上移");
    const icon = document.createElement("span");
    button.appendChild(icon);
    panel.appendChild(button);
    document.body.appendChild(panel);
    const layer = document.querySelector(".floating-tip") as HTMLElement;
    // 浮层挂在 body 下，不在面板里
    expect(layer.parentElement).toBe(document.body);

    icon.dispatchEvent(pointer("pointerover", "mouse"));
    expect(layer.classList.contains("on")).toBe(true);
    expect(layer.textContent).toBe("上移");

    button.dispatchEvent(pointer("pointerout", "mouse", document.body));
    expect(layer.classList.contains("on")).toBe(false);

    // 触屏点一下不显示
    icon.dispatchEvent(pointer("pointerover", "touch"));
    expect(layer.classList.contains("on")).toBe(false);

    uninstall();
    panel.remove();
    expect(document.querySelector(".floating-tip")).toBeNull();
  });
});
