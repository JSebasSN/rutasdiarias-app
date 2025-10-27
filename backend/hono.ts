import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import { initializeDatabase } from "./db/neon-client";

const app = new Hono();

initializeDatabase().catch(console.error);

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

app.notFound((c) => {
  console.log('[Hono] Not Found:', c.req.method, c.req.url, c.req.path);
  return c.json({ error: "Not Found", path: c.req.path, url: c.req.url }, 404);
});

app.onError((err, c) => {
  console.error('[Hono] Error:', err);
  return c.json({ error: err.message, stack: err.stack }, 500);
});

export default app;
