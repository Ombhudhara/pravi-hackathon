import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

// All analytics routes require authentication. MAINTENANCE has no access (403).
router.use(authenticate);
router.use(authorize('ADMIN', 'OFFICER'));

router.get('/utilization', analyticsController.getUtilization);
router.get('/condition',   analyticsController.getCondition);
router.get('/maintenance', analyticsController.getMaintenance);
router.get('/inspections', analyticsController.getInspections);
router.get('/export',      analyticsController.exportReport);

export default router;
