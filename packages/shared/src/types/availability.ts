export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type AvailabilityType = 'work' | 'free' | 'personal';

export interface AvailabilityBlock {
  id: string;
  userId: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:mm format (24hr)
  endTime: string;   // HH:mm format (24hr)
  type: AvailabilityType;
}

export interface CreateAvailabilityInput {
  userId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  type: AvailabilityType;
}

/** Represents an overlapping time window between two users */
export interface TimeSlot {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}
