import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import "../css/onboarding.css";

/**
 * First-visit guide, in two moments remembered one by one:
 * - "cards", on the home page: everything goes dark but the centred card,
 *   and a dialogue box says to click it;
 * - "model", on a character page: only the model stays lit, and the box says
 *   how to turn it and zoom.
 *
 * Each moment shows once per dex. The five dex share one origin
 * (fchapoulliep.github.io), hence one localStorage: the key carries the base
 * path, so that having seen one dex does not hide the guide of another.
 *
 * This file is the same in every dex. What differs (the words, the card to
 * light) comes in through the props, and the colours through the --ob-*
 * variables of each dex's App.css (see onboarding.css).
 */

export type OnboardingStep = "cards" | "model";

interface OnboardingProps {
  step: OnboardingStep;
  /** The sentence, for a mouse and for a touch screen. */
  text: { mouse: string; touch: string };
  /** Label of the button that closes the guide. */
  button: string;
  /** "cards" only: CSS selector of the element to light, the centred card. */
  target?: string;
  /** False while the page is not ready to be looked at, such as a model still loading. */
  ready?: boolean;
}

/** Time for the page to settle (the centred card grows, the model comes forward). */
const SHOW_DELAY_MS = 700;
/** Matches the fade-out in onboarding.css. */
const LEAVE_MS = 200;
/** Room left around the lit card, enough for its shadow. */
const CARD_PADDING = 12;
/** The dashed ring runs just outside the hole, on the dark layer, where any light colour reads. */
const RING_GAP = 6;
/** Gap between the dialogue box and the edges of the screen. */
const EDGE = 16;
/**
 * Oval lit on a character page. The camera frames the model after the height
 * of the screen, so the oval follows the height, narrowed on a phone held upright.
 */
const MODEL_CENTER_Y = 0.5;
const MODEL_HALF_HEIGHT = 0.4;
const MODEL_MAX_HALF_WIDTH = 0.46;

const storageKey = (step: OnboardingStep) => `onboarding:${import.meta.env.BASE_URL}${step}`;

/** Covers a browser that blocks storage: the guide then shows once per visit. */
const seenThisVisit = new Set<OnboardingStep>();

function alreadySeen(step: OnboardingStep) {
  if (seenThisVisit.has(step)) return true;
  try {
    return localStorage.getItem(storageKey(step)) === "seen";
  } catch {
    return false;
  }
}

function markSeen(step: OnboardingStep) {
  seenThisVisit.add(step);
  try {
    localStorage.setItem(storageKey(step), "seen");
  } catch {
    // Storage blocked (private browsing, site data refused): remembered for this visit only
  }
}

type Hole =
  | { shape: "rect"; x: number; y: number; width: number; height: number; radius: number }
  | { shape: "oval"; x: number; y: number; radiusX: number; radiusY: number };

interface Layout {
  width: number;
  height: number;
  hole: Hole;
  /** The dialogue box moves to the top when it would cover the lit card. */
  boxAtTop: boolean;
}

/** Where the hole goes this frame, or null while the card to light is not on screen. */
function measureHole(step: OnboardingStep, target: string | undefined): Hole | null {
  const width = window.innerWidth;
  const height = window.innerHeight;
  if (step === "model") {
    const radiusY = height * MODEL_HALF_HEIGHT;
    return {
      shape: "oval",
      x: width / 2,
      y: height * MODEL_CENTER_Y,
      radiusX: Math.min(radiusY, width * MODEL_MAX_HALF_WIDTH),
      radiusY,
    };
  }
  const element = target ? document.querySelector(target) : null;
  if (!element) return null;
  const box = element.getBoundingClientRect();
  if (box.width === 0 || box.height === 0) return null;
  const radius = parseFloat(getComputedStyle(element).borderTopLeftRadius) || 0;
  return {
    shape: "rect",
    x: box.left - CARD_PADDING,
    y: box.top - CARD_PADDING,
    width: box.width + 2 * CARD_PADDING,
    height: box.height + 2 * CARD_PADDING,
    radius: radius + CARD_PADDING,
  };
}

