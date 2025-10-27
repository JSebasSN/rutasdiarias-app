const { initTRPC } = require("@trpc/server");
const superjson = require("superjson");

const createContext = async (opts) => {
  return {
    req: opts.req,
  };
};

const t = initTRPC.context().create({
  transformer: superjson,
});

const createTRPCRouter = t.router;
const publicProcedure = t.procedure;

module.exports = {
  createContext,
  createTRPCRouter,
  publicProcedure,
};
