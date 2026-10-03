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
  page.tsx          landing page (Server Component)
  icon.tsx          generated favicon, same helix drawing as brand.tsx
  not-found.tsx     404, rendered inside the root layout
  workspace/page.tsx the client half
components/
  app-shell.tsx     desktop sidebar / mobile top bar, wraps every page
  brand.tsx         helix mark, wordmark, and the eleven-icon set
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

Five colours, verbatim, from the brief:

| Token         | Hex       | Role in the brief         |
| ------------- | --------- | ------------------------- |
| `--color-cream`  | `#FFEBCB` | Background            |
| `--color-teal`   | `#21A179` | Primary              |
| `--color-forest` | `#023436` | Text                  |
| `--color-copper` | `#A76D60` | Secondary accent      |
| `--color-rust`   | `#601700` | Secondary text        |

**Two of the five cannot be used the way the brief uses them.** Both were measured, not
eyeballed, against `--color-cream` (WCAG needs 4.5:1 for body text and 3:1 for a UI stroke):

| Pair                | Ratio  | Verdict                                          |
| ------------------- | ------ | ------------------------------------------------ |
| white on `--color-teal` | 3.26:1 | fails — cannot be a button fill            |
| `--color-teal` on cream | 2.80:1 | fails — cannot be a border or focus ring    |
| cream on `--color-copper` | 3.60:1 | fails — cannot be a filled bar with text   |
| white on `--color-copper` | 4.20:1 | fails — same                                    |
| cream on `--color-forest` | 11.63:1 | passes — primary button                     |
| cream on `--color-rust` | 11.11:1 | passes — accent button                       |
| `--color-copper` on cream | 3.60:1 | passes — borders and icons only            |

So three tokens were derived, darkened along the *same hue* until they cleared the floor.
No new colour was invented; these are the palette's own shades:

| Derived              | Hex       | From     | Ratio  | Used for                        |
| -------------------- | --------- | -------- | ------ | ------------------------------- |
| `--color-teal-deep`  | `#1A8A66` | teal     | 3.69:1 | focus ring, active strokes      |
| `--color-muted`      | `#6F6250` | warm grey| 5.09:1 | secondary text on cream         |
| `--color-night-*`    | —         | forest   | —      | dark mode, see below             |

The rules that follow, which a future change should not quietly undo:

- **`forest` fills the primary button, `rust` fills the accent.** Never teal. A filled teal
  button lands at 3.7:1 with cream text, which is under the floor for body copy.
- **Teal is a mark colour, never a surface.** It is the helix, the eyebrow text, the logo,
  the completed status. It is not a button and not a border.
- **Copper is an edge colour.** It draws the dashed upload border and icon strokes. It is
  never a fill with text on it — `--color-rust` is the same hue and clears the floor at
  11.11:1, so it does that job instead.
- **The dark palette reuses the brand rather than inventing a second theme.** `--color-night`
  is a darkened forest, `--color-night-text` a cream. Same pair, inverted — which is why
  dark mode holds the same 11.63:1.

### Warm neutrals, not grey

There is no grey scale in this palette, and borrowing Tailwind's would be wrong: a neutral
grey next to this cream reads as dirt. So the surfaces are warm neutrals mixed from the
palette — `--color-shell` (page), `--color-paper` (raised), `--color-line` (hairline),
`--color-line-strong` (emphasised). The whole page stays one temperature.

### Base identity is not brand

The A/T/G/C colours in the composition chart and the landing page's worked example are the
SnapGene / Benchling / Biopython convention: A green, T red, G blue, C amber. They are
deliberately **not** the brand palette. Brand teal is itself a green, and a palette-derived
"adenine" would be indistinguishable from a decorative accent. These four are semantics and
they sit *beside* the brand, not inside it.

### Type

Three families, each with one job, all self-hosted through `next/font`:

