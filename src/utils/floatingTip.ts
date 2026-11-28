/**
 * 悬停提示：元素上写 data-tip，就在鼠标移上去（或键盘聚焦）时显示。
 *
 * 提示画在 body 下的一个浮层里（position: fixed），不受面板 overflow: hidden 裁剪。
 * 方向沿用原来的类名：默认在右边，tip-up 在上面，tip-down 在下面；tip-end / tip-start 让上下方向的提示
 * 和元素右边 / 左边对齐。放不下时换到对面，再收进窗口里。
 */

export type TipPlacement = "right" | "left" | "top" | "bottom";
export type TipAlign = "center" | "start" | "end";

type Rect = { left: number; top: number; right: number; bottom: number };
type Size = { width: number; height: number };

/** 提示和元素之间的距离 */
const OFFSET = 8;
/** 离窗口边缘至少这么远 */
const MARGIN = 8;

const OPPOSITE: Record<TipPlacement, TipPlacement> = {
  right: "left",
  left: "right",
  top: "bottom",
  bottom: "top",
};

const position = (
  anchor: Rect,
  tip: Size,
  placement: TipPlacement,
  align: TipAlign
) => {
  const width = anchor.right - anchor.left;
  const height = anchor.bottom - anchor.top;
  if (placement === "right" || placement === "left") {
    return {
      left:
        placement === "right"
          ? anchor.right + OFFSET
          : anchor.left - OFFSET - tip.width,
      top: anchor.top + height / 2 - tip.height / 2,
    };
  }
  const left =
    align === "start"
      ? anchor.left
      : align === "end"
      ? anchor.right - tip.width
      : anchor.left + width / 2 - tip.width / 2;
  return {
    left,
    top:
      placement === "top"
        ? anchor.top - OFFSET - tip.height
        : anchor.bottom + OFFSET,
  };
};

const fits = (
  point: { left: number; top: number },
  tip: Size,
  viewport: Size
) =>
  point.left >= MARGIN &&
  point.top >= MARGIN &&
  point.left + tip.width <= viewport.width - MARGIN &&
  point.top + tip.height <= viewport.height - MARGIN;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max));

/**
 * 算提示的位置：先按要求的方向放，放不下换到对面，最后收进窗口里
 */
export const placeTip = (
  anchor: Rect,
  tip: Size,
  viewport: Size,
  placement: TipPlacement,
  align: TipAlign = "center"
) => {
  let side = placement;
  let point = position(anchor, tip, side, align);
  if (!fits(point, tip, viewport)) {
    const flipped = position(anchor, tip, OPPOSITE[side], align);
    if (fits(flipped, tip, viewport)) {
      side = OPPOSITE[side];
      point = flipped;
    }
  }
  return {
    placement: side,
    left: clamp(point.left, MARGIN, viewport.width - MARGIN - tip.width),
    top: clamp(point.top, MARGIN, viewport.height - MARGIN - tip.height),
  };
};

export const tipPlacementOf = (element: Element): TipPlacement => {
  if (element.classList.contains("tip-up")) return "top";
  if (element.classList.contains("tip-down")) return "bottom";
  return "right";
};

export const tipAlignOf = (element: Element): TipAlign => {
  if (element.classList.contains("tip-end")) return "end";
  if (element.classList.contains("tip-start")) return "start";
  return "center";
};

/**
 * 装上全局的悬停提示（main.ts 调一次）。返回卸载函数（测试用）
 */
export const installFloatingTips = (doc: Document = document) => {
  const tip = doc.createElement("div");
  tip.className = "floating-tip";
  // 元素自己有 aria-label，提示只是给眼睛看的
  tip.setAttribute("aria-hidden", "true");
  doc.body.appendChild(tip);

  let current: HTMLElement | null = null;

  const hide = () => {
    current = null;
    tip.classList.remove("on");
  };

  const show = (element: HTMLElement) => {
    const text = element.getAttribute("data-tip");
    if (!text) {
      hide();
      return;
    }
    current = element;
    tip.textContent = text;
    // 先放到左上角量出大小，再摆到位置上
    tip.style.left = "0px";
    tip.style.top = "0px";
    tip.classList.add("on");
    const anchor = element.getBoundingClientRect();
    const view = doc.defaultView;
    const { placement, left, top } = placeTip(
      anchor,
      { width: tip.offsetWidth, height: tip.offsetHeight },
      {
        width: view?.innerWidth ?? doc.documentElement.clientWidth,
        height: view?.innerHeight ?? doc.documentElement.clientHeight,
      },
      tipPlacementOf(element),
      tipAlignOf(element)
    );
    tip.dataset.placement = placement;
    tip.style.left = `${Math.round(left)}px`;
    tip.style.top = `${Math.round(top)}px`;
  };

  const tipTarget = (target: EventTarget | null) =>
    target instanceof Element
      ? target.closest<HTMLElement>("[data-tip]")
      : null;

  const onPointerOver = (event: PointerEvent) => {
    // 触屏点一下不显示（会一直留在那里）
    if (event.pointerType === "touch") return;
    const element = tipTarget(event.target);
    if (element === current) return;
    if (element) show(element);
    else hide();
  };

  const onPointerOut = (event: PointerEvent) => {
    if (!current) return;
    const next = event.relatedTarget;
    if (next instanceof Node && current.contains(next)) return;
    hide();
  };

  const onFocusIn = (event: FocusEvent) => {
    const element = tipTarget(event.target);
    if (
      element &&
      element === event.target &&
      element.matches(":focus-visible")
    ) {
      show(element);
    }
  };

  const onFocusOut = () => hide();
  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape") hide();
  };

  doc.addEventListener("pointerover", onPointerOver, true);
  doc.addEventListener("pointerout", onPointerOut, true);
  doc.addEventListener("focusin", onFocusIn, true);
  doc.addEventListener("focusout", onFocusOut, true);
  // 点下去、滚动、改窗口大小、按 Esc：提示的位置不再对，先收起
  doc.addEventListener("pointerdown", hide, true);
  doc.addEventListener("scroll", hide, true);
  doc.addEventListener("keydown", onKeydown, true);
  doc.defaultView?.addEventListener("resize", hide);

  return () => {
    doc.removeEventListener("pointerover", onPointerOver, true);
    doc.removeEventListener("pointerout", onPointerOut, true);
    doc.removeEventListener("focusin", onFocusIn, true);
    doc.removeEventListener("focusout", onFocusOut, true);
    doc.removeEventListener("pointerdown", hide, true);
    doc.removeEventListener("scroll", hide, true);
    doc.removeEventListener("keydown", onKeydown, true);
    doc.defaultView?.removeEventListener("resize", hide);
    tip.remove();
  };
};
