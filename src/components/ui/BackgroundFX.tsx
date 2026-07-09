/**
 * Flat background used everywhere EXCEPT the Hero (which renders its own
 * Canvas scene). No grid, no particles, no noise, no gradient, no
 * animation — just the theme's flat, solid background color.
 */
export function BackgroundFX() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-bg-primary"
    />
  );
}
