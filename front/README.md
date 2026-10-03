# front

Next.js 16 App Router client for **Gene Pilot**. Static landing page at `/`, the
interactive workspace at `/workspace`.

> **Naming.** This directory was previously written against "Genomic Insight Agent", and
> `back/README.md` still uses that name. The frontend now ships **Gene Pilot** because the
> design brief specifies it. It has *not* been renamed on the backend — the API envelope,
> routes and job types are untouched. If the rename is only meant to be visual, nothing
> outside `app/` and `components/` needs to change.

## Running it

```bash
bun install
bun run dev          # http://localhost:3000
```

One environment variable, read at build time:

| Variable             | Required | Purpose                                                        |
| -------------------- | -------- | -------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | yes      | Base URL of the `back/` API, e.g. `http://127.0.0.1:4000`. |

Copy `.env.example` to `.env.local`. The value is inlined into the client bundle at build
time, so it is a constant for the life of the bundle and changing it needs a rebuild, not a
reload. Left unset, every request throws `API_NOT_CONFIGURED` and says so.

For the API to accept the session cookie, `CORS_ORIGINS` on the backend has to list this
origin exactly — `http://localhost:3000` for the dev server. It cannot be `*`, because the
browser refuses a wildcard on a credentialed request.

## Routes

| Path         | Rendering       | What it is                                                        |
| ------------ | --------------- | ----------------------------------------------------------------- |
| `/`          | Static          | Landing page. Prerendered, ships no component JavaScript.          |
| `/workspace` | Client, runtime | Sign-in gate and the workspace. Resolves the session on the client. |
| `/icon`      | Generated       | The helix, drawn in `app/icon.tsx` via `next/og`.                  |

`/` is a Server Component with no client component in its tree, which is why it can be
prerendered. `/workspace` cannot be: the session is an `HttpOnly` cookie, so "am I signed in"
is not answerable during a server render and has to be asked of the API from the browser.
The landing page was moved off `/` so a visitor does not have to sit through that wait
before seeing anything.

The split is measurable — the Recharts bundle is only referenced by `/workspace`:

```bash
curl -s http://localhost:3000/          | rg -o '/_next/static/chunks/[^"]+' | sort -u
curl -s http://localhost:3000/workspace | rg -o '/_next/static/chunks/[^"]+' | sort -u
```

## Layout

```
app/
  layout.tsx        html shell, font wiring, metadata, light/dark base
  page.tsx          home screen (Server Component): sidebar slots + the column
  icon.tsx          generated favicon, same helix drawing as brand.tsx
  not-found.tsx     404, rendered inside the root layout
  workspace/page.tsx the client half
components/
  app-shell.tsx     the charcoal frame, 150px sidebar / mobile top bar, wraps every page
  home-main.tsx     the home column: headline, drop zone, composer (client)
  brand.tsx         helix mark, stacked wordmark lockup, and the eighteen-icon set
  chat-bar.tsx      the ask input, filled and plain variants
  upload-target.tsx the drop zone; hands over a FileList, never reads it
  workspace.tsx     session gate, project picker, and the owner of all server state
  sequence-import.tsx  three import routes: presigned PUT, proxied upload, pasted text
  sequence-board.tsx   sequence rows and analysis submission
  analysis-board.tsx   queued and finished analyses
  analysis-result.tsx  renders a finished result
  composition-chart.tsx Recharts, client-only
  notes-panel.tsx      per-project message log
  auth-view.tsx        sign in / sign up
  primitives.tsx       Panel, Empty, Notice, Button, Field, StatusBadge, Skeleton
lib/
  api.ts            transport, ApiRequestError, error classification
  genomics.ts       one typed wrapper per endpoint
  sequence.ts       format, length and hash for metadata-only sequence registration
  result.ts         tolerant reader for analyses.result_json
scripts/
  check-result.ts   parser checks, see below
```

`lib/` is layered on purpose. `api.ts` owns transport and knows nothing about genomics;
`genomics.ts` owns endpoint contracts and knows nothing about React; `sequence.ts` and
`result.ts` own pure derivations. A component imports the layer it needs and no deeper.

