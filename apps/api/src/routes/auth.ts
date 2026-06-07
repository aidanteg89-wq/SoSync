import { Router } from 'express';
import bcrypt from 'bcrypt';
import { google } from 'googleapis';
import { prisma } from '../models/prisma';
import { signToken } from '../middleware/auth';

const router = Router();

const SALT_ROUNDS = 10;

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body as {
    name?: string; email?: string; password?: string;
  };

  if (!name || !email || !password) {
    res.status(400).json({ error: 'name, email, and password are required' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'A user with this email already exists' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  const token = signToken(user.id);
  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = signToken(user.id);
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
  });
});

/**
 * Google OAuth: authorization code exchange.
 * Client runs the PKCE code flow, then POSTs the resulting code +
 * redirectUri here. We exchange server-side so the client_secret
 * stays on the server, and so we can persist the refresh token that
 * Calendar sync depends on.
 *
 * Body: { code, redirectUri, codeVerifier? }
 */
router.post('/google', async (req, res) => {
  const { code, redirectUri, codeVerifier } = req.body as {
    code?: string; redirectUri?: string; codeVerifier?: string;
  };

  if (!code || !redirectUri) {
    res.status(400).json({ error: 'code and redirectUri are required' });
    return;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    res.status(500).json({ error: 'Google OAuth is not configured on the server' });
    return;
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  let tokens;
  try {
    const result = await oauth2Client.getToken({
      code,
      codeVerifier,
      redirect_uri: redirectUri,
    });
    tokens = result.tokens;
  } catch (err) {
    console.error('Google token exchange failed:', err);
    res.status(401).json({ error: 'Failed to exchange Google authorization code' });
    return;
  }

  if (!tokens.id_token) {
    res.status(401).json({ error: 'Google did not return an ID token' });
    return;
  }

  let payload;
  try {
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientId,
    });
    payload = ticket.getPayload();
  } catch (err) {
    console.error('Google ID token verification failed:', err);
    res.status(401).json({ error: 'Invalid Google ID token' });
    return;
  }

  if (!payload?.sub || !payload.email) {
    res.status(401).json({ error: 'Google ID token missing required fields' });
    return;
  }

  const googleId = payload.sub;
  const email = payload.email;
  const name = payload.name ?? email.split('@')[0]!;

  let user = await prisma.user.findUnique({ where: { googleId } });

  if (!user) {
    const byEmail = await prisma.user.findUnique({ where: { email } });
    user = byEmail
      ? await prisma.user.update({ where: { id: byEmail.id }, data: { googleId } })
      : await prisma.user.create({ data: { name, email, googleId } });
  }

  // Only overwrite the refresh token when Google returns a fresh one
  // (Google only returns it on the first consent unless we ask for offline + prompt=consent).
  if (tokens.refresh_token) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleRefreshToken: tokens.refresh_token },
    });
  }

  const token = signToken(user.id);
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
    calendarConnected: Boolean(user.googleRefreshToken),
  });
});

/**
 * OAuth redirect target registered in Google Cloud Console.
 * Google requires https:// URLs on a public domain (e.g. *.onrender.com).
 * Expo's in-app browser completes the session when this URL loads with ?code=...
 */
router.get('/google/callback', (req, res) => {
  const { error, error_description: errorDescription } = req.query;

  if (error) {
    res.status(400).send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Sign-in failed</title></head>
<body style="font-family:system-ui;padding:2rem;text-align:center">
  <h1>Google sign-in failed</h1>
  <p>${String(errorDescription ?? error)}</p>
  <p>You can close this window and return to SoSync.</p>
</body></html>`);
    return;
  }

  res.send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Signed in</title></head>
<body style="font-family:system-ui;padding:2rem;text-align:center">
  <h1>Signed in with Google</h1>
  <p>Return to the SoSync app — you can close this window.</p>
</body></html>`);
});

export default router;
