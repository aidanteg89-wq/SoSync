import { Router } from 'express';
import { prisma } from '../models/prisma';
import { sendPushNotification } from '../services/pushNotifications';

const router = Router();

router.post('/', async (req, res) => {
  const { userId, friendId } = req.body as { userId?: string; friendId?: string };

  if (!userId || !friendId) {
    res.status(400).json({ error: 'userId and friendId are required' });
    return;
  }

  if (userId === friendId) {
    res.status(400).json({ error: 'Cannot add yourself as a friend' });
    return;
  }

  const [user, friend] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.user.findUnique({ where: { id: friendId } }),
  ]);

  if (!user || !friend) {
    res.status(404).json({ error: 'One or both users not found' });
    return;
  }

  const existing = await prisma.friend.findFirst({
    where: {
      OR: [
        { userId, friendId },
        { userId: friendId, friendId: userId },
      ],
    },
  });

  if (existing) {
    res.status(409).json({ error: 'Friend request already exists' });
    return;
  }

  const friendship = await prisma.friend.create({
    data: { userId, friendId, status: 'pending' },
  });

  // Notify the target user about the friend request
  const sender = await prisma.user.findUnique({ where: { id: userId } });
  if (sender) {
    sendPushNotification(
      friendId,
      'New Friend Request',
      `${sender.name} sent you a friend request`,
    ).catch(() => {});
  }

  res.status(201).json(friendship);
});

router.patch('/:id/accept', async (req, res) => {
  const friendship = await prisma.friend.findUnique({ where: { id: req.params.id } });

  if (!friendship) {
    res.status(404).json({ error: 'Friend request not found' });
    return;
  }

  const updated = await prisma.friend.update({
    where: { id: req.params.id },
    data: { status: 'accepted' },
  });

  res.json(updated);
});

router.get('/user/:userId', async (req, res) => {
  const me = req.params.userId;
  const friends = await prisma.friend.findMany({
    where: { OR: [{ userId: me }, { friendId: me }] },
    include: {
      user: { select: { id: true, name: true, email: true } },
      friend: { select: { id: true, name: true, email: true } },
    },
  });

  // Flatten so the client always knows who the "other" party is
  const shaped = friends.map((f) => {
    const other = f.userId === me ? f.friend : f.user;
    return {
      id: f.id,
      userId: f.userId,
      friendId: f.friendId,
      status: f.status,
      other,
    };
  });

  res.json(shaped);
});

export default router;
