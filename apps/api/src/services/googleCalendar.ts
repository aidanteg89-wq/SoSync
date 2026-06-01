import { google } from 'googleapis';
import { prisma } from '../models/prisma';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
);

export async function syncEventToCalendar(
  userId: string,
  event: { title: string; startTime: string; endTime: string },
): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user?.googleRefreshToken) {
    return false;
  }

  try {
    oauth2Client.setCredentials({ refresh_token: user.googleRefreshToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: event.title,
        start: { dateTime: event.startTime },
        end: { dateTime: event.endTime },
      },
    });

    return true;
  } catch (err) {
    console.error(`Calendar sync failed for user ${userId}:`, err);
    return false;
  }
}