## Design system

### The palette

Six colours, verbatim, from the brief. Nothing here was adjusted to make it work:

| Token              | Hex       | Role                                                   |
| ------------------ | --------- | ------------------------------------------------------ |
| `--color-cream`    | `#FFEBCB` | the app surface                                        |
| `--color-teal`     | `#21A179` | primary: the helix, the composer submit button         |
| `--color-forest`   | `#023436` | all text, the Login pill, the accent button            |
| `--color-dust`     | `#A76660` | secondary accent: dashed rules and icon strokes        |
| `--color-brown`    | `#6D2700` | the drop zone border, the composer bar, accent button  |
| `--color-charcoal` | `#1E1E1E` | the outer screen the app container sits on             |

Every pairing the brief asks for was measured against the surface it lands on. WCAG wants
4.5:1 for body text and 3:1 for a UI stroke or an icon:

| Pair                        | Ratio    | Verdict                                       |
| --------------------------- | -------- | --------------------------------------------- |
| cream on `--color-forest`   | 11.63:1  | passes — Login pill, primary button           |
| cream on `--color-brown`    | 9.28:1   | passes — composer bar text, drop zone border  |
| forest on `--color-cream`   | 11.63:1  | passes — all body text                        |
| `--color-dust` on paper     | 4.35:1   | passes — the `Empty` placeholder              |
| `--color-dust` on cream     | 3.82:1   | passes — dashed rules, icon strokes only      |
| `--color-teal` on brown     | 3.32:1   | passes — the submit button's edge (3:1 floor) |
| white on `--color-teal`     | 3.26:1   | passes — the submit arrow (3:1 floor)         |
| `--color-teal` on cream     | 2.80:1   | **fails** — never a border or a focus ring    |

The brief's own choices all clear their floor, including the two that look marginal on
paper. The white arrow on the teal button is 3.26:1, and it passes because an icon owes the
3:1 non-text ratio rather than the 4.5:1 one. Cream on that same teal would have been
2.80:1 — a shape rather than a symbol — which is why the bar's text is cream and the arrow
inside the button is white. Same hue family, different job, different floor.

One shade is derived, darkened along the *same hue* until it cleared the 3:1 floor. No new
colour was invented:

| Derived            | Hex       | From      | Ratio            | Used for                                     |
| ------------------ | --------- | --------- | ---------------- | -------------------------------------------- |
| `--color-teal-ink` | `#157F5A` | teal      | 4.27:1 cream, 4.87:1 paper | focus rings, active strokes, muted success |
| `--color-muted`    | `#6F6250` | warm grey | 5.09:1 cream    | secondary text                               |
| `--color-night-*`  | —         | forest    | —                | dark mode, see below                         |

The rules that follow, which a future change should not quietly undo:

- **`forest` fills the primary button, `brown` fills the accent.** Never teal. A filled teal
  button lands at 3.7:1 with cream text, which is under the 4.5:1 floor for body copy.
- **Teal is a mark colour and one button.** It is the helix and the composer's submit button.
  It is never a border, a focus ring or a text colour — `teal-ink` is the teal that does work.
- **`dust` is the only secondary allowed to draw a line.** `--color-line-strong` is a divider
  between two panels of the same surface, not information, so it only has to be quiet; a
  dashed rule that *is* information has to clear 3:1, and `#D9C6A2` does not at 1.64:1.
- **Brown draws the drop zone and fills the composer.** Both are the brief's `#6D2700`, and it
  measures 9.28:1 on cream, so nothing had to be substituted.
- **The dark palette reuses the brand rather than inventing a second theme.** `--color-night`
  is a darkened forest, `--color-night-text` a cream. Same pair, inverted — which is why
  dark mode holds the same 11.63:1.

### The frame is part of the design

The brief describes a framed app, not a full-bleed page: a charcoal `#1E1E1E` outer screen
with a cream container centred in it at up to 1360×760, rounded at 15px, split into a 150px
sidebar and a main area by a single hairline. That lives in `app-shell.tsx`, not in the root
layout, because it is a property of *the app* and both routes share it.

Two things follow from it that are worth knowing before editing:

