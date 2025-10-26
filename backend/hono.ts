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
}));

app.use("*", async (c, next) => {
  console.log('Request:', c.req.method, c.req.url, c.req.path);
  await next();
});

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
  })
);

app.get("/", (c) => {
  return c.json({ status: "ok", message: "Backend API is running" });
});

app.notFound((c) => {
  console.log('Not Found:', c.req.method, c.req.url, c.req.path);
  return c.json({ error: "Not Found", path: c.req.path }, 404);
});

export default app;
