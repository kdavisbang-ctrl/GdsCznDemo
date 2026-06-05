# Gideon's Chosen — Senior Software Engineering Studio

A cinematic single-page marketing site for a senior-only software studio. Designed in Claude Design, implemented as production-grade plain HTML/CSS/JS.

## Live site

**[https://kdavisbang-ctrl.github.io/GdsCznDemo/](https://kdavisbang-ctrl.github.io/GdsCznDemo/)**

## Dev preview

No build step required. Serve the root directory with any static file server:

```bash
# Option 1 — Python (built into macOS/Linux)
python3 -m http.server 8080
# then open http://localhost:8080

# Option 2 — Node (npx, no install)
npx serve .
# then open http://localhost:3000

# Option 3 — VS Code Live Server extension
# Right-click index.html → Open with Live Server
```

## File structure

```
index.html              Main page
css/
  styles.css            Design system: tokens, layout, all components
js/
  hero.js               Engineering mesh canvas (node field + proximity links)
  space.js              Starfield class — 3D parallax idle + hyperspace warp
  porch.js              Space-portal intro gate + pinned scenic hero scroll
  scroll.js             Scroll reveals, progress bar, counters, parallax
tweaks-panel.jsx        Reusable React UI controls scaffold
tweaks.jsx              Live design tweaks (accent, font, motion, bg darkness)
```

## Sections

1. **Space portal intro** — held full-screen entry with live 3D starfield, crescent moon, shooting stars, nebula auras, rocket launch, floating terminal monitor, and a hyperspace warp on "Launch"
2. **Hero** — pinned scenic-scroll stage with engineering mesh canvas and staged entrance
3. **Trust bar** — client logo strip
4. **Services** — 6-card capability grid
5. **Process** — 4-step timeline with progressive lighting
6. **Tech stack** — 12-tile technology grid
7. **Case studies** — 3 problem→solution→result cards with metrics
8. **Why us** — 3 differentiator pillars
9. **Testimonials** — 2 client quotes
10. **CTA band** — conversion section
11. **Footer** — nav, contact, socials, "Return to space" control

## Contact form — Supabase setup

The "Book a call" / "Start a project" buttons open a modal form that submits to Supabase.

### 1 — Create a Supabase project

Sign up at [supabase.com](https://supabase.com), create a new project, then run this SQL in the **SQL Editor**:

```sql
create table contact_submissions (
  id          uuid        primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  name        text        not null,
  email       text        not null,
  company     text,
  project_type text,
  budget      text,
  timeline    text,
  message     text        not null
);

-- Enable Row Level Security
alter table contact_submissions enable row level security;

-- Allow anyone to INSERT (submit the form), but nobody can SELECT via the anon key
create policy "public insert only"
  on contact_submissions
  for insert
  to anon
  with check (true);
```

### 2 — Add your credentials to index.html

In `index.html`, find this block and replace the placeholders:

```html
<script>
  window.GC_SUPABASE_URL = 'YOUR_SUPABASE_URL';   // e.g. https://xxxx.supabase.co
  window.GC_SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Settings → API → anon public
</script>
```

Both values are in your Supabase project under **Settings → API**. The anon key is safe to expose in client-side code — the RLS policy above ensures it can only insert, never read.

### 3 — View submissions

Go to **Table Editor → contact_submissions** in your Supabase dashboard.

---

## Design tokens

All design values live in `:root` in `css/styles.css`. Key tokens:

| Token | Value | Notes |
|---|---|---|
| `--accent` | `#A78BFA` | Violet — user-swappable via Tweaks panel |
| `--bg` | `oklch(7% 0.022 268)` | Deep navy |
| `--font-display` | Space Grotesk | Headings |
| `--font-body` | Manrope | Body text |
| `--font-mono` | JetBrains Mono | Labels, code, eyebrows |
| `--ease` | `cubic-bezier(0.16, 1, 0.3, 1)` | Spring-like easing |

## Tweaks panel

A React-powered design controls panel (bottom-right corner, activated from the Claude Design toolbar) lets you live-edit: accent color, headline font, cinematic motion on/off, and background darkness. Settings persist to `localStorage`.

## Assumptions & design notes

- **Placeholder content:** Client logos, case study visuals, testimonial avatars, and metrics are realistic placeholders — intended to be swapped for real assets.
- **Email:** Contact links point to `hello@gideonschosen.dev` — update to your real address.
- **Social links:** X and LinkedIn point to `#` — update to real profile URLs.
- **GitHub Pages:** Set the Pages source to the `main` branch root (`/`). No build step; the site is pure static HTML/CSS/JS.
- **React/Babel:** Loaded from unpkg CDN (production builds) for the Tweaks panel only. The rest of the site has zero JS dependencies.
- **`prefers-reduced-motion`:** All animations (canvas, CSS keyframes, scroll reveals) respect the OS reduced-motion preference and are also toggleable via the Tweaks panel.
- **Intro skip:** The space portal can be skipped via "Skip intro", the Escape key, or any scroll/click before launching. It also self-dismisses in frozen/background-tab contexts.
