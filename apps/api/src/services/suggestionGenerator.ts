import type { AvailabilityBlock, Suggestion } from '@sosync/shared';
import { findOverlappingSlots } from './scheduling';

interface FriendContext {
  friendId: string;
  friendName: string;
  friendBlocks: AvailabilityBlock[];
}

/**
 * Builds a stable, deterministic suggestion id that depends only on the
 * data that identifies the overlap. This lets the client (and the
 * DismissedSuggestion table) reference the same suggestion across
 * refreshes without needing to persist suggestions themselves.
 */
export function suggestionKey(
  userId: string,
  friendId: string,
  dayOfWeek: string,
  startTime: string,
  endTime: string,
): string {
  return `${userId}:${friendId}:${dayOfWeek}:${startTime}:${endTime}`;
}

function overlapToSuggestion(
  userId: string,
  slot: { dayOfWeek: AvailabilityBlock['dayOfWeek']; startTime: string; endTime: string },
  friend: { id: string; name: string },
): Suggestion {
  return {
    id: suggestionKey(userId, friend.id, slot.dayOfWeek, slot.startTime, slot.endTime),
    title: `Hangout with ${friend.name}`,
    dayOfWeek: slot.dayOfWeek,
    startTime: slot.startTime,
    endTime: slot.endTime,
    category: 'social',
    friendId: friend.id,
    friendName: friend.name,
  };
}

/**
 * Given a user's availability blocks and a list of friend contexts,
 * computes every overlapping free-time slot and returns them as
 * Suggestion objects ready for the client.
 */
export function generateSuggestions(
  userId: string,
  userBlocks: AvailabilityBlock[],
  friends: FriendContext[],
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  for (const { friendId, friendName, friendBlocks } of friends) {
    const overlaps = findOverlappingSlots(userBlocks, friendBlocks);

    for (const slot of overlaps) {
      suggestions.push(
        overlapToSuggestion(userId, slot, { id: friendId, name: friendName }),
      );
    }
  }

  return suggestions;
}
