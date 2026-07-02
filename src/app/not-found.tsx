export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <p className="text-xs font-medium uppercase tracking-widest text-ink-faint">
        404
      </p>
      <h1 className="text-4xl font-medium tracking-tight text-ink">
        Page not found
      </h1>
      <a
        href="/es"
        className="mt-4 text-sm text-accent-primary transition-opacity hover:opacity-80"
      >
        ← Go home
      </a>
    </div>
  );
}
