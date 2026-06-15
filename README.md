# Rocket to the Moon

A full-stack crash-style rocket game built with React, Vite, Framer Motion, Express, and PostgreSQL.

## Features

- Guest play with 300 session points
- Register/login with JWT auth
- Registered users start with 500 points
- Backend-generated crash time for every round
- Backend-only game result and payout calculation
- Saved balance and round history for logged-in users
- Simple dashboard and polished space theme

## Project Structure

```text
frontend/
  src/
    components/
    hooks/
    pages/
    services/
    utils/
backend/
  src/
    config/
    db/
    features/
      auth/
      game/
      users/
    middleware/
    routes/
    utils/
  migrations/
```

## Requirements

- Node.js 20+
- PostgreSQL 14+

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a PostgreSQL database:

```bash
createdb rocket_to_the_moon
```

Or start the included Docker database:

```bash
docker compose up -d postgres
```

3. Copy environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

4. Update `backend/.env` with your database URL and JWT secret.

5. Start the app:

```bash
npm run dev
```

The frontend runs on `http://localhost:5173` and the backend runs on `http://localhost:4000`.

## Production

Build the frontend:

```bash
npm run build
```

Start the backend:

```bash
npm start --workspace backend
```

Set these environment variables in production:

- `DATABASE_URL`
- `JWT_SECRET`
- `CLIENT_ORIGIN`
- `PORT`

The backend applies the SQL schema on startup when `DB_AUTO_MIGRATE=true`.
