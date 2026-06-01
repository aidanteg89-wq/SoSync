import { Router } from 'express';
import { prisma } from '../models/prisma';
import { generateSuggestions } from '../services/suggestionGenerator';

const router = Router();

router.get('/', async (req, res) => {
  const userId = req.query.userId as string | undefined;

  if (!userId) {
    res.status(400).json({ error: 'userId query param is required' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const friendships = await prisma.friend.findMany({
    where: {
      OR: [{ userId }, { friendId: userId }],
      status: 'accepted',
    },
  });

  const friendContexts = await Promise.all(
    friendships.map(async (f) => {
      const fId = f.userId === userId ? f.friendId : f.userId;
      const friend = await prisma.user.findUnique({ where: { id: fId } });
      if (!friend) return null;
      const friendBlocks = await prisma.availabilityBlock.findMany({ where: { userId: fId } });
      return {
        friendId: friend.id,
        friendName: friend.name,
        friendBlocks,
      };
    }),
  );

  const validContexts = friendContexts.filter((ctx) => ctx !== null);
  const userBlocks = await prisma.availabilityBlock.findMany({ where: { userId } });
  const allSuggestions = generateSuggestions(userId, userBlocks as any, validContexts as any);

  // Filter out suggestions the user has explicitly dismissed
  const dismissed = await prisma.dismissedSuggestion.findMany({ where: { userId } });
  const dismissedKeys = new Set(
    dismissed.map((d) => `${d.friendId}:${d.dayOfWeek}:${d.startTime}:${d.endTime}`),
  );

  const filtered = allSuggestions.filter(
    (s) => !dismissedKeys.has(`${s.friendId}:${s.dayOfWeek}:${s.startTime}:${s.endTime}`),
  );

  res.json(filtered);
});

/**
 * Dismiss a suggestion so it stops reappearing in the user's feed.
 * Idempotent — repeated calls for the same (user,friend,slot) are no-ops.
 */
router.post('/decline', async (req, res) => {
  const { userId, friendId, dayOfWeek, startTime, endTime } = req.body as {
    userId?: string;
    friendId?: string;
    dayOfWeek?: string;
    startTime?: string;
    endTime?: string;
  };

  if (!userId || !friendId || !dayOfWeek || !startTime || !endTime) {
    res.status(400).json({
      error: 'userId, friendId, dayOfWeek, startTime, endTime are all required',
    });
    return;
  }

  await prisma.dismissedSuggestion.upsert({
    where: {
      userId_friendId_dayOfWeek_startTime_endTime: {
        userId,
        friendId,
        dayOfWeek,
        startTime,
        endTime,
      },
    },
    create: { userId, friendId, dayOfWeek, startTime, endTime },
    update: {},
  });

  res.json({ success: true });
});

export default router;
