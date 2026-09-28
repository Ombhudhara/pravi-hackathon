import express from 'express';
import { 
  getAssets, 
  getAssetFilters, 
  getAssetById, 
  createAsset, 
  updateAsset, 
  changeAssetStatus,
  getAssetInspections,
  getAssetIssues
} from '../controllers/assets.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { assetEventsRouter, assetLifecycleRouter } from './lifecycle.routes.js';

const router = express.Router();

router.use(authenticate);

// Note: No hard delete endpoint. 
// Retiring is done by setting status RETIRED, TRANSFERRED or DISPOSED.
// Assets in those statuses stay visible and are shown with a clear status badge.

router.get('/', authorize('ADMIN', 'OFFICER'), getAssets);
router.get('/filters', authorize('ADMIN', 'OFFICER'), getAssetFilters);
router.get('/:id', authorize('ADMIN', 'OFFICER'), getAssetById);

router.post('/', authorize('ADMIN'), createAsset);
router.patch('/:id', authorize('ADMIN'), updateAsset);
router.patch('/:id/status', authorize('ADMIN', 'OFFICER'), changeAssetStatus);

router.use('/:id/events', assetEventsRouter);
router.use('/:id/lifecycle', assetLifecycleRouter);
router.get('/:id/inspections', authorize('ADMIN', 'OFFICER'), getAssetInspections);
router.get('/:id/issues', authorize('ADMIN', 'OFFICER'), getAssetIssues);

export default router;
