# Ario Scripts

Ario Scripts is a Roblox Studio/Luau script catalog and developer community platform built with React, Vite, TypeScript, Express, and Supabase.

## Product scope

- Public Roblox Studio/Luau script catalog
- Games and categories
- Developer profiles
- Supabase Auth accounts
- User dashboard and script submissions
- Favorites and notifications
- Moderation workflow
- Badges and achievements
- Admin analytics and audit logging
- Secure server-side authorization
- PostgreSQL/RLS persistence

This project is for legitimate Roblox development and educational resources. It does not provide exploit loaders, anti-cheat bypasses, credential theft, or other security-bypass functionality.

## Environment

Configure these in Replit Secrets or the deployment environment:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` only if a trusted server-side operation genuinely requires it; never expose it to the browser.

Do not commit secrets to Git.

## Development

```bash
npm install
npm run dev
```

The development command starts Vite and the Express API. The API listens on `PORT` (default 3000).

## Production

```bash
npm run build
npm start
```

## Supabase setup

1. Open the existing Supabase project.
2. Review the existing schema before applying migrations.
3. Apply `supabase/migrations/0002_ario_scripts_security.sql` in a controlled environment first.
4. Configure Supabase Auth email verification/password reset.
5. Configure Google OAuth only if desired.
6. Configure Storage buckets and owner-scoped policies for avatars, game images, script thumbnails, and announcements.
7. Create the initial administrator manually through a trusted database procedure or controlled SQL operation. Never promote the first registered user automatically.
8. Test anonymous, user, moderator, and administrator permissions separately.

## Security notes

- Browser code uses only the Supabase publishable key.
- Private script source should be delivered only after server-side authorization.
- User-submitted Luau is treated as untrusted content and is never executed by the web server.
- Admin actions must be enforced on the server/database, not by hidden UI controls.
- RLS must remain enabled on browser-exposed tables.
- Do not expose service-role credentials, access tokens, passwords, or private moderation data.

## API health

`GET /api/health` verifies configured Supabase connectivity without returning secrets.

## Status

The repository contains the Ario Scripts application foundation and real Supabase-backed workflows. Before production launch, run the project in Replit, apply and test the database migration against a controlled environment, configure Storage/Auth, and run the TypeScript/build checks.
