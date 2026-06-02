<!-- # Open Source Kigali | Backend -->

![OSK-banner](banner.png)

[![NodeJS](https://img.shields.io/badge/Node.js-Runtime-green?logo=node.js&logoColor=white)](https://nodejs.org) [![Express](https://img.shields.io/badge/Express-Framework-black?logo=express)](https://expressjs.com) [![TypeScript](https://img.shields.io/badge/TypeScript-Language-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org) [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org) [![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io) [![Docker](https://img.shields.io/badge/swagger-APIdocs-green?logo=swagger&logoColor=white)](https://www.swagger.com) [![Docker](https://img.shields.io/badge/Docker-Containerization-2496ED?logo=docker&logoColor=white)](https://www.docker.com) ●• [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) ![GitHub forks](https://img.shields.io/github/forks/Open-Source-Kigali/osk-backend?style=social) ![GitHub stars](https://img.shields.io/github/stars/Open-Source-Kigali/osk-backend?style=social)

Backend for the official website of [Open Source Kigali](https://github.com/Open-Source-Kigali). Built with Express, TypeScript, Prisma, and PostgreSQL.

<!--
## Tech stack

- **Runtime:** Node.js + Express
- **Language:** TypeScript (strict mode)
- **Database:** PostgreSQL via Prisma
- **Image storage:** Cloudinary
- **API docs:** OpenAPI served through Swagger UI -->

## Getting started

> **TL;DR** — clone the repo and get dependencies, setup your `.env` file, and you're up! Read more below for database setup, environment variables, project structure, and scripts. Here are quick commands to get started.

```bash
npm install
cp .env.example .env
docker compose up -d
npx prisma migrate dev
npm run dev
```

The server runs on `http://localhost:3000` by default.

<details>
<summary><b>⚙️ Environment variables</b></summary>
<br>

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

</details>

<details>
<summary><b>🗄️ Database</b></summary>
<br>

PostgreSQL runs locally via Docker. Make sure Docker is installed, then:

```bash
docker compose up -d         # start Postgres
npx prisma migrate dev       # apply migrations
npx prisma studio            # optional: browse the DB in a GUI
```

To stop the database: `docker compose down` (add `-v` to wipe the data).

</details>

<details>
<summary><b>🗂️ Project structure</b></summary>
<br>

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

</details>

<details>
<summary><b>📜 Scripts</b></summary>
<br>

- `npm run dev` — start the server in watch mode
- `npm run build` — compile TypeScript to `dist/`
- `npm start` — run the compiled build
- `npm test` — run the test suite
- `npm run lint` — lint the codebase
- `npm run format` — format with Prettier

</details>

## API Documentation
Admin-only endpoints require an `x-api-key` header matching `ADMIN_API_KEY`.

[![Launch Swagger UI](https://img.shields.io/badge/Swagger%20UI-Launch%20API%20Docs-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](http://localhost:3000/api/docs)

The interactive Swagger UI should be available at `http://localhost:3000/api/docs` once the server is running. The underlying spec lives at [`docs/openapi.yaml`](./docs/openapi.yaml). Admin-only endpoints require an `x-api-key` header matching `ADMIN_API_KEY`.

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for setup, branching, commit conventions, and the pull request flow. By participating, you agree to follow our [Code of Conduct](./CODE_OF_CONDUCT.md). To report a bug or request a feature, open an issue using one of the templates in [`.github/ISSUE_TEMPLATE`](./.github/ISSUE_TEMPLATE).

## Contributors

[![](https://contrib.rocks/image?repo=Open-Source-Kigali/osk-backend)](https://github.com/Open-Source-Kigali/osk-backend/graphs/contributors)

Everyone who contributes to this repo gets listed on the OSK website. To add yourself, open a pull request that adds your GitHub username to [`CONTRIBUTORS.md`](./CONTRIBUTORS.md). The `GET /api/contributors` endpoint reads that file, fetches each person's public GitHub profile, and returns the data the frontend uses to render the contributors section.

## License

[MIT](./LICENSE)