- **The container has a fixed height, so the main area scrolls rather than the page.** The
  `overflow-y-auto` on `<main>` is load-bearing: without it the content grows past the
  container's own bottom edge and the "frame" stops being one.
- **Below `md` the frame is dropped entirely.** The container goes edge to edge and the
  charcoal margin disappears, because on a phone a decorative margin costs a whole row of the
  screen. That is also why the breakpoint is `md` and not `lg` — the brief says 768px.

### Warm neutrals, not grey

There is no grey scale in this palette, and borrowing Tailwind's would be wrong: a neutral
grey next to this cream reads as dirt. So the surfaces are warm neutrals mixed from the
palette — `--color-paper` (raised panels), `--color-shell` (inset areas),
`--color-line` (hairline), `--color-line-strong` (emphasised). The whole app stays one
temperature.

### Base identity is not brand

The A/T/G/C colours in the composition chart and the landing page's worked example are the
SnapGene / Benchling / Biopython convention: A green, T red, G blue, C amber. They are
deliberately **not** the brand palette. Brand teal is itself a green, and a palette-derived
"adenine" would be indistinguishable from a decorative accent. These four are semantics and
they sit *beside* the brand, not inside it.

### Type

Two families, each with one job, both self-hosted through `next/font`:

| Variable         | Family          | Job                                                                                                          |
| ---------------- | --------------- | ------------------------------------------------------------------------------------------------------------- |
| `--font-sans`    | Instrument Sans | everything: headings, labels, body, buttons. The brief asks for "a modern clean sans-serif similar to Inter, Poppins or Montserrat", so this product has **no serif in it** |
| `--font-mono`    | Geist Mono      | sequences, counts, accessions, dates — anything compared character by character, with tabular figures so a column of numbers stays still |

`--font-display` is still defined, as an alias for the sans stack rather than a second
family. The call sites were written when the heading *was* a serif, and renaming every one
of them to restate that it is not would be churn for no change in what renders.

The scale, and where each step is used:

| Step           | Treatment                                                        |
| -------------- | ---------------------------------------------------------------- |
| Home H1        | `font-display` 18px, `600`, `text-balance` — the brief's own size |
| Page H2        | `font-display` 15–18px, `600`, `tracking-tight`                 |
| Panel title    | `font-display` 15px, `600`                                       |
| Body           | `font-sans` `sm`/`base`, `leading-relaxed`                      |
| Sidebar label  | `font-sans` 11px, `500`                                         |
| Caption        | `font-sans` 11px, `--color-muted`                                |
| Data           | `font-mono`, tabular figures                                     |
| Wordmark       | all-caps, `600`, `tracking-[0.06em]` — wide tracking is right at 40px and turns "GENE" into "G E N E" at 12px |

### Where the type deviates from the brief, and why

The brief specifies a compact canvas — 8–9px placeholders, 8–10px body, 10–12px sidebar
labels, a 20px submit circle. Those are all floored, and every deviation is listed here so
it can be reverted deliberately rather than by accident:

| Brief      | Used  | Why                                                                             |
| ---------- | ----- | ------------------------------------------------------------------------------- |
| 8–9px placeholder / body | **11px** | below roughly 11px, text stops being legible on a 1× laptop panel. WCAG sets no minimum, which is exactly why this has to be a judgement call |
| 7–8px sidebar helper | **11px** | same floor. In a 126px column this wraps to about eight lines and fills the sidebar's empty middle, which the brief asks for anyway |
| 7–8px "RESEARCH TOOL" | **10px** | the one exception, because it is a category label rather than something to read |
| 10–12px sidebar label | 11px | as specified                                                 |
| 18px heading | 18px | as specified, and unchanged from the brief even though the rest of the app uses larger type elsewhere |
| 20px submit circle | **24px** | it is the only submit control on the screen and 20px is a small thumb target. The bar grew to absorb it rather than the arrow shrinking |

The brief's *proportions* are followed exactly — a 150px sidebar, a 280×135 drop zone, a
315px composer, content biased 135px down with roughly 400px of empty cream beneath it. It
is only the absolute text sizes that moved.

