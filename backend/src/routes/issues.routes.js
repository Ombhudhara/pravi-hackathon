import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { upload as uploadMiddleware } from '../utils/upload.js';
import * as issuesController from '../controllers/issues.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', issuesController.getIssues);
router.get('/assignees', authorize('ADMIN'), issuesController.getAssignees);
router.get('/:id', issuesController.getIssueById);

router.post('/', authorize('ADMIN', 'OFFICER'), uploadMiddleware.array('photos', 5), issuesController.createIssue);
router.patch('/:id', authorize('ADMIN', 'OFFICER'), issuesController.updateIssue);
router.post('/:id/transition', uploadMiddleware.array('evidence', 10), issuesController.transitionIssue);

export default router;
