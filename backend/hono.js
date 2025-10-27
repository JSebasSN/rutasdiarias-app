const { Hono } = require("hono");
const { trpcServer } = require("@hono/trpc-server");
const { cors } = require("hono/cors");
const { appRouter } = require("./trpc/app-router");
const { createContext } = require("./trpc/create-context");

const app = new Hono();

app.use("*", cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.options("*", (c) => {
  return c.json({}, 204);
});

app.use("*", async (c, next) => {
  const startTime = Date.now();
  console.log('[Hono] Request:', c.req.method, c.req.path);
  
  try {
    await next();
    const duration = Date.now() - startTime;
    console.log('[Hono] Response:', c.res.status, 'in', duration, 'ms');
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Hono] Error after', duration, 'ms:', error?.message);
    throw error;
  }
});

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
    onError({ error, type, path }) {
      console.error(`[tRPC] ${type} at ${path}:`, error?.message);
    },
  })
);

app.get("/", (c) => {
  return c.json({ 
    status: "ok", 
    message: "Backend API is running",
    timestamp: new Date().toISOString()
  });
});

app.get("/health", (c) => {
  return c.json({ 
    status: "ok", 
    timestamp: new Date().toISOString() 
  });
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
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Debug] Error:', error);
    return c.json({
      status: "error",
      error: error?.message,
    }, 500);
  }
});

app.get("/test-db", async (c) => {
  try {
    console.log('[Test DB] Starting...');
    const { getSql } = require("./db/neon-client");
    const sql = getSql();
    
    console.log('[Test DB] Executing query...');
    const result = await sql`SELECT NOW() as current_time, version() as postgres_version`;
    console.log('[Test DB] Success');
    
    return c.json({
      status: "ok",
      message: "Database connection successful",
      result: result && result.length > 0 ? result[0] : null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Test DB] Error:', error?.message);
    return c.json({
      status: "error",
      message: "Database connection failed",
      error: error?.message,
      env: {
        hasNetlifyDbUrl: !!process.env.NETLIFY_DATABASE_URL,
        hasDbUrl: !!process.env.DATABASE_URL,
      },
    }, 500);
  }
});

app.notFound((c) => {
  console.log('[Hono] Not Found:', c.req.path);
  return c.json({ error: "Not Found", path: c.req.path }, 404);
});

app.onError((err, c) => {
  console.error('[Hono] Error:', err?.message);
  
  return c.json({ 
    error: err?.message || 'Internal Server Error',
  }, 500);
});

module.exports = { default: app };
