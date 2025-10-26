import { publicProcedure } from "@/backend/trpc/create-context";
import { store } from "@/backend/db/store";

export default publicProcedure.query(() => {
  return store.getVans();
});
