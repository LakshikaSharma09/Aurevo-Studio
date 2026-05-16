import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var -- mongoose cache on global for HMR
  var mongooseConn:
    | { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
    | undefined;
}

const g = global as typeof globalThis & {
  mongooseConn?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
};

if (!g.mongooseConn) {
  g.mongooseConn = { conn: null, promise: null };
}

const cache = g.mongooseConn;

export async function dbConnect(): Promise<typeof mongoose> {
  const { getServerEnv } = await import("@/lib/env");
  const uri = getServerEnv().MONGODB_URI;
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    // WSL2 often cannot reach Atlas over IPv6 (ENETUNREACH); prefer IPv4.
    cache.promise = mongoose
      .connect(uri, { family: 4, serverSelectionTimeoutMS: 15_000 })
      .then((m) => m);
  }
  cache.conn = await cache.promise;
  return cache.conn;
}
