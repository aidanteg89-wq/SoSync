export type FriendStatus = 'pending' | 'accepted';

export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  status: FriendStatus;
}

export interface CreateFriendInput {
  userId: string;
  friendId: string;
}
