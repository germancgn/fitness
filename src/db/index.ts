import * as schema from "@/db/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var _pgClient: ReturnType<typeof postgres> | undefined;
}

const client =
  globalThis._pgClient ??
  postgres(process.env.DATABASE_URL ?? "", { max: 1, prepare: false });
if (process.env.NODE_ENV === "development") globalThis._pgClient = client;
export const db = drizzle(client, { schema });
