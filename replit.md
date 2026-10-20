# Ario Scripts — Replit deployment

## Run

Install dependencies with `npm install`.

Development: `npm run dev`

Production build: `npm run build`

Production server: `npm start`

## Secrets

Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only and add it only when required for trusted audit/admin operations.

The app is designed to bind the Express server to `0.0.0.0` and use Replit's `PORT` value.
