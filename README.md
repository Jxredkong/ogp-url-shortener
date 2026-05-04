# ogp-url-shortener

A URL shortener built for the OGP SWE Intern take-home assessment.

> **Status:** in active development. See commit history for progress.

## Stack

- **Backend:** Node.js + TypeScript + Express, Postgres via `pg`
- **Frontend:** Vite + React + TypeScript + Tailwind CSS
- **Tests:** Vitest + Supertest
- **Deploy:** Render (web service + managed Postgres)

## Layout

```
ogp-url-shortener/
├── server/   # Express API + redirect handler + serves built client in prod
└── client/   # Vite + React frontend
```

## Local development

```sh
nvm use            # node 20
npm install        # installs both workspaces
npm run dev        # runs server (3000) and client (5173) in parallel
```

Full setup, env vars, and deploy notes will land in this README as features are merged.
