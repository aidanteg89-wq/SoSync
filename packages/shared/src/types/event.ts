export type EventCategory = 'social' | 'personal' | 'community';

export type ParticipantStatus = 'pending' | 'accepted' | 'declined';

export interface Event {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  category: EventCategory;
  createdBy: string;
}

export interface EventParticipant {
  id: string;
  eventId: string;
  userId: string;
  status: ParticipantStatus;
}

export interface CreateEventInput {
  title: string;
  startTime: string;
  endTime: string;
  category: EventCategory;
  createdBy: string;
  participantIds: string[];
}
