import { Router } from 'express';
import { prisma } from '../models/prisma';
import { authMiddleware, type AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/', async (req, res) => {
  const { name, email } = req.body as { name?: string; email?: string };

  if (!name || !email) {
    res.status(400).json({ error: 'name and email are required' });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'A user with this email already exists' });
    return;
  }

  const user = await prisma.user.create({ data: { name, email } });
  res.status(201).json(user);
});

router.get('/email/:email', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.params.email } });

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json(user);
});

/**
 * Case-insensitive search by name or email. Callers can pass excludeId
 * to omit themselves from the results.
 * GET /users/search?q=ali&excludeId=<uuid>
 */
router.get('/search', async (req, res) => {
  const q = (req.query.q as string | undefined)?.trim() ?? '';
  const excludeId = req.query.excludeId as string | undefined;

  if (q.length < 2) {
    res.json([]);
    return;
  }

  const users = await prisma.user.findMany({
    where: {
      AND: [
        excludeId ? { id: { not: excludeId } } : {},
        {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        },
      ],
    },
    select: { id: true, name: true, email: true },
    take: 20,
    orderBy: { name: 'asc' },
  });

  res.json(users);
});

router.get('/:id', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json(user);
});

router.post('/push-token', authMiddleware, async (req: AuthRequest, res) => {
  const { expoPushToken } = req.body as { expoPushToken?: string };

  if (!expoPushToken) {
    res.status(400).json({ error: 'expoPushToken is required' });
    return;
  }

  await prisma.user.update({
    where: { id: req.userId },
    data: { expoPushToken },
  });

  res.json({ success: true });
});

export default router;
