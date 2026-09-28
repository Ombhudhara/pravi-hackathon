import app from './app.js';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';

async function startServer() {
  try {
    await connectDB();
    
    app.listen(config.port, () => {
      console.log(`Server listening on port ${config.port}`);
    });
  } catch (err) {
    console.error('Failed to start server. Database connection failed.', err);
    process.exit(1);
  }
}

startServer();
