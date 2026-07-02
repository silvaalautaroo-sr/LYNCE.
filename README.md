# Lynce — Official Website

**Stack:** Next.js 15 · React 19 · TypeScript · TailwindCSS · Framer Motion · next-intl · next-themes

## Quick start

```bash
npm install
npm run dev
# Open http://localhost:3000
```

## Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

Or push to GitHub and connect the repo in vercel.com — zero config required.

## Structure

```
src/
  app/
    [locale]/       # locale-scoped pages & layout (es | en)
  components/
    layout/         # Header, Footer, Logo, ThemeToggle, LocaleSwitcher
    sections/       # HeroSpline + all page sections
    ui/             # Shared primitives (GlassCard, MagneticButton, etc.)
    providers/      # ThemeProvider
  i18n/             # next-intl routing, navigation, request config
  lib/              # cn() utility
messages/
  es.json           # Spanish translations
  en.json           # English translations
public/
  logo/             # lynx-icon-light.png, lynx-icon-dark.png
```

## Hero (Spline)

`src/components/sections/HeroSpline.tsx` already contains the live Spline scene:
```tsx
<Spline scene="https://prod.spline.design/3a7WBapYGWVAENnI/scene.splinecode" />
```
To swap scenes, replace the `scene` URL.

## Themes

Dark / Light toggled via the header button. Controlled by `next-themes`.  
Logo automatically swaps between `lynx-icon-light.png` (for dark bg) and `lynx-icon-dark.png` (for light bg).

## Locales

- `/es` → Spanish (default)
- `/en` → English

Add more locales by updating `src/i18n/routing.ts` and adding a new `messages/<locale>.json`.
