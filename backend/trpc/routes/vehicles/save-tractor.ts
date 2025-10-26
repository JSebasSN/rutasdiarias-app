import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { store } from "@/backend/db/store";

export default publicProcedure
  .input(
    z.object({
      id: z.string(),
      plate: z.string(),
      routeId: z.string(),
      usageCount: z.number(),
      lastUsed: z.string(),
    })
  )
  .mutation(({ input }) => {
    return store.saveTractor(input);
  });
