import mongoose from "mongoose";
import { env } from "@/env";

/**
 * Кэшируемое подключение к MongoDB: при HMR в dev модуль пересоздаётся,
 * поэтому соединение и in-flight promise храним в globalThis.
 */
const globalForMongo = globalThis as unknown as {
  mongoConn?: typeof mongoose;
  mongoPromise?: Promise<typeof mongoose>;
};

export async function connectMongo(): Promise<typeof mongoose> {
  if (globalForMongo.mongoConn) return globalForMongo.mongoConn;

  if (!globalForMongo.mongoPromise) {
    globalForMongo.mongoPromise = mongoose.connect(env.MONGODB_URI, {
      bufferCommands: false,
    });
  }

  try {
    globalForMongo.mongoConn = await globalForMongo.mongoPromise;
  } catch (error) {
    globalForMongo.mongoPromise = undefined;
    throw error;
  }

  return globalForMongo.mongoConn;
}
