import express from 'express';
import mongoose from 'mongoose';
import { config } from '../config/env.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: 'Service is healthy',
      data: {
        database_connected: mongoose.connection.readyState === 1,
        signupEnabled: config.signupEnabled,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) { next(error); }
});

export default router;
