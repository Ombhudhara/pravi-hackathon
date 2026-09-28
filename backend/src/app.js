import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config/env.js';
import { requestLogger } from './middleware/requestLogger.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import metaRoutes from './routes/meta.routes.js';
import assetsRoutes from './routes/assets.routes.js';
import lifecycleRoutes from './routes/lifecycle.routes.js';
import mapRoutes from './routes/map.routes.js';
import inspectionsRoutes from './routes/inspections.routes.js';
import attachmentsRoutes from './routes/attachments.routes.js';
import issuesRoutes from './routes/issues.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1') || origin === config.corsOrigin) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/meta', metaRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/lifecycle', lifecycleRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/inspections', inspectionsRoutes);
app.use('/api/attachments', attachmentsRoutes);
app.use('/api/issues', issuesRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
