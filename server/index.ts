import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const app = express();
const port = Number(process.env.PORT || 3000);
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

app.use(cors({ origin: true, credentials: false }));
app.use(express.json({ limit: '256kb' }));

const bearer = (req: express.Request) => {
  const value = req.header('authorization') || '';
  return value.startsWith('Bearer ') ? value.slice(7) : null;
};

async function authenticatedClient(req: express.Request) {
  const token = bearer(req);
  if (!token || !supabaseUrl || !publishableKey) return null;
  const client = createClient(supabaseUrl, publishableKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: { user }, error } = await client.auth.getUser(token);
  return error || !user ? null : { client, user };
}

async function isStaff(client: ReturnType<typeof createClient>, userId: string) {
  const { data } = await client.from('user_roles').select('role').eq('user_id', userId).maybeSingle();
  return data?.role === 'admin' || data?.role === 'moderator';
}

app.get('/api/health', async (_req, res) => {
  if (!supabaseUrl || !publishableKey) return res.status(503).json({ ok: false, error: 'Supabase environment is not configured.' });
  const client = createClient(supabaseUrl, publishableKey);
  const { error } = await client.from('site_settings').select('id').eq('id', 1).maybeSingle();
  if (error) return res.status(503).json({ ok: false, error: 'Supabase connectivity check failed.' });
  res.json({ ok: true, service: 'ario-scripts-api', database: 'connected' });
});

app.get('/api/scripts/:slug/source', async (req, res) => {
  const auth = await authenticatedClient(req);
  if (!auth) return res.status(401).json({ error: 'Authentication required.' });
  const { data: script, error } = await auth.client.from('scripts').select('id,owner_id,published,archived,code').eq('slug', req.params.slug).maybeSingle();
  if (error || !script) return res.status(404).json({ error: 'Script not found.' });
  const staff = await isStaff(auth.client, auth.user.id);
  if (!script.published && script.owner_id !== auth.user.id && !staff) return res.status(403).json({ error: 'You are not authorized to access this source.' });
  res.json({ code: script.code || '' });
});

const scriptCreate = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/).max(140),
  game_name: z.string().trim().min(1).max(120).default('Universal'),
  description: z.string().max(10000).optional(),
  category_id: z.string().uuid().nullable().optional(),
  code: z.string().max(200000).default(''),
  version: z.string().max(30).default('1.0.0'),
});

app.post('/api/scripts', async (req, res) => {
  const auth = await authenticatedClient(req);
  if (!auth) return res.status(401).json({ error: 'Authentication required.' });
  const parsed = scriptCreate.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid script payload.', details: parsed.error.flatten() });
  const { data, error } = await auth.client.from('scripts').insert({ ...parsed.data, owner_id: auth.user.id, publication_state: 'draft', published: false, archived: false }).select('*').single();
  if (error) return res.status(400).json({ error: 'Unable to create script.' });
  res.status(201).json({ script: data });
});

app.post('/api/scripts/:id/submit', async (req, res) => {
  const auth = await authenticatedClient(req);
  if (!auth) return res.status(401).json({ error: 'Authentication required.' });
  const { data, error } = await auth.client.from('scripts').update({ publication_state: 'submitted', submitted_at: new Date().toISOString(), published: false }).eq('id', req.params.id).eq('owner_id', auth.user.id).select('id,publication_state,submitted_at').maybeSingle();
  if (error || !data) return res.status(403).json({ error: 'Unable to submit this script.' });
  res.json({ script: data });
});

app.get('/api/admin/overview', async (req, res) => {
  const auth = await authenticatedClient(req);
  if (!auth || !(await isStaff(auth.client, auth.user.id))) return res.status(403).json({ error: 'Staff access required.' });
  const [users, scripts, published, games, reports] = await Promise.all([
    auth.client.from('profiles').select('*', { count: 'exact', head: true }),
    auth.client.from('scripts').select('*', { count: 'exact', head: true }),
    auth.client.from('scripts').select('*', { count: 'exact', head: true }).eq('published', true),
    auth.client.from('games').select('*', { count: 'exact', head: true }),
    auth.client.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'open'),
  ]);
  res.json({ users: users.count || 0, scripts: scripts.count || 0, published: published.count || 0, games: games.count || 0, openReports: reports.count || 0 });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('api error', err instanceof Error ? err.message : 'unknown');
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(port, '0.0.0.0', () => console.log(`Ario Scripts API listening on ${port}`));
