import { MongoMemoryServer } from 'mongodb-memory-server';
import path from 'path';
import fs from 'fs';

async function start() {
  process.env.JWT_SECRET = "test-secret-that-is-at-least-32-characters-long";
  process.env.PORT = "5000";
  process.env.CORS_ORIGINS = "http://localhost:5173";

  console.log("Starting mongodb-memory-server...");
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  console.log(`MongoMemoryServer started at ${uri}`);

  process.env.MONGODB_URI = uri;

  // Import the actual server entry point to start it
  await import('./src/server.js');
}

start().catch(console.error);
