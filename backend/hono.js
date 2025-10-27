const { Hono } = require("hono");
const { trpcServer } = require("@hono/trpc-server");
const { cors } = require("hono/cors");
const { appRouter } = require("./trpc/app-router");
const { createContext } = require("./trpc/create-context");
const { runMigrations } = require("./db/migrate");

const app = new Hono();

let migrationPromise = null;
let migrationCompleted = false;

function ensureMigrations() {
  if (migrationCompleted) {
    return Promise.resolve();
  }
  if (!migrationPromise) {
    migrationPromise = runMigrations().then(() => {
      migrationCompleted = true;
    }).catch((error) => {
      console.error('[App] Migration failed:', error);
      migrationPromise = null;
      throw error;
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
  console.log('[Hono] Request:', c.req.method, c.req.url, c.req.path);
  try {
    if (c.req.path.startsWith('/trpc/')) {
      await ensureMigrations();
    }
    await next();
    const duration = Date.now() - startTime;
    console.log('[Hono] Response status:', c.res.status, 'in', duration, 'ms');
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Hono] Error after', duration, 'ms:', error);
    throw error;
  }
});

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
    onError({ error, type, path }) {
      console.error(`[tRPC Error] ${type} at ${path}:`, error);
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
  } catch (error) {
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
    const { getSql } = require("./db/neon-client");
    const sql = getSql();
    
    console.log('[Test DB] Executing query...');
    const result = await sql`SELECT NOW() as current_time, version() as postgres_version`;
    console.log('[Test DB] Query successful');
    
    return c.json({
      status: "ok",
      message: "Database connection successful",
      result: result && result.length > 0 ? result[0] : null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
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
  console.log('[Hono] Not Found:', c.req.method, c.req.url, c.req.path);
  return c.json({ error: "Not Found", path: c.req.path, url: c.req.url }, 404);
});

app.onError((err, c) => {
  console.error('[Hono] Error:', err);
  return c.json({ error: err.message, stack: err.stack }, 500);
});

module.exports = { default: app };
