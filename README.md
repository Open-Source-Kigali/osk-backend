# oskbackend

Backend for the official website of [Open Source Kigali](https://github.com/Open-Source-Kigali).

Built with Express, TypeScript, Prisma, and PostgreSQL.

## Tech stack

- **Runtime:** Node.js + Express
- **Language:** TypeScript (strict mode)
- **Database:** PostgreSQL via Prisma
- **Image storage:** Cloudinary
- **API docs:** OpenAPI served through Swagger UI

## Getting started

```bash
npm install
cp .env.example .env
docker compose up -d
npx prisma migrate dev
npm run dev
```

The server runs on `http://localhost:3000` by default.

## Scripts

- `npm run dev` - start the server in watch mode
- `npm run build` - compile TypeScript to `dist/`
- `npm start` - run the compiled build
- `npm test` - run tests using Vitest

## Environment variables

See `.env.example` for the full list.

| Variable                | Required             | Description                                                     |
| ----------------------- | -------------------- | --------------------------------------------------------------- |
| `PORT`                  | no                   | Server port (default `3000`)                                    |
| `NODE_ENV`              | no                   | `development` or `production`                                   |
| `DATABASE_URL`          | yes                  | PostgreSQL connection string                                    |
| `ADMIN_API_KEY`         | yes                  | Shared key for admin-only endpoints; sent as `x-api-key` header |
| `CORS_ORIGINS`          | yes                  | Comma-separated list of allowed origins                         |
| `CLOUDINARY_CLOUD_NAME` | for uploads          | Cloudinary cloud name                                           |
| `CLOUDINARY_API_KEY`    | for uploads          | Cloudinary API key                                              |
| `CLOUDINARY_API_SECRET` | for uploads          | Cloudinary API secret                                           |
| `GITHUB_TOKEN`          | for projects refresh | Fine-grained PAT with public repo read                          |

## Project structure

```
src/
├── app.ts              Express app setup
├── server.ts           Entry point
├── config/             Environment, Prisma, and Cloudinary config
├── routes/             Route definitions
├── controllers/        Request handlers
├── services/           Business logic and database access
├── middlewares/        Auth, error handling, uploads
├── utils/              Response envelope, Cloudinary helpers
└── generated/          Prisma client output (gitignored)
prisma/
├── schema.prisma       Prisma schema
└── migrations/         Generated migration history
docs/
└── openapi.yaml        OpenAPI specification
```

## Database

PostgreSQL runs locally via Docker. Make sure Docker is installed, then:

```bash
docker compose up -d         # start Postgres
npx prisma migrate dev       # apply migrations
npx prisma studio            # optional: browse the DB in a GUI
```

To stop the database: `docker compose down` (add `-v` to wipe the data).

## API documentation

Interactive Swagger UI is available at `http://localhost:3000/api/docs` once the server is running. The underlying spec lives at [`docs/openapi.yaml`](./docs/openapi.yaml).

Admin-only endpoints require an `x-api-key` header matching `ADMIN_API_KEY`.
If `ADMIN_API_KEY` is missing at startup, the server logs a warning and admin endpoints will continue to return `500` until the key is configured.
Delete endpoints return `204 No Content` with an empty response body to stay compliant with the HTTP spec.

## Contributors

Everyone who contributes to this repo gets listed on the OSK website. To add yourself, open a pull request that adds your GitHub username to [`CONTRIBUTORS.md`](./CONTRIBUTORS.md):

```
your-github-username
```

The `GET /api/contributors` endpoint reads that file, fetches each person's public GitHub profile, and returns the data the frontend uses to render the contributors section.

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for setup, branching, commit conventions, and the pull request flow. By participating, you agree to follow our [Code of Conduct](./CODE_OF_CONDUCT.md).

To report a bug or request a feature, open an issue using one of the templates in [`.github/ISSUE_TEMPLATE`](./.github/ISSUE_TEMPLATE).

## License

[MIT](./LICENSE)
