/**
 * Shared motion spec for every overlay in the system.
 *
 * One rule, applied everywhere: overlays *enter* fast and decisively from the
 * direction of their anchor, and *leave* faster than they arrive. Anchored
 * surfaces (menu, select, popover, tooltip) slide 4px against `data-side`;
 * centred surfaces (dialog) scale from 96%.
 *
 * Base UI drives these with `data-starting-style` / `data-ending-style`, which
 * are present only for one frame at each end of the transition.
 */

export const anchoredMotion = [
  "transition-[opacity,transform] ease-(--ease-out-quint)",
  "duration-(--duration-fast)",
  "data-[ending-style]:duration-(--duration-instant)",
  "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
  "data-[side=bottom]:data-[starting-style]:-translate-y-1",
  "data-[side=top]:data-[starting-style]:translate-y-1",
  "data-[side=left]:data-[starting-style]:translate-x-1",
  "data-[side=right]:data-[starting-style]:-translate-x-1",
  "data-[side=bottom]:data-[ending-style]:-translate-y-1",
  "data-[side=top]:data-[ending-style]:translate-y-1",
  "data-[side=left]:data-[ending-style]:translate-x-1",
  "data-[side=right]:data-[ending-style]:-translate-x-1",
].join(" ");

export const centredMotion = [
  "transition-[opacity,transform,scale] ease-(--ease-out-expo)",
  "duration-(--duration-normal)",
  "data-[ending-style]:duration-(--duration-fast)",
  "data-[starting-style]:scale-96 data-[starting-style]:opacity-0",
  "data-[ending-style]:scale-96 data-[ending-style]:opacity-0",
].join(" ");

export const backdropMotion = [
  "fixed inset-0 z-50 bg-graphite-1000/55 backdrop-blur-[3px]",
  "transition-opacity duration-(--duration-normal) ease-(--ease-out-quint)",
  "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
].join(" ");

/** The visual body every floating surface shares. */
export const popupSurface = [
  "z-50 rounded-xl border border-line bg-surface-raised text-ink shadow-e4",
  "origin-(--transform-origin) outline-none",
].join(" ");

export function sheetMotion(side: "left" | "right" | "top" | "bottom") {
  const axis = {
    left: "data-[starting-style]:-translate-x-full data-[ending-style]:-translate-x-full",
    right: "data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full",
    top: "data-[starting-style]:-translate-y-full data-[ending-style]:-translate-y-full",
    bottom: "data-[starting-style]:translate-y-full data-[ending-style]:translate-y-full",
  }[side];
  return [
    "transition-transform duration-(--duration-normal) ease-(--ease-out-expo)",
    "data-[ending-style]:duration-(--duration-fast)",
    axis,
  ].join(" ");
}
