import { Router } from 'express';
import { prisma } from '../models/prisma';

const router = Router();

router.post('/', async (req, res) => {
  const { userId, dayOfWeek, startTime, endTime, type } = req.body as {
    userId?: string; dayOfWeek?: string; startTime?: string; endTime?: string; type?: string;
  };

  if (!userId || !dayOfWeek || !startTime || !endTime || !type) {
    res.status(400).json({ error: 'All fields are required: userId, dayOfWeek, startTime, endTime, type' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const block = await prisma.availabilityBlock.create({
    data: { userId, dayOfWeek, startTime, endTime, type },
  });

  res.status(201).json(block);
});

router.get('/:userId', async (req, res) => {
  const blocks = await prisma.availabilityBlock.findMany({
    where: { userId: req.params.userId },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });
  res.json(blocks);
});

router.delete('/:id', async (req, res) => {
  const existing = await prisma.availabilityBlock.findUnique({
    where: { id: req.params.id },
  });
  if (!existing) {
    res.status(404).json({ error: 'Availability block not found' });
    return;
  }
  await prisma.availabilityBlock.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export default router;
