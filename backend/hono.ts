import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import { runMigrations } from "./db/migrate";

const app = new Hono();

let migrationPromise: Promise<any> | null = null;

function ensureMigrations() {
  if (!migrationPromise) {
    migrationPromise = runMigrations().catch((error) => {
      console.error('[App] Migration failed:', error);
      migrationPromise = null;
      return null;
    });
  }
  return migrationPromise;
}

app.use("*", cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  exposeHeaders: ['Content-Length', 'X-Request-Id'],
}));

app.options("*", (c) => {
  return new Response(null, { status: 204 });
});

app.use("*", async (c, next) => {
  const startTime = Date.now();
  const path = c.req.path;
  console.log('[Hono] Request:', c.req.method, path);
  
  try {
    if (path.startsWith('/trpc/')) {
      console.log('[Hono] Ensuring migrations before tRPC request');
      await ensureMigrations();
    }
    
    await next();
    
    const duration = Date.now() - startTime;
    console.log('[Hono] Response:', c.res.status, 'in', duration, 'ms');
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Hono] Error after', duration, 'ms:', error);
    console.error('[Hono] Error stack:', error instanceof Error ? error.stack : 'No stack');
    throw error;
  }
});

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
    onError({ error, type, path }) {
      console.error(`[tRPC Error] ${type} at ${path}:`);
      console.error('[tRPC Error] Message:', error?.message);
      console.error('[tRPC Error] Stack:', error?.stack);
      console.error('[tRPC Error] Cause:', error?.cause);
    },
  })
);

app.get("/", (c) => {
  return c.json({ status: "ok", message: "Backend API is running" });
});

app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/debug", async (c) => {
  try {
    const dbUrl = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
    
    return c.json({
      status: "ok",
      environment: {
        hasNetlifyDbUrl: !!process.env.NETLIFY_DATABASE_URL,
        hasDbUrl: !!process.env.DATABASE_URL,
        dbUrlPrefix: dbUrl ? dbUrl.substring(0, 25) + '...' : 'NOT SET',
        nodeEnv: process.env.NODE_ENV,
        nodeVersion: process.version,
      },
      database: {
        connectionInitialized: !!dbUrl,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Debug] Error:', error);
    return c.json({
      status: "error",
      error: error?.message,
      stack: error?.stack,
    }, 500);
  }
});

app.get("/test-db", async (c) => {
  try {
    console.log('[Test DB] Starting database test...');
    const { getSql } = await import("./db/neon-client");
    const sql = getSql();
    
    console.log('[Test DB] Executing query...');
    const result = await sql`SELECT NOW() as current_time, version() as postgres_version` as any[];
    console.log('[Test DB] Query successful:', result);
    
    return c.json({
      status: "ok",
      message: "Database connection successful",
      result: result && result.length > 0 ? result[0] : null,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Test DB] Error:', error);
    return c.json({
      status: "error",
      message: "Database connection failed",
      error: error?.message,
      stack: error?.stack,
      code: error?.code,
      env: {
        hasNetlifyDbUrl: !!process.env.NETLIFY_DATABASE_URL,
        hasDbUrl: !!process.env.DATABASE_URL,
      },
    }, 500);
  }
});

app.notFound((c) => {
  console.log('[Hono] Not Found:', c.req.method, c.req.path);
  return c.json({ error: "Not Found", path: c.req.path }, 404);
});

app.onError((err, c) => {
  console.error('[Hono] Global Error Handler:', err);
  console.error('[Hono] Error message:', err?.message);
  console.error('[Hono] Error stack:', err?.stack);
  
  return c.json({ 
    error: err?.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined,
  }, 500);
});

export default app;
