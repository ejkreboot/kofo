import 'dotenv/config';
import express from 'express';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const app = express();

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.PUBLIC_SUPABASE_ANON_KEY
);

const TOKEN_SECRET = process.env.ALBUM_TOKEN_SECRET;

// ─── Middleware ───
app.use(express.json());

// ─── Auth: verify album name + password, return JWT ───
app.post('/api/auth', async (req, res) => {
  const { albumName, password } = req.body;
  if (!albumName || !password) {
    return res.status(400).json({ error: 'Album name and password required' });
  }

  const { data, error } = await supabase.rpc('verify_album_password_by_name', {
    p_album_name: albumName,
    p_password: password,
  });

  if (error) {
    console.error('Auth RPC error:', error.message);
    return res.status(500).json({ error: 'Server error' });
  }

  if (!data || data.length === 0) {
    return res.status(401).json({ error: 'Invalid album name or password' });
  }

  const album = data[0];
  const token = jwt.sign(
    { albumId: album.id, bucketId: album.bucket_id, albumName: album.name },
    TOKEN_SECRET,
    { expiresIn: '4h' }
  );

  res.json({ token, album: { id: album.id, name: album.name } });
});

// ─── Auth middleware for protected routes ───
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    req.album = jwt.verify(header.slice(7), TOKEN_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ─── Photos: list files in the album's bucket ───
app.get('/api/photos', requireAuth, async (req, res) => {
  const { bucketId } = req.album;

  const { data, error } = await supabase.storage
    .from(bucketId)
    .list('', { limit: 500, sortBy: { column: 'name', order: 'asc' } });

  if (error) {
    console.error('Storage list error:', error.message);
    return res.status(500).json({ error: 'Failed to load photos' });
  }

  const photos = data
    .filter(f => f.name && /\.(jpe?g|png|webp|gif)$/i.test(f.name))
    .map(f => {
      const { data: urlData } = supabase.storage.from(bucketId).getPublicUrl(f.name);
      return { name: f.name, url: urlData.publicUrl };
    });

  res.json({ photos });
});

// ─── Download a single photo (proxied to avoid CORS issues) ───
app.get('/api/photos/:filename', requireAuth, async (req, res) => {
  const { bucketId } = req.album;
  const { filename } = req.params;

  if (filename.includes('/') || filename.includes('..')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  const { data, error } = await supabase.storage.from(bucketId).download(filename);

  if (error) {
    console.error('Download error:', error.message);
    return res.status(404).json({ error: 'Photo not found' });
  }

  const arrayBuffer = await data.arrayBuffer();
  res.set('Content-Type', data.type || 'image/jpeg');
  res.set('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(Buffer.from(arrayBuffer));
});

export default app;
