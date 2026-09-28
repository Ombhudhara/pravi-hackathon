import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import * as inspectionsController from '../controllers/inspections.controller.js';
import { upload } from '../utils/upload.js';
import { verifyFiles } from '../middlewares/uploads.js';

const router = express.Router();

router.use(authenticate);

router.get('/', inspectionsController.getInspections);
router.get('/:id', inspectionsController.getInspectionById);

router.post(
  '/',
  upload.fields([
    { name: 'photos', maxCount: 10 },
    { name: 'reports', maxCount: 3 }
  ]),
  verifyFiles,
  inspectionsController.createInspection
);

export default router;
