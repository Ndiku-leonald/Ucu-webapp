# Backend Setup

1. Copy `.env.example` to `.env` and set your local MySQL credentials.
2. Run the schema in `database/schema.sql`.
3. Run the seed data in `database/seed.sql`.
4. Start the server with `npm run dev` or `npm start`.

## Health Check

- `GET /api/health` returns API and database health in one response.
- When MySQL is unavailable, the endpoint returns HTTP 503 with `status: "degraded"`.

## Seed Accounts

All sample accounts use the password `password123`.

- `alice@example.com` (`student`)
- `brian@example.com` (`student`)
- `sarah@example.com` (`supervisor`)
