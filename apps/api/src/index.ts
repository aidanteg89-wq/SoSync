import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import healthRoutes from './routes/health';
import userRoutes from './routes/users';
import availabilityRoutes from './routes/availability';
import friendRoutes from './routes/friends';
import eventRoutes from './routes/events';
import schedulingRoutes from './routes/scheduling';
import suggestionRoutes from './routes/suggestions';
import authRoutes from './routes/auth';

const app = express();
const PORT = process.env.PORT ?? 3000;
const HOST = process.env.HOST ?? '0.0.0.0';

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean);
app.use(
  cors(
    allowedOrigins?.length
      ? { origin: allowedOrigins, credentials: true }
      : undefined,
  ),
);
app.use(express.json());

app.use('/health', healthRoutes);
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/availability', availabilityRoutes);
app.use('/friends', friendRoutes);
app.use('/events', eventRoutes);
app.use('/scheduling', schedulingRoutes);
app.use('/suggestions', suggestionRoutes);

app.listen(Number(PORT), HOST, () => {
  console.log(`SoSync API running on http://${HOST}:${PORT}`);
});

export default app;