| Variable             | Family           | Job                                                       |
| -------------------- | ---------------- | -------------------------------------------------------- |
| `--font-display`     | Fraunces         | headings and the wordmark. The serif is the main signal that this is a research tool and not a dashboard |
| `--font-sans`        | Instrument Sans  | body copy, labels, buttons                               |
| `--font-mono`        | Geist Mono       | sequences, counts, accessions, dates — anything compared character by character, with tabular figures so a column of numbers stays still |

The scale, and where each step is used:

| Step          | Treatment                                                        |
| ------------- | ---------------------------------------------------------------- |
| Hero H1       | `font-display` 4xl/5xl, `600`, `tracking-tight`, `text-balance`  |
| Section H2    | `font-display` 2xl/3xl, `600`, `tracking-tight`                 |
| Panel title   | `font-display` 15px, `600`                                       |
| Body          | `font-sans` `sm`/`base`, `leading-relaxed`                      |
| Label         | `font-sans` `xs`, `500`                                          |
| Eyebrow       | `font-mono` 11px, uppercase, `tracking-[0.18em]`, teal-deep      |
| Data          | `font-mono`, tabular figures                                     |
| Caption       | `font-sans` 11px, `--color-muted`                                |

### Everything else

- **Borders, not shadows, carry separation.** Panels are
  `rounded-xl border border-line bg-paper`.
- **No gradient heroes, no blurred orbs, no glassmorphism, no grid backdrops.** The hero
  opens with a statement and a *worked example* — a real FASTA record from the project spec
  and the real numbers it produces. A mockup of our own UI would only be a picture of a
  promise.
- **Motion only where state is genuinely moving.** A queued or processing analysis gets a
  pulsing dot, because that row really is changing underneath the reader. Loading waits get
  a skeleton sweep so the layout holds still. Nothing else animates, and
  `prefers-reduced-motion` collapses all of it.
- **Two layouts from one shell.** `app-shell.tsx` is a persistent sidebar on the brand cream
  above `lg`, and a sticky top bar below it. It does not collapse into a disclosure — every
  action that appears in one layout appears in the other, including sign-out.

### Extending it

Adding a semantic colour: prefer a token from the table above. If a genuinely new one is
needed, check it against `--color-cream` first, and keep it clear of the four base identity
colours — those are load-bearing in every screenshot anyone takes of this app. Status and
severity colours (`STATUS_TONES` in `primitives.tsx`, the `tones` map in `Notice`) are
semantics rather than brand: a failure has to read as a failure to someone who has not
learned the palette, which is why they are amber, red and teal rather than brand hues.

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
  login optional — "authentication is not a prerequisite for using the basic tools" — and the
  landing page copy says so. But `workspace.tsx` still resolves the session first and renders
  `AuthView` for anyone anonymous, so a visitor who only wants to run one analysis is turned
  away. This is a logic change, not a display one, so it has not been made here. It needs a
  decision: either the gate is relaxed and guest job ids come from the anonymous session
  identifier instead of a user id, or the landing page stops promising it.
- **The design has never been seen.** There is no browser attached to the development
  session, so every change was verified by `tsc`, `eslint`, `next build` and by reading the
  served HTML and compiled CSS over HTTP. Contrast ratios were computed, but **no one has
  looked at it.** Spacing, rhythm, the cream page background, dark mode and the sidebar at
  every breakpoint are all unverified by eye.
- The workspace has been written against the route handlers in `back/src/routes/` but has never
  been run against a live API, because the backend cannot start on the development machine
  (no Docker). The signed-out and error paths are the only ones actually executed. The
  fragile parts are the presigned upload preflight, status polling, `SameSite` cookie
  behaviour across sites, and rendering a finished result.
- `chat-bar.tsx` and `upload-target.tsx` exist and are styled, but nothing mounts them yet —
  the chat interface is not built. They are presentational and controlled, so wiring them up
  is a matter of owning the state at the call site.
- The result charts, the composition table and the notes panel are research and education
  surfaces. Nothing here is a clinical or diagnostic tool, and the UI says so wherever a
  result is displayed.