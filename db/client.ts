import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

neonConfig.webSocketConstructor = ws;

type Schema = typeof schema;

let instance: NeonDatabase<Schema> | null = null;

function getDb(): NeonDatabase<Schema> {
  if (!instance) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    const pool = new Pool({ connectionString });
    instance = drizzle(pool, { schema });
  }
  return instance;
}

// Proxied so importing this module never connects or throws — only the
// first actual query does. Next.js loads every route module during build
// (even dynamic ones) just to inspect its config, and a real DATABASE_URL
// isn't guaranteed to be present at build time everywhere it inspects.
export const db: NeonDatabase<Schema> = new Proxy({} as NeonDatabase<Schema>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});
