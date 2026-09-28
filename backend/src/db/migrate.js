import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import '../models/index.js';

async function setupDatabase() {
  try {
    await connectDB();
    await mongoose.connection.syncIndexes();
    console.log('MongoDB indexes are ready.');
  } catch (error) {
    console.error('MongoDB setup failed:', error);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

setupDatabase();
