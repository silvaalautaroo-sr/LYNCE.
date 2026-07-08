/**
 * Flat background used everywhere EXCEPT the Hero (which renders its own
 * Canvas scene). No grid, no particles, no noise, no animation — just the
 * theme's flat background color plus one soft, static glow using the same
 * palette as the site's keyword gradient.
 */
export function BackgroundFX() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-bg-primary"
    >
      <div className="absolute inset-0 bg-radial-fade opacity-70" />
    </div>
  );
}
