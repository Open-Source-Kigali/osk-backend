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
git clone https://github.com/Open-Source-Kigali/oskbackend.git
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
- `ADMIN_API_KEY` - any long string; pass it as the `x-api-key` header to call admin-only endpoints
- `CORS_ORIGINS` - comma-separated list of allowed origins

Cloudinary and GitHub variables are only needed if you're touching uploads or project refresh.

## Branching

- Branch off `main` for every change.
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
- Image uploads use the `upload` middleware and the helpers in `src/utils/cloudinary-upload.ts`. On failure, roll back uploaded images with `destroyImage`.
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
2. Open a PR against `main` using the [PR template](.github/PULL_REQUEST_TEMPLATE.md).
3. Link the issue your PR closes (`Closes #123`).
4. Keep PRs focused. One logical change per PR is easier to review than a bundle.
5. Be ready to iterate. Reviewers may suggest changes, and that's normal.

## Reporting bugs and requesting features

Use the issue templates:

- [Bug report](.github/ISSUE_TEMPLATE/bug_report.yml)
- [Feature request](.github/ISSUE_TEMPLATE/feature_request.yml)

Search existing issues first to avoid duplicates.

## Questions

Open a GitHub issue with the `type: question` label, or start a Discussion if Discussions are enabled.
