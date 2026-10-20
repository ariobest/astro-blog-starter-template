# Ario Scripts

Ario Scripts is a Roblox Studio/Luau script catalog and developer community platform. The web app is a React application mounted through Astro and built as a static site for Cloudflare Pages, with Supabase providing authentication and data persistence.

## Cloudflare Pages

Use these build settings:

- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Node.js:** 22 or newer
- **Root directory:** `/`

The repository contains `wrangler.toml` with the Pages output directory and `public/_redirects` for the React Router SPA fallback.

Set these Cloudflare Pages environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Only browser-safe Supabase configuration belongs in `VITE_*` variables. Never expose a Supabase service-role key to the browser.

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm install
npm run build
```

The Astro build writes the deployable static site to `dist/`.

## Architecture

- **Astro:** static build and Cloudflare Pages entrypoint
- **React:** interactive Ario Scripts application
- **Supabase:** Auth, PostgreSQL, Storage, and RLS
- **Express:** optional trusted API retained for server deployments; Cloudflare Pages static hosting does not run Express.

## Product scope

- Roblox Studio/Luau script catalog
- Games and categories
- Developer profiles
- Authentication and dashboards
- Script submissions and moderation
- Favorites, notifications, badges, and admin tools
- PostgreSQL/RLS persistence

This project is for legitimate Roblox development and educational resources. It does not provide exploit loaders, anti-cheat bypasses, credential theft, or security-bypass functionality.

User-submitted Luau is treated as untrusted content and is never executed by the web server.
