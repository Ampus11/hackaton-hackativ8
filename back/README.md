# back

Application API for Genomic Insight Agent. Elysia + Drizzle ORM + Neon Postgres, runnable on Bun (local/dev), Vercel, and Cloudflare Workers.

## Runtime entrypoints

| Runtime          | Entrypoint              | Notes                                                              |
| ---------------- | ----------------------- | ------------------------------------------------------------------ |
| Bun (local/dev)  | `src/index.ts`          | Starts an HTTP listener; also the Vercel entrypoint.               |
| Vercel           | `src/index.ts`          | Default export is the Elysia app.                                  |
| Cloudflare Worker| `src/worker.ts`         | `CloudflareAdapter` + `.compile()`; copies Worker `env` into `process.env`. |
| Analysis worker  | `src/worker/analysis.ts` | Long-lived BullMQ consumer. Never a Worker or a serverless function. |

`bun run dev` serves on `PORT` (default `4000`).

Routes live in `src/routes/` and are shared by every runtime. `src/app.ts` builds the
Elysia instance once so each entrypoint can configure it without duplicating routes.

### Cloudflare Workers requirements

Two settings are mandatory, and both cause a deploy-time failure without them:

- `compatibility_date` must be `>= 2025-06-01` in `wrangler.toml`. That is when the
  Workers runtime began permitting `new Function()` during startup, which is what
  Elysia's compiler needs.
- The Worker entrypoint must use `CloudflareAdapter` and call `.compile()`. Without
  `.compile()`, Elysia composes handlers per request with `new Function()` and the
  runtime rejects it with `EvalError: Code generation from strings disallowed`
  (error `10021`).

Do not "fix" that error by adding the `unsafe-eval` compatibility flag — raising the
compatibility date and compiling ahead of time is the supported path and keeps dynamic
code evaluation off at request time.

### Vercel

`bun-types` is a regular dependency, not a devDependency. Vercel transpiles with a
pruned dependency tree, and `tsconfig.json` lists `bun-types` in `types`, so leaving it
in `devDependencies` fails the build with `TS2688: Cannot find type definition file for
'bun-types'`.

## Local stack

The repo root has a `docker-compose.yml` with Postgres, Redis, and MinIO for local development:

```bash
docker compose up -d          # start postgres, redis, minio, and create the bucket
docker compose ps
docker compose down           # stop, keep data
docker compose down -v        # stop and delete data
```

`back/.env` currently points at hosted Neon. To use the local Postgres instead, set `DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/genomic_insight` and run `bun run db:migrate`.

## Environment

| Variable               | Required | Purpose                                                          |
| ---------------------- | -------- | ---------------------------------------------------------------- |
| `DATABASE_URL`         | yes      | Postgres connection string (Neon, or the local container).       |
| `S3_ENDPOINT`          | storage  | S3-compatible endpoint, e.g. `http://127.0.0.1:9000` for MinIO.  |
| `S3_BUCKET`            | storage  | Bucket name for research files.                                  |
| `S3_ACCESS_KEY_ID`     | storage  | Access key. Safe to appear in a presigned URL credential scope.   |
| `S3_SECRET_ACCESS_KEY` | storage  | Secret key. Never leaves the server.                             |
| `S3_REGION`            | no       | Defaults to `us-east-1`.                                         |
| `S3_FORCE_PATH_STYLE`  | no       | Defaults to path style, which MinIO requires.                    |
| `REDIS_URL`            | queue    | Redis connection string for the BullMQ queue.                    |
| `QUEUE_ENQUEUE_URL`    | no       | Base URL of the enqueue service. Required on Cloudflare Workers. |
| `QUEUE_SECRET`         | see below| Shared secret for the enqueue service.                           |
| `QUEUE_ATTEMPTS`       | no       | Job retry attempts. Defaults to `3`.                             |
| `WORKER_CONCURRENCY`   | no       | Concurrent analysis jobs. Defaults to `2`.                        |
| `ENQUEUE_PORT`         | no       | Serve `POST /enqueue` from the analysis worker when set.         |
| `BIO_SERVICE_URL`      | no       | Base URL of the Bio service. Analysis fails without it.          |
| `ALLOW_DEV_AUTH`       | no       | Required to use the API on Vercel/Workers before auth is built.  |
| `DEV_USER_EMAIL`       | no       | Email of the local development identity. Default `developer@local.test`. |

Storage and queue credentials belong in `.env` locally and in `wrangler secret put` / Vercel environment variables. `QUEUE_SECRET` is mandatory whenever `ENQUEUE_PORT` or `QUEUE_ENQUEUE_URL` is set; the service refuses to start without it.

## Authentication status

Authentication is not implemented yet (see `PLAN.md`).

- Local Bun: a single development identity is resolved server-side and upserted on first use.
- Vercel / Workers: every data route returns `401 AUTH_NOT_IMPLEMENTED` unless `ALLOW_DEV_AUTH=true` is set. This is intentional — the endpoints fail closed rather than serving unscoped data.

Ownership is always resolved from a server-side record. The API never accepts a user id, email, or role from the client, and `object_key` can only be set by the storage endpoints — a client-supplied `objectKey` is rejected with `422`.

