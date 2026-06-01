import type { DayOfWeek } from './availability';
import type { EventCategory } from './event';

export interface Suggestion {
  id: string;
  title: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  category: EventCategory;
  friendId: string;
  friendName: string;
}
