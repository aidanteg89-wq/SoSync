import { Router } from 'express';
import { prisma } from '../models/prisma';
import { findOverlappingSlots } from '../services/scheduling';

const router = Router();

router.get('/overlap', async (req, res) => {
  const { userA, userB } = req.query as { userA?: string; userB?: string };

  if (!userA || !userB) {
    res.status(400).json({ error: 'userA and userB query params are required' });
    return;
  }

  const [blocksA, blocksB] = await Promise.all([
    prisma.availabilityBlock.findMany({ where: { userId: userA } }),
    prisma.availabilityBlock.findMany({ where: { userId: userB } }),
  ]);

  const overlappingSlots = findOverlappingSlots(blocksA as any, blocksB as any);

  res.json({ userA, userB, overlappingSlots });
});

export default router;
