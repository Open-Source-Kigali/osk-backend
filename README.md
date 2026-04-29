# oskbackend

Backend for the official website of [Open Source Kigali](https://github.com/Open-Source-Kigali).

Built with Express 5, TypeScript, Prisma and PostgreSQL.

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

- `npm run dev` — start the server in watch mode
- `npm run build` — compile TypeScript to `dist/`
- `npm start` — run the compiled build

## Project structure

```
src/
├── app.ts              Express app setup
├── server.ts           Entry point
├── config/             Environment config
├── routes/             Route definitions
├── controllers/        Request handlers
├── models/             Data models
└── middlewares/        Express middlewares
prisma/
└── schema.prisma       Prisma schema
```

## Database

PostgreSQL runs locally via Docker. Make sure Docker is installed, then:

```bash
docker compose up -d         # start Postgres
npx prisma migrate dev       # apply migrations
npx prisma studio            # optional: browse the DB in a GUI
```

To stop the database: `docker compose down` (add `-v` to wipe the data).

## Endpoints

- `GET /api/health` — health check

## License

MIT
