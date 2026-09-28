import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const requiredVars = ['MONGODB_URI', 'CORS_ORIGIN', 'JWT_SECRET'];

for (const envVar of requiredVars) {
  if (!process.env[envVar]) {
    console.error(`Error: Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  console.error('Error: JWT_SECRET must be at least 32 characters long.');
  process.exit(1);
}

const inspectionIntervalDays = process.env.INSPECTION_INTERVAL_DAYS === undefined
  ? 365
  : Number(process.env.INSPECTION_INTERVAL_DAYS);

if (!Number.isInteger(inspectionIntervalDays) || inspectionIntervalDays < 1) {
  console.error('Error: INSPECTION_INTERVAL_DAYS must be a positive integer.');
  process.exit(1);
}

const signupEnabledRaw = process.env.SIGNUP_ENABLED;
const signupEnabled = signupEnabledRaw === undefined || signupEnabledRaw === 'true';

export const config = {
  port: process.env.PORT || 3000,
  mongodbUri: process.env.MONGODB_URI,
  corsOrigin: process.env.CORS_ORIGIN,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL,
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD,
  seedAdminName: process.env.SEED_ADMIN_NAME,
  underutilizedThreshold: parseInt(process.env.UNDERUTILIZED_THRESHOLD, 10) || 40,
  appTimezone: process.env.APP_TIMEZONE || 'Asia/Kolkata',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  inspectionIntervalDays,
  signupEnabled
};