/** The hole as a sub-path: with the even-odd rule, it is cut out of the dark layer. */
function holePath(hole: Hole) {
  if (hole.shape === "oval") {
    const { x, y, radiusX: rx, radiusY: ry } = hole;
    return `M${x - rx} ${y}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;
  }
  const { x, y, width: w, height: h } = hole;
  const r = Math.min(hole.radius, w / 2, h / 2);
  return (
    `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}` +
    `V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}` +
    `H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}` +
    `V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`
  );
}

function ringStyle(hole: Hole): React.CSSProperties {
  if (hole.shape === "oval") {
    return {
      left: hole.x - hole.radiusX - RING_GAP,
      top: hole.y - hole.radiusY - RING_GAP,
      width: 2 * (hole.radiusX + RING_GAP),
      height: 2 * (hole.radiusY + RING_GAP),
      borderRadius: "50%",
    };
  }
  return {
    left: hole.x - RING_GAP,
    top: hole.y - RING_GAP,
    width: hole.width + 2 * RING_GAP,
    height: hole.height + 2 * RING_GAP,
    borderRadius: hole.radius + RING_GAP,
  };
}

type Phase = "waiting" | "shown" | "leaving" | "done";

const Onboarding: React.FC<OnboardingProps> = ({ step, text, button, target, ready = true }) => {
  const [phase, setPhase] = useState<Phase>(() => (alreadySeen(step) ? "done" : "waiting"));
  const [layout, setLayout] = useState<Layout | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const textId = useId();

  const touch = useMemo(
    () => window.matchMedia?.("(hover: none) and (pointer: coarse)").matches ?? false,
    [],
  );

  // Shows once the page is ready and has had time to settle
  useEffect(() => {
    if (phase !== "waiting" || !ready) return;
    const timer = setTimeout(() => setPhase("shown"), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [phase, ready]);

  const dismiss = useCallback(() => {
    if (phaseRef.current !== "shown") return;
    markSeen(step);
    setPhase("leaving");
  }, [step]);

  useEffect(() => {
    if (phase !== "leaving") return;
    const timer = setTimeout(() => setPhase("done"), LEAVE_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  // Leaving the page while the guide is up (a click on the lit card) counts as seen
  useEffect(
    () => () => {
      if (phaseRef.current === "shown") markSeen(step);
    },
    [step],
  );

  // The lit card moves (carousel arrows, keyboard, resize, its own growth and
  // tilt): the hole follows it every frame, and React only re-renders on a change.
  useEffect(() => {
    if (phase !== "shown" && phase !== "leaving") return;
    let frame = 0;
    let last = "";
    const tick = () => {
      const hole = measureHole(step, target);
      const width = window.innerWidth;
      const height = window.innerHeight;
      let boxAtTop = false;
      const box = boxRef.current?.getBoundingClientRect();
      if (hole?.shape === "rect" && box) {
        const holeBottom = hole.y + hole.height;
        const coversCard = height - EDGE - box.height < holeBottom;
        boxAtTop = coversCard && hole.y > height - holeBottom;
      }
      const next = hole && { width, height, hole, boxAtTop };
      const key = JSON.stringify(next, (_, value) =>
        typeof value === "number" ? Math.round(value) : value,
      );
      if (key !== last) {
        last = key;
        setLayout(next);
      }
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [phase, step, target]);

  // Any gesture closes it: Escape, a press outside the box (on the dark layer, or
  // straight on the model to turn it), the mouse wheel (zooming).
  useEffect(() => {
    if (phase !== "shown") return;
    buttonRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    const onPointer = (event: PointerEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) dismiss();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer, true);
    window.addEventListener("wheel", dismiss, { capture: true, passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer, true);
      window.removeEventListener("wheel", dismiss, { capture: true });
    };
  }, [phase, dismiss]);

  if (phase === "waiting" || phase === "done" || !layout) return null;

  const { width, height, hole, boxAtTop } = layout;
  return createPortal(
    <div className={`onboarding onboarding-${step}${phase === "leaving" ? " leaving" : ""}`}>
      <svg className="onboarding-dim" width={width} height={height} aria-hidden="true">
        <path d={`M0 0H${width}V${height}H0Z${holePath(hole)}`} fillRule="evenodd" />
      </svg>
      <div className="onboarding-ring" style={ringStyle(hole)} />
      <div
        ref={boxRef}
        className={`onboarding-box${boxAtTop ? " top" : ""}`}
        role="dialog"
        aria-labelledby={textId}
      >
        <p id={textId}>{touch ? text.touch : text.mouse}</p>
        <button ref={buttonRef} type="button" onClick={dismiss}>
          <svg viewBox="0 0 10 10" aria-hidden="true">
            <path d="M2 1 9 5 2 9Z" />
          </svg>
          {button}
        </button>
      </div>
    </div>,
    document.body,
  );
};

export default Onboarding;
