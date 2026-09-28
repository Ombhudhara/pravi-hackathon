import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import * as attachmentsController from '../controllers/attachments.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/:id/download', attachmentsController.downloadAttachment);

export default router;
