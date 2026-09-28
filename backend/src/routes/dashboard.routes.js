import { Router } from 'express';
import { getSummary } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

router.use(authenticate);

// All three roles have access to the dashboard summary, but the service handles data filtering based on the role.
router.get('/summary', authorize('ADMIN', 'OFFICER', 'MAINTENANCE'), getSummary);

export default router;
