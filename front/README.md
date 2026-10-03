# front

Next.js 16 App Router client for Genomic Insight Agent. Static landing page at `/`, the
interactive workspace at `/workspace`.

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
  layout.tsx        html shell, font wiring, title template, light/dark base
  page.tsx          landing page (Server Component)
  not-found.tsx     404, rendered inside the root layout
  workspace/page.tsx the client half
components/
  workspace.tsx     session gate, project picker, and the owner of all server state
  sequence-import.tsx  three import routes: presigned PUT, proxied upload, pasted text
  sequence-board.tsx   sequence rows and analysis submission
  analysis-board.tsx   queued and finished analyses
  analysis-result.tsx  renders a finished result
  composition-chart.tsx Recharts, client-only
  notes-panel.tsx      per-project message log
  auth-view.tsx        sign in / sign up
  primitives.tsx       shared layout, buttons, fields, badges, skeletons
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

There is no custom palette. That is the rule, and it is worth stating because the obvious
move — invent a brand colour, add a gradient hero — is the wrong one here.

**Colour in this app is data, not decoration.** Four meanings already need it:

| Meaning      | Where                 | Treatment                                     |
| ------------ | --------------------- | --------------------------------------------- |
| Base identity | composition chart     | A green, T red, G blue, C amber — SnapGene / Benchling convention |
| Job status    | `StatusBadge`         | amber processing, emerald completed, red failed |
| Severity      | `Notice`              | sky info, red error, emerald success          |

So the neutral ramp is Tailwind's `zinc` and nothing else. There is no accent colour
reserved for "the brand", because there is no surface in this product that is not already
competing for a colour channel, and decoration is the one thing that should lose. The
landing page uses `zinc-900` on white for its primary action — the same ink the primary
button already used.

Consequences that follow from this, and that a future change should not quietly undo:

- **No gradient heroes, no blurred colour orbs, no glassmorphism, no background grid
  patterns.** The landing page opens with a statement and a worked example instead.
- **Borders, not shadows, carry separation.** Panels are `rounded-lg border border-zinc-200`
  on `bg-white`. The single soft shadow in the app is on the one thing that reads as a
  raised surface.
- **Monospace means data.** Sequence ids, base counts, accessions, lengths, dates and file
  sizes are `font-mono`; prose is not. Geist Sans and Geist Mono are wired through
  `next/font` in `app/layout.tsx` and exposed as `--font-sans` / `--font-mono`.
- **Dense where it is informative, spacious where it is prose.** The capability list is a
  divided `dl`; the hero has room to breathe. A lab tool is judged on whether you can
  compare two numbers.
- **Motion only where state is genuinely moving.** A queued or processing analysis gets a
  pulsing dot, because that row really is changing underneath the reader. Loading waits get
  a skeleton sweep so the layout holds still. Nothing else animates, and
  `prefers-reduced-motion` collapses all of it.

### Extending it

Adding a semantic colour: pick from the existing Tailwind scales (`emerald`, `amber`, `red`,
`sky`) and name the meaning in the constant next to its use — the same way `STATUS_TONES`
does. If a new colour needs inventing, it needs a second meaning that does not collide with
the four base colours, because those are load-bearing in every screenshot anyone takes of
this app.

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
  landing page copy now says so. But `workspace.tsx` still resolves the session first and
  renders `AuthView` for anyone anonymous, so a visitor who only wants to run one analysis is
  turned away. This is a logic change, not a display one, so it has not been made here. It
  needs a decision: either the gate is relaxed and guest job ids come from the anonymous
  session identifier instead of a user id, or the landing page stops promising it.
- The workspace has been written against the route handlers in `back/src/routes/` but has never
  been run against a live API, because the backend cannot start on the development machine
  (no Docker). The signed-out and error paths are the only ones actually executed. The
  fragile parts are the presigned upload preflight, status polling, `SameSite` cookie
  behaviour across sites, and rendering a finished result.
- The result charts, the composition table and the notes panel are research and education
  surfaces. Nothing here is a clinical or diagnostic tool, and the UI says so wherever a
  result is displayed.
