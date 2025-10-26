import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { store } from "@/backend/db/store";

export default publicProcedure
  .input(
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(['TRAILER', 'FURGO']),
    })
  )
  .mutation(({ input }) => {
    return store.addRoute(input);
  });
