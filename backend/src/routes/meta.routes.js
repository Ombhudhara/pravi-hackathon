import { Router } from 'express';
import { getEnums } from '../controllers/meta.controller.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

// Meta endpoints available to any authenticated user
router.get('/enums', authenticate, getEnums);

export default router;
