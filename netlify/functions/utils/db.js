import mongoose from 'mongoose';

let cached = global._mongoose;

export async function connectDB() {
  if (!cached) {
    cached = mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGO_DB_NAME,
      serverSelectionTimeoutMS: 5000
    });
    global._mongoose = cached;
  }
  return cached;
}
