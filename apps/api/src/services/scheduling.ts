import type { AvailabilityBlock, TimeSlot } from '@sosync/shared';

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const m = (totalMinutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Finds overlapping free-time slots between two users' availability blocks.
 *
 * Algorithm:
 *  1. Filter each user's blocks to only "free" type
 *  2. For each pair sharing the same dayOfWeek, compute the time intersection
 *  3. If the intersection is non-empty (start < end), record it as a TimeSlot
 */
export function findOverlappingSlots(
  blocksA: AvailabilityBlock[],
  blocksB: AvailabilityBlock[],
): TimeSlot[] {
  const overlaps: TimeSlot[] = [];

  const freeA = blocksA.filter((b) => b.type === 'free');
  const freeB = blocksB.filter((b) => b.type === 'free');

  for (const a of freeA) {
    for (const b of freeB) {
      if (a.dayOfWeek !== b.dayOfWeek) continue;

      const overlapStart = Math.max(timeToMinutes(a.startTime), timeToMinutes(b.startTime));
      const overlapEnd = Math.min(timeToMinutes(a.endTime), timeToMinutes(b.endTime));

      if (overlapStart < overlapEnd) {
        overlaps.push({
          dayOfWeek: a.dayOfWeek,
          startTime: minutesToTime(overlapStart),
          endTime: minutesToTime(overlapEnd),
        });
      }
    }
  }

  return overlaps;
}
