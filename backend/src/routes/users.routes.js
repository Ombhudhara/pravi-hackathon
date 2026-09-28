import express from 'express';
import * as usersController from '../controllers/users.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', usersController.getUsers);
router.post('/', usersController.createUser);
router.patch('/:id', usersController.updateUser);
router.post('/:id/reset-password', usersController.resetPassword);

export default router;
