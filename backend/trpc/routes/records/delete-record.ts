import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { store } from "@/backend/db/store";

export default publicProcedure
  .input(z.object({ recordId: z.string() }))
  .mutation(({ input }) => {
    return store.deleteRecord(input.recordId);
  });
