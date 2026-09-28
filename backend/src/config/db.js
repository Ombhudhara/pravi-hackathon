import mongoose from 'mongoose';
import { config } from './env.js';

export const connectDB = async () => {
  try {
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 30000,
    });
    console.log('MongoDB connected:', mongoose.connection.host);
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await disconnectDB();
  console.log('MongoDB connection closed');
  process.exit(0);
});

export default mongoose;
