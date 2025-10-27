import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

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
  console.log('[Hono] Request:', c.req.method, c.req.url, c.req.path);
  await next();
  console.log('[Hono] Response status:', c.res.status);
});

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
    onError({ error, type, path }) {
      console.error(`[tRPC Error] ${type} at ${path}:`, error);
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
    return c.json({
      status: "error",
      error: error?.message,
      stack: error?.stack,
    }, 500);
  }
});

app.get("/test-db", async (c) => {
  try {
    const { getSql } = await import("./db/neon-client");
    const sql = getSql();
    
    const result = await sql`SELECT NOW() as current_time, version() as postgres_version` as any[];
    
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
    }, 500);
  }
});

app.notFound((c) => {
  console.log('[Hono] Not Found:', c.req.method, c.req.url, c.req.path);
  return c.json({ error: "Not Found", path: c.req.path, url: c.req.url }, 404);
});

app.onError((err, c) => {
  console.error('[Hono] Error:', err);
  return c.json({ error: err.message, stack: err.stack }, 500);
});

export default app;
