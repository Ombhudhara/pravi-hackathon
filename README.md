# PropertyNexus

Internal web platform for tracking government land and public properties.

## Requirements
- Node.js 18+
- MongoDB 6+

## Backend Setup
1. `cd backend`
2. `npm install`
3. Copy `.env.example` to `.env` and set `MONGODB_URI` to your MongoDB connection string.
4. Create MongoDB indexes: `npm run db:setup`
5. Start the server: `npm run dev`

## Frontend Setup
1. `cd frontend`
2. `npm install`
3. Copy `.env.example` to `.env`.
4. Start the development server: `npm run dev`

## Architecture Notes
- Frontend: React, React Router, plain CSS, Vite.
- Backend: Node.js, Express, Mongoose (MongoDB).