### Everything else

- **Borders, not shadows, carry separation.** Panels are
  `rounded-xl border border-line bg-paper`. The brief rules out excessive shadows, and the
  frame needs none either: cream on charcoal is 14.29:1, so the edge between them is not
  ambiguous without one.
- **No gradient heroes, no blurred orbs, no glassmorphism, no grid backdrops.** The home
  screen is one centred column, because that is what the design specifies - and a sparse
  screen only works if the one thing on it is unmistakable.
- **Motion only where state is genuinely moving.** A queued or processing analysis gets a
  pulsing dot, because that row really is changing underneath the reader. Loading waits and
  drag-over get a state change, not an animation. Nothing loops, and
  `prefers-reduced-motion` collapses all of it.
- **Two layouts from one shell.** `app-shell.tsx` is the framed desktop container above
  `md` (768px) and a full-bleed single column with a compact top bar below it. It does not
  collapse into a disclosure - every action that appears in one layout appears in the other,
  including Settings and sign-out.
- **A control that cannot work says so.** Settings is in the design and has no route, so it
  renders as a `<span>` with `aria-disabled` and a hover note, rather than a live-looking
  button that silently swallows the click. `+ New analysis` is a menu row rather than a
  filled button, because a 126px-wide filled forest button is a wall in a 150px sidebar.

### Extending it

Adding a semantic colour: prefer a token from the table above. If a genuinely new one is
needed, check it against `--color-cream` first, and keep it clear of the six brief colours -
those are load-bearing in every screenshot anyone takes of this app. Status and severity
colours (`STATUS_TONES` in `primitives.tsx`, the `tones` map in `Notice`) are semantics
rather than brand: a failure has to read as a failure to someone who has not learned the
palette, which is why they are amber, red and teal rather than brand hues.

Note that Tailwind only emits a `@theme` variable once something references it. All six
brief colours are live in `globals.css` and each one is currently used, so they all appear
in the compiled CSS - but a token that nothing uses will silently vanish from the build
rather than sitting there waiting.

Adding a loading state: use `Skeleton` or `SkeletonRows` from `primitives.tsx` with the
shape the real content will have. Do not add a `"Loading…"` string — a placeholder that
changes the layout when content arrives is worse than a blank one.

## Division of labour

This directory is the presentation layer, and it is the only part of it that is finished.
The split is deliberate and should stay visible:

| Owned here (frontend)                          | Owned elsewhere                              |
| ---------------------------------------------- | -------------------------------------------- |
| Layout, typography, colour, spacing, dark mode | Endpoint contracts and their enforcement      |
| Responsive behaviour, web and mobile           | Auth, session issuance, ownership checks      |
| Loading, empty, error and pending *presentation* | Which state is real, and when it changes   |
| Rendering whatever shape `result_json` arrives in | Producing that payload (Bio service)      |
| Copy, disclaimers, scientific wording          | The science: Biopython, BLAST, NCBI          |

Two consequences for anyone editing this directory:

- **A component may assume nothing about the backend.** `result_json` is untyped and the
  Bio service has not shipped; the reader is written to degrade, not to throw.
- **Presentation must not decide truth.** The reported/derived distinction on `gc_content`
  is the rule: a number this code computed is never rendered as one a tool reported. That
  applies to any field added later.

## Server state

`workspace.tsx` is the only owner of server state. Children receive data as props and report
back through callbacks, so there is one `useEffect` per concern instead of a fetch inside
every panel. In particular the analysis board cannot register a new tracked id itself — it
does not know which project is selected — so it reports the id upward.

Project selection is derived rather than stored:

```ts
const activeId = selectedId ?? projects[0]?.id ?? null;
```

The alternative, a "pick the first project" effect, cascades an extra render on mount.

## Reading analysis results

`analyses.result_json` is an untyped `jsonb` column written by a Bio service that does not
exist yet, so `lib/result.ts` reads it field by field instead of casting it to an interface.
Every field is optional, wrong types are dropped rather than thrown on, and unrecognised keys
are still shown under "Other fields" — a payload from a service that has not shipped yet
should degrade to "here is the raw data", not to a blank panel.

