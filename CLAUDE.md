# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

German-language HVAC/heating installation planning tool. The app composes PDF installation plans (title pages, technical specs, circuit diagrams, consent forms, etc.) and manages clients, sales-pipeline tracking, and email campaigns. Inbound email is polled via IMAP to attach replies to projects.

## Deployment shape (non-obvious — read this first)

The Next.js app **does not run in Docker**. Docker Compose here provides only data services:

| Service | Container | Host port |
|---|---|---|
| Postgres 17 | `arvernus-installationsplan-postgres-1` | `5434` |
| Redis 7 | `arvernus-installationsplan-redis-1` | `6380` |
| MinIO | `arvernus-installationsplan-minio-1` | `9002` (API), `9003` (console) |

The Next.js server is built with `output: "standalone"` and runs **on the host under PM2**:

- `installationsplan` — `node .next/standalone/server.js`
- `protocol-worker` — `npx tsx src/lib/email/start-worker.ts` (BullMQ email/IMAP worker, despite the pm2 name)

Restart the app with `pm2 restart installationsplan protocol-worker`, **not** docker compose. Rebuild before restart: `npm run build` → pm2 picks up the new `.next/standalone/server.js`.

There's a separate PDF worker script (`npm run worker`, runs `src/lib/pdf/start-worker.ts`) that is **not** under PM2 by default — check `pm2 list` before assuming it's live.

## Commands

```bash
npm run dev               # Next.js dev server :3000
npm run build             # Build standalone bundle (.next/standalone)
npm run start             # Production server (used implicitly via pm2)
npm run lint

npm run worker            # PDF generation worker (BullMQ)
npm run worker:email      # Email + IMAP worker (this is what protocol-worker runs)

npm run db:migrate        # prisma migrate dev
npm run db:seed           # prisma/seed.ts
npm run db:reset          # full reset — destructive
npm run db:studio         # Prisma Studio :5555
```

For local dev pointing at the host containers: `DATABASE_URL=postgresql://installplan:installplan_secret@localhost:5434/installationsplan`. There's a `docker-compose.dev.yml` variant for an alternate setup — diff it against `docker-compose.yml` before using.

## Tech stack

- Next.js 16 (App Router, `output: "standalone"`), React 19, TypeScript
- NextAuth 5 beta (JWT, Credentials provider, bcrypt)
- Prisma 6 → Postgres 17
- BullMQ 5 on Redis 7 for PDF and email queues
- shadcn/ui (Radix + Tailwind 4)
- Nodemailer (outbound), imapflow (inbound), @react-email/components (templates)
- MinIO 8 SDK (bucket: `installationsplan`)
- sharp for PDF image processing

## Architecture

- `src/app/(auth)` — login
- `src/app/(dashboard)` — protected routes: projects, clients, users, campaigns, settings
- `src/app/api/` — route handlers: auth, PDF generation, email, file uploads, delivery notes, photos
- `src/lib/pdf/` — PDF worker entry + section builders
- `src/lib/email/` — SMTP send, IMAP poll worker, React Email templates
- `src/lib/actions/` — server actions
- `src/lib/validations/` — Zod schemas
- `src/lib/auth.ts` — NextAuth config

**Domain model** (Prisma enums): users have roles `ADMIN | MANAGER | TECHNICIAN | VIEWER`; projects move through `DRAFT → IN_PROGRESS → REVIEW → COMPLETED → ARCHIVED`; clients track a sales sub-status (`NEU → VERKAUFT | NICHT_VERKAUFT`); 14 distinct `SectionType` values map to the installation-document sections (HEATING_CIRCUITS, ELECTRICAL_PLANNING, CONSENT, …).

## Environment

Required env (in `.env`):

- `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`
- `REDIS_URL` (for BullMQ)
- `SMTP_HOST/PORT/USER/PASS/FROM` — outbound mail
- `IMAP_HOST/PORT/USER/PASS`, `IMAP_POLL_INTERVAL_MINUTES` (default 5)
- `MINIO_ENDPOINT/PORT/ACCESS_KEY/SECRET_KEY`
