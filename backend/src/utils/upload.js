import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { config } from '../config/env.js';

const uploadDir = config.uploadDir;

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'].includes(ext) ? ext : '.bin';
    const uniqueName = crypto.randomUUID() + safeExt;
    cb(null, uniqueName);
  }
});

const limits = {
  // Allow slightly more than max so we can catch and send nice errors instead of truncation
  fileSize: 10 * 1024 * 1024 // 10 MB max for any file
};

export const upload = multer({ storage, limits });
