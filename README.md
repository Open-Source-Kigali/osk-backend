# oskbackend

Backend for the official website of [Open Source Kigali](https://github.com/Open-Source-Kigali).

Built with Express 5 and TypeScript.

## Getting started

```bash
npm install
cp .env.example .env
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
```

## Endpoints

- `GET /api/health` — health check

## Contributing

Contributions are welcome. Open an issue or submit a pull request.

## License

ISC
