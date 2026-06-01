import { Expo, type ExpoPushMessage } from 'expo-server-sdk';
import { prisma } from '../models/prisma';

const expo = new Expo();

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user?.expoPushToken || !Expo.isExpoPushToken(user.expoPushToken)) {
    return false;
  }

  try {
    const message: ExpoPushMessage = {
      to: user.expoPushToken,
      sound: 'default',
      title,
      body,
    };

    await expo.sendPushNotificationsAsync([message]);
    return true;
  } catch (err) {
    console.error(`Push notification failed for user ${userId}:`, err);
    return false;
  }
}