## Endpoints

| Method | Path                             | Description                                        |
| ------ | -------------------------------- | -------------------------------------------------- |
| GET    | `/health`                        | Liveness plus a database connectivity probe.       |
| POST   | `/projects`                      | Create a project.                                   |
| GET    | `/projects`                      | List owned projects.                                |
| GET    | `/projects/:id`                  | Fetch one owned project.                            |
| POST   | `/projects/:id/sequences`        | Register a metadata-only sequence (pasted text).    |
| GET    | `/projects/:id/sequences`        | List sequences in a project.                        |
| POST   | `/analyses`                      | Queue an analysis; returns `202` immediately.        |
| GET    | `/analyses/:id`                  | Fetch one analysis.                                 |
| GET    | `/analyses/:id/status`           | Poll analysis status.                               |
| POST   | `/conversations`                 | Append a conversation message.                      |
| GET    | `/conversations/:projectId`      | List conversation messages for a project.           |
| GET    | `/storage/health`                | Bucket reachability probe.                          |
| POST   | `/storage/presign`               | Mint a presigned `PUT` and register the sequence.   |
| POST   | `/storage/upload`                | Proxy a small multipart upload through the backend. |
| GET    | `/storage/*`                     | Mint a presigned `GET` for an owned object.         |
| DELETE | `/storage/*`                     | Delete an owned object and detach it.               |

Successful responses are `{ "data": ... }`. Errors are `{ "error": { "code", "message", "details"? } }` with `404` for missing or unowned resources, `413` for oversized files, `422` for validation failures, `503` when the queue is unavailable, and `401` when auth is required.

## Uploading a research file

`POST /storage/presign` is the canonical path for file-backed sequences. It records the `object_key` at presign time (the optimistic variant described in `PLAN.md` §5), so the row exists before the browser uploads. `sequence_length` and `sequence_hash` stay `NULL` until the Bio service parses the file.

```text
POST /storage/presign  { projectId, filename, contentType?, sizeBytes? }
  -> 201 { sequenceId, objectKey, method: "PUT", uploadUrl, expiresIn: 900 }

PUT <uploadUrl>  (browser uploads the file directly to object storage)

GET /storage/<objectKey>
  -> 200 { objectKey, downloadUrl, expiresIn: 900, sequence }
```

Presigned URLs live 15 minutes. Because the signature covers only the `host` header, the browser may send whatever `Content-Type` it derives from the `File`.

`POST /storage/upload` takes `multipart/form-data` with `projectId`, `filename`, and `file`, and is capped at 5 MiB. Direct presigned uploads are capped at 100 MiB. Allowed extensions: `.fasta`, `.fa`, `.fna`, `.gb`, `.gbk`, `.genbank`, `.txt`, `.csv`, `.tsv`, `.json`, `.pdf`.

Note that a presigned `PUT` is not size-enforced server-side — the declared `sizeBytes` is validated, but a client can still send a different body. Enforcing a hard limit requires a bucket policy.

## Analysis queue

Analyses are never executed inside an HTTP request. `POST /analyses` writes a `queued` row, pushes a BullMQ job onto Redis, stores `queue_job_id`, and returns `202`:

```text
POST /analyses  { sequenceId, analysisType }
  -> 202 { data: { id, status: "queued", queueJobId, ... } }

GET /analyses/:id/status
  -> 200 { data: { id, status, queueJobId, errorMessage, updatedAt } }
```

Status moves `queued -> processing -> completed | failed`. A worker records the failure reason on every failed attempt, so a job that exhausts its retries still leaves an explanation behind.

If Redis is unreachable, submission returns `503 QUEUE_UNAVAILABLE` and the row is moved to `failed` rather than being left in `queued`. The response includes `error.details.analysisId` so the client can surface that failed attempt. If the queue is not configured at all, the request fails fast with `503 QUEUE_NOT_CONFIGURED` and no row is created.

The consumer is a long-lived process, never a Worker or serverless function:

```bash
REDIS_URL=redis://127.0.0.1:6379 bun run worker:analysis
```

On Bun/Vercel the API writes to Redis directly. Cloudflare Workers cannot hold a reliable TCP connection, so the same process can host a small enqueue service instead and the Worker posts to it:

```bash
REDIS_URL=redis://127.0.0.1:6379 QUEUE_SECRET=... ENQUEUE_PORT=4010 bun run worker:analysis
```

```text
Worker   -> POST <QUEUE_ENQUEUE_URL>/enqueue   (x-queue-secret: QUEUE_SECRET)
Service  -> BullMQ enqueue -> Redis
Worker   -> BullMQ consumer -> Bio Service
```

## Scripts

```bash
bun run dev            # local server with watch mode
bun run dev:worker     # Cloudflare Worker dev
bun run worker:analysis # BullMQ analysis worker (long-lived)
bun run build          # wrangler dry-run bundle
bun run typecheck      # tsc --noEmit
bun run db:generate    # generate a migration from the schema
bun run db:migrate     # apply migrations
bun run db:studio      # Drizzle Studio
```
