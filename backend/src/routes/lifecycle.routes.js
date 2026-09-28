import express from 'express';
import { 
  getAssetEvents, 
  addAssetEvent, 
  getAssetLifecycle, 
  getGlobalEvents 
} from '../controllers/lifecycle.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

router.use(authenticate);

// Global event feed
router.get('/events', authorize('ADMIN', 'OFFICER'), getGlobalEvents);

// Scoped asset endpoints (we can mount them either on /api/assets/:id/events or /api/lifecycle/assets/:id)
// The spec said: "Endpoints... GET /api/assets/:id/events... GET /api/assets/:id/lifecycle"
// So we can expose a router for /api/lifecycle and one for attaching to assets. 
// We'll export the asset-specific ones to be mounted in assets.routes.js or mount them directly here using a trick.
// For clean routing, let's mount them in app.js as app.use('/api/assets', lifecycleRoutes) if we want, or just define them here and mount at /api.

export const assetEventsRouter = express.Router({ mergeParams: true });
assetEventsRouter.get('/', authorize('ADMIN', 'OFFICER'), getAssetEvents);
assetEventsRouter.post('/', authorize('ADMIN', 'OFFICER'), addAssetEvent);

export const assetLifecycleRouter = express.Router({ mergeParams: true });
assetLifecycleRouter.get('/', authorize('ADMIN', 'OFFICER'), getAssetLifecycle);

export default router;
