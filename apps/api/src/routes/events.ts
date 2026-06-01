import { Router } from 'express';
import { prisma } from '../models/prisma';
import { nextDateForDay } from '../services/dateUtils';
import { syncEventToCalendar } from '../services/googleCalendar';
import { sendPushNotification } from '../services/pushNotifications';

const router = Router();

router.post('/', async (req, res) => {
  const { title, startTime, endTime, category, createdBy, participantIds } = req.body as {
    title?: string; startTime?: string; endTime?: string; category?: string;
    createdBy?: string; participantIds?: string[];
  };

  if (!title || !startTime || !endTime || !category || !createdBy) {
    res.status(400).json({ error: 'title, startTime, endTime, category, and createdBy are required' });
    return;
  }

  const event = await prisma.event.create({
    data: { title, startTime, endTime, category, createdBy },
  });

  const participantData = [
    { eventId: event.id, userId: createdBy, status: 'accepted' },
    ...(participantIds ?? [])
      .filter((uid) => uid !== createdBy)
      .map((uid) => ({ eventId: event.id, userId: uid, status: 'pending' })),
  ];

  await prisma.eventParticipant.createMany({ data: participantData });
  const participants = await prisma.eventParticipant.findMany({ where: { eventId: event.id } });

  res.status(201).json({ event, participants });
});

router.post('/accept', async (req, res) => {
  const { title, dayOfWeek, startTime, endTime, category, friendId, userId } = req.body as {
    title?: string; dayOfWeek?: string; startTime?: string; endTime?: string;
    category?: string; friendId?: string; userId?: string;
  };

  if (!title || !dayOfWeek || !startTime || !endTime || !friendId || !userId) {
    res.status(400).json({ error: 'title, dayOfWeek, startTime, endTime, friendId, and userId are required' });
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

  const dateStr = nextDateForDay(dayOfWeek);

  const event = await prisma.event.create({
    data: {
      title,
      startTime: `${dateStr}T${startTime}:00Z`,
      endTime: `${dateStr}T${endTime}:00Z`,
      category: category ?? 'social',
      createdBy: userId,
    },
  });

  await prisma.eventParticipant.createMany({
    data: [
      { eventId: event.id, userId, status: 'accepted' },
      { eventId: event.id, userId: friendId, status: 'accepted' },
    ],
  });

  const participants = await prisma.eventParticipant.findMany({ where: { eventId: event.id } });

  // Calendar sync (fire-and-forget for both participants)
  syncEventToCalendar(userId, event).catch(() => {});
  syncEventToCalendar(friendId, event).catch(() => {});

  // Notify the friend about the accepted suggestion
  const acceptingUser = await prisma.user.findUnique({ where: { id: userId } });
  if (acceptingUser) {
    sendPushNotification(
      friendId,
      'Event Accepted!',
      `${acceptingUser.name} accepted "${title}"`,
    ).catch(() => {});
  }

  res.status(201).json({ event, participants });
});

router.get('/user/:userId', async (req, res) => {
  const participations = await prisma.eventParticipant.findMany({
    where: { userId: req.params.userId },
    include: { event: true },
  });

  const results = await Promise.all(
    participations.map(async (p) => {
      const allParticipants = await prisma.eventParticipant.findMany({
        where: { eventId: p.eventId },
      });
      return { event: p.event, participants: allParticipants };
    }),
  );

  res.json(results);
});

router.get('/:id', async (req, res) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });

  if (!event) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }

  const participants = await prisma.eventParticipant.findMany({ where: { eventId: event.id } });
  res.json({ event, participants });
});

router.patch('/participants/:id', async (req, res) => {
  const { status } = req.body as { status?: string };

  const participant = await prisma.eventParticipant.findUnique({ where: { id: req.params.id } });
  if (!participant) {
    res.status(404).json({ error: 'Participant not found' });
    return;
  }

  if (status !== 'accepted' && status !== 'declined') {
    res.status(400).json({ error: 'Status must be "accepted" or "declined"' });
    return;
  }

  const updated = await prisma.eventParticipant.update({
    where: { id: req.params.id },
    data: { status },
  });

  res.json(updated);
});

export default router;
