import express from 'express';
import { getMapAssets } from '../controllers/map.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

router.use(authenticate);

router.get('/assets', authorize('ADMIN', 'OFFICER'), getMapAssets);

export default router;