Keys are accepted in both `camelCase` and `snake_case`. The snake_case aliases are not
guesswork: the Bio service is FastAPI, and a Python service emits snake_case by convention.
The plan's own BLAST example writes `e_value` and `bit_score`.

One distinction the code keeps: if the payload omits `gc_content` but carries a composition,
the percentage is derived client-side and labelled as derived. A number the client computed
must not be presented as one the tool reported.

## Checks

```bash
bun run lint           # eslint
bunx tsc --noEmit      # types
bun run check:result   # lib/result.ts against the documented payloads
```

`check:result` is a plain script, not a test framework — this project has no JS test runner,
and adding one for a single pure module is not worth the dependency. It exits non-zero so CI
can call it later. It earns its place because the payload shape is still a contract on paper:
when the Bio service lands with a different shape, this is what says so.

## Deployment

`bun run deploy` is **currently broken** and should not be run. It calls `next-on-pages`, whose
peer range is `next: ">=14.3.0 && <=15.5.2"` while this project is on `16.3.6`; the tool has
also been deprecated by Cloudflare. The working replacement is `@opennextjs/cloudflare`, which
matches how `back/` is actually deployed: a long-lived process behind a hostname, never a
serverless function. Migrating the script is a separate change.

Deploying the frontend separately from the API is fine. It is a static site plus one client
bundle; all the stateful work is in `back/`, which stays on its own host.

## Notes for reviewers

- Nothing in this directory talks to anything but the `back/` API, and it does so only through
  `lib/api.ts`.
- **Open mismatch: the spec is guest-first, this workspace is not.** The development plan makes
  login optional — "authentication is not a prerequisite for using the basic tools". The home
  screen's own copy is closer to the truth than the old landing page was ("You need to login
  first to save your recent analysis" implies you can still work), but `workspace.tsx` still
  resolves the session first and renders `AuthView` for anyone anonymous, so a visitor who
  only wants to run one analysis is turned away. This is a logic change, not a display one, so
  it has not been made here. It needs a decision: either the gate is relaxed and guest job ids
  come from the anonymous session identifier instead of a user id, or the copy stops implying
  it.
- **The design has never been seen.** There is no browser attached to the development
  session, so every change was verified by `tsc`, `eslint`, `next build` and by reading the
  served HTML and compiled CSS over HTTP. Contrast ratios were computed and every element
  the brief specifies was confirmed present in the output, but **no one has looked at it.**
  The charcoal frame, the 150px sidebar at its real width, the spacing rhythm, dark mode
  and the mobile layout are all unverified by eye. The text sizes were floored upward from
  the brief's 8px, which changes the vertical rhythm of every screen and is the single most
  likely thing to look wrong.
- **The charcoal frame is a judgement call made from the brief's numbers.** At 1440×900 the
  1360×760 container leaves roughly 40px of charcoal at the sides and 70px above and below.
  On a larger display those margins grow, because the container is capped rather than
  stretched. If the frame is meant to be a mockup of a specific viewport rather than the
  product's real chrome, the cap and the `md:p-8` gutter in `app-shell.tsx` are the two
  numbers to change.
- The workspace has been written against the route handlers in `back/src/routes/` but has never
  been run against a live API, because the backend cannot start on the development machine
  (no Docker). The signed-out and error paths are the only ones actually executed. The
  fragile parts are the presigned upload preflight, status polling, `SameSite` cookie
  behaviour across sites, and rendering a finished result.
- **The home screen's two controls are presentational.** The drop zone hands its `FileList` to
  a handler that navigates to `/workspace`, because there is no project yet for the bytes to
  belong to — the real importer is `sequence-import.tsx`. The composer owns the typed text and
  nothing else; it has no `onSubmit`, so sending is inert. Both are one call site away from
  being real.
- Settings has no route. It is rendered `aria-disabled` rather than wired to something
  arbitrary, so nobody clicks it expecting a preferences panel.
- The result charts, the composition table and the notes panel are research and education
  surfaces. Nothing here is a clinical or diagnostic tool, and the UI says so wherever a
  result is displayed.