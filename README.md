# ogp-url-shortener

A URL shortener built for the OGP SWE Intern take-home assessment. Turn long URLs into short shareable links, with click counts, a recent-links dashboard, and a simple access gate.

## Stack

| Layer    | Choice                                                           |
| -------- | ---------------------------------------------------------------- |
| Backend  | Node.js 20, TypeScript, Express                                  |
| Database | Postgres (`pg`), bare-metal SQL migrations                       |
| Frontend | Vite, React 18, TypeScript, Tailwind CSS, `@shadergradient/react` |
| Auth     | Shared access key -> JWT session token (Bearer header)           |
| Tests    | Vitest + Supertest, 37 tests covering URL parsing, code generation, service logic, API behaviour, and the auth gate |
| Deploy   | Render (Blueprint in `render.yaml`)                              |

## Layout

```
ogp-url-shortener/
├── server/                     Express API + redirect handler + serves built client
│   ├── src/
│   │   ├── api/                routes: auth, links, redirect, errors
│   │   ├── auth.ts             access-key/JWT helpers + requireAuth middleware
│   │   ├── db/
│   │   │   ├── pool.ts         pg pool
│   │   │   ├── migrate.ts      idempotent migration runner
│   │   │   └── migrations/     numbered SQL files
│   │   ├── shortener/          domain logic, no Express dep — keeps it unit-testable
│   │   │   ├── url.ts          URL normalisation + protocol allow-list
│   │   │   ├── codes.ts        nanoid 7-char short codes (look-alike-free alphabet)
│   │   │   ├── repository.ts   pg-backed CRUD on the `links` table
│   │   │   ├── service.ts      shorten/resolve/stats/recent
│   │   │   └── types.ts        Link DTO + typed errors
│   │   ├── test/               in-memory repo for tests, no live db needed
│   │   ├── app.ts              createApp({ service? }) factory
│   │   └── index.ts            runs migrations -> starts the server
│   └── ...
├── client/                     Vite + React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── AccessGate.tsx  password card, exchanges access key for JWT
│   │   │   ├── Shortener.tsx   hero + form + result + recent-links list
│   │   │   ├── ShaderBackground.tsx  lazy-loaded WebGL gradient
│   │   │   └── ui/             shadcn-style Button / Card / Input / Label
│   │   ├── lib/
│   │   │   ├── api.ts          fetch wrapper with Bearer header + 401 handling
│   │   │   └── utils.ts        cn() = clsx + tailwind-merge
│   │   └── App.tsx, main.tsx, index.css
│   └── ...
├── render.yaml                 deploy blueprint
└── package.json                npm workspaces root
```

## Local development

Prereqs: Node 20+, a running Postgres.

```sh
nvm use                                       # node 20
npm install                                   # installs both workspaces

# 1. Configure env
cp server/.env.example server/.env            # then set ACCESS_KEY + DATABASE_URL

# 2. Run migrations (idempotent)
npm --workspace server run db:migrate

# 3. Start API + frontend together
npm run dev
# -> server on http://localhost:3000
# -> client on http://localhost:5173 (proxies /api to :3000)
```

Open <http://localhost:5173>, paste the access key from `server/.env`, then start shortening.

### Environment

| Var               | Required | Purpose                                                             |
| ----------------- | :------: | ------------------------------------------------------------------- |
| `DATABASE_URL`    | yes      | Postgres connection string                                          |
| `ACCESS_KEY`      | yes      | Shared password — anyone with this can mint short links             |
| `JWT_SECRET`      | no       | Signs session tokens. Falls back to `ACCESS_KEY` if unset           |
| `PUBLIC_BASE_URL` | no       | Used to compose `shortUrl` in API responses. Defaults to `http://localhost:3000` |
| `PORT`            | no       | Defaults to `3000`                                                  |
| `NODE_ENV`        | no       | `production` enables SSL on pg, static-serves `client/dist`, hides morgan |

## API

All `/api/links*` and `/api/shorten` calls require `Authorization: Bearer <token>` from `POST /api/auth`. The `/:code` redirect and `/health` are public.

| Method | Path                | Auth | Body / params              | Returns                                     |
| ------ | ------------------- | :--: | -------------------------- | ------------------------------------------- |
| POST   | `/api/auth`         | no   | `{ accessKey }`            | `{ token }`                                 |
| POST   | `/api/shorten`      | yes  | `{ url, reuseIfExists? }`  | `LinkResponse` (201)                        |
| GET    | `/api/links`        | yes  | -                          | `{ links: LinkResponse[] }` (10 newest)     |
| GET    | `/api/links/:code`  | yes  | -                          | `LinkResponse` (404 on miss)                |
| GET    | `/:code`            | no   | -                          | `302` redirect; bumps `click_count`         |
| GET    | `/health`           | no   | -                          | `{ status: "ok" }`                          |

`LinkResponse`:

```jsonc
{
  "shortCode": "Ab3cD2x",
  "shortUrl": "https://your-host/Ab3cD2x",
  "originalUrl": "https://open.gov.sg/",
  "createdAt": "2026-05-04T08:00:00.000Z",
  "clickCount": 0
}
```

## Tests

```sh
npm test                       # 37 tests, ~350ms
```

Coverage:
- `url.test.ts` — protocol allow-list, length cap, well-formedness
- `codes.test.ts` — code shape, validator, no collisions across 1k samples
- `service.test.ts` — shorten / resolve / stats / recent with `reuseIfExists`
- `api.test.ts` — happy paths, validation errors, redirect + click bump, auth gate (401 without token, public redirect, public health)

The API tests inject an `InMemoryLinkRepository` via `createApp({ service })` so no database is required.

## Design notes

- **Short code generation.** 7-char nanoid over `23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz` (no `0/O/1/l/I` look-alikes). At ~57 chars and 7 positions that's ~1.6×10¹² codes. The service retries up to 5 times on the unique-violation error code (`23505`) before raising `CodeCollisionError`.
- **URL safety.** Anything non-`http(s)`, malformed, missing a host, or > 2048 chars is rejected at the service boundary so it can never become a redirect target. `javascript:` URLs are blocked.
- **Click counting.** `incrementClick` is a single `UPDATE … SET click_count = click_count + 1 RETURNING …` — atomic, no read-modify-write race.
- **Auth gate.** Mirrors the `voltade/raffles-email-assistant` pattern — shared access key, 30-day JWT, `Authorization: Bearer` header. Only the dashboard is gated; `/:code` redirects stay public so short URLs work for anyone.
- **Mount order matters.** `/:code` redirect runs before the SPA fallback, so visiting a real short link returns a 302 instead of the React index page.
- **Bundle weight.** The shader gradient pulls in three.js (~225 KB gz). It's lazy-loaded behind a `Suspense` fallback that paints a CSS gradient, so initial JS is ~57 KB gz.

## Deploy

`render.yaml` is a Render Blueprint. It defines:
- a managed Postgres named `ogp-url-shortener-db`
- a Node web service that runs `npm ci && npm run build` then `npm start`, with auto-generated `ACCESS_KEY` and `JWT_SECRET` and `DATABASE_URL` wired from the database

After deploy, set `PUBLIC_BASE_URL` to the service URL so `shortUrl` in API responses uses the right hostname.

> **Note:** Render no longer offers free Postgres for new databases. Either accept the paid Postgres add-on, or remove the `databases:` block and point `DATABASE_URL` at any external Postgres (Neon, Supabase, etc).
