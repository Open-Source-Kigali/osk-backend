# Contributing to oskbackend

Thanks for your interest in contributing! This is the backend for the [Open Source Kigali](https://github.com/Open-Source-Kigali) website. Whether you're fixing a bug, adding a feature, or improving the docs, this guide will help you get set up and submit a change.

## Code of conduct

By participating, you agree to follow our [Code of Conduct](./CODE_OF_CONDUCT.md). Please report unacceptable behavior to the maintainers.

## Getting started

### Prerequisites

- Node.js 20+ and npm
- Docker (for local Postgres)
- A Cloudinary account if you'll be working on image uploads (optional for most changes)
- A GitHub fine-grained personal access token with public-repo read access if you'll be working on the projects refresh flow (optional)

### Setup

```bash
git clone https://github.com/Open-Source-Kigali/osk-backend.git
cd oskbackend
npm install
cp .env.example .env
docker compose up -d
npx prisma migrate dev
npm run dev
```

The server runs at `http://localhost:3000`. Swagger UI is at `http://localhost:3000/api/docs`.

### Environment variables

See `.env.example` for the full list. The required ones for local dev are:

- `DATABASE_URL` - Postgres connection string
- `CORS_ORIGINS` - comma-separated list of allowed origins (never `*` when using credentialed cookies)
- `REDIS_URL` - required in production when Redis-backed rate limiting is enabled
- `SESSION_TTL_SECONDS` - optional; admin session lifetime (default 28800 / 8 hours)
- `SESSION_COOKIE_SAMESITE` - optional; `lax` (default), `strict`, or `none` (`none` requires Secure cookies)
- `SESSION_COOKIE_SECURE` - optional in development; production always forces Secure cookies
- `ADMIN_API_KEY` - optional legacy value; **not** used by HTTP admin routes after Phase 3

Cloudinary and GitHub variables are only needed if you're touching uploads or project refresh.

### Administrator authentication (Phase 3)

Admin HTTP routes require a cookie session from `/api/auth/login`. There is no `x-api-key` fallback on those routes.

1. Provision an admin (do not invent public registration):

```bash
ADMIN_EMAIL=you@example.com \
ADMIN_PASSWORD='choose-a-long-unique-password' \
ADMIN_NAME='Your Name' \
npm run provision:admin
```

2. `POST /api/auth/login` with a trusted `Origin` and `{ "email", "password" }` (`credentials: "include"`).
3. Use the HttpOnly `osk_session` cookie automatically on later requests.
4. Send `X-CSRF-Token` (from the login payload or `GET /api/auth/csrf`) on every state-changing admin request and on logout.
5. Admin-only GETs (for example partner application list/detail) need the session cookie but not CSRF.

The provisioning script stores a bcrypt hash only and never prints the password or hash. Legacy plaintext values in `User.password` cannot log in; re-run provisioning to set a real hash.

Production requirements: HTTPS, `CORS_ORIGINS` limited to real frontend origins, Secure session cookies (forced when `NODE_ENV=production`), and no wildcard CORS with credentials.

### Review moderation

Public `GET /api/reviews` and `GET /api/reviews/:id` return approved testimonials only. A pending or rejected review looks like a missing record on the public detail route. `POST /api/reviews` stores the submission as `PENDING`. Clients cannot send `status`, `reviewedAt`, or `reviewedById`.

Migration `20261020131000_add_review_moderation` backfills every existing review to `APPROVED`, then sets the column default to `PENDING` for later inserts. `reviewedAt` and `reviewedById` stay null until an admin decision.

Admins list the queue with `GET /api/admin/reviews` (defaults to `PENDING`), read any review with `GET /api/admin/reviews/:id`, and approve or reject with `PATCH /api/admin/reviews/:id/status` and `{ "status": "APPROVED" | "REJECTED" }`. The reads need a session. The status change also needs a trusted `Origin` and `X-CSRF-Token`. Allowed transitions are pending to approved or rejected, approved to rejected, and rejected back to approved. Repeating the current status returns 409.

`PUT /api/reviews/:id` still edits text and the profile image. It does not publish or hide a review. `GET /api/stats` counts approved reviews only.

## Branching

We use a three-branch flow: `dev` → `staging` → `main`.

- **Always branch off `dev`** — it is the default branch and the target for all contributor PRs.
- `staging` is periodically merged from `dev` for pre-production testing.
- `main` is production — only merged from `staging` when ready to ship.
- Use a descriptive branch name with a type prefix:
  - `feat/<short-description>` for new features
  - `fix/<short-description>` for bug fixes
  - `docs/<short-description>` for documentation
  - `refactor/<short-description>` for internal restructuring
  - `chore/<short-description>` for tooling, deps, infra

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/). The first line should be:

```
<type>: <short summary>
```

Common types: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`, `style`, `perf`.

Examples from this repo:

- `feat: enhance Event model and controller with additional fields`
- `fix: simplify error handling in middleware`
- `docs: document admin API key flow`

Keep the summary under 72 characters. Add a longer body if the change needs context.

## Code style

- TypeScript strict mode is on; please keep it that way.
- Controllers export named functions in a default object (see `src/controllers/event.controller.ts` for the pattern). Prefer clarity over cleverness.
- Routes go in `src/routes/`, business logic in `src/services/`, request handling in `src/controllers/`.
- Use the `response.success` and `response.failure` helpers from `src/utils/response.ts` so the API envelope stays consistent.
- Image uploads use the shared `upload` middleware (`src/middlewares/upload.middleware.ts`) and the helpers in `src/utils/cloudinary-upload.ts`. Send one image in the multipart field `file`. Allowed types are JPEG, PNG, WebP, and GIF, with a 5 MB limit. The middleware checks the file header, not only the Content-Type. SVG is rejected because uploads are stored as submitted and are not sanitized. Unsupported or mismatched files return 400 and oversized files return 413, using the standard error envelope. A missing file is still handled by the controller. Cloudinary failures stay server errors (500); roll back a stored image with `destroyImage`.
- Don't commit secrets, `.env` files, or generated artifacts.

Run before pushing:

```bash
npx tsc --noEmit          # typecheck
npx prettier --check .    # format
npx eslint .              # lint
```

## Database changes

If you change `prisma/schema.prisma`:

1. Run `npx prisma migrate dev --name <short-description>` locally.
2. Commit both the schema change and the generated migration directory.
3. Mention any data implications in the PR description.

## API changes

If you add or change a route:

1. Update `docs/openapi.yaml` so Swagger reflects the change.
2. Note new request/response shapes in your PR description.

## Pull requests

1. Fork the repo and push your branch to your fork (or push to a branch on the main repo if you have access).
2. Open a PR against `dev` using the [PR template](.github/PULL_REQUEST_TEMPLATE.md).
3. Link the issue your PR closes (`Closes #123`).
4. Keep PRs focused. One logical change per PR is easier to review than a bundle.
5. Be ready to iterate. Reviewers may suggest changes, and that's normal.

## Reporting bugs and requesting features

Use the issue templates:

- [Bug report](.github/ISSUE_TEMPLATE/bug_report.md)
- [Feature request](.github/ISSUE_TEMPLATE/feature_request.md)

Search existing issues first to avoid duplicates.

## Questions

Open a GitHub issue with the `type: question` label, or start a Discussion if Discussions are enabled.
