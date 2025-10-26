import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { store } from "@/backend/db/store";

const driverSchema = z.object({
  id: z.string(),
  name: z.string(),
  dni: z.string(),
  phone: z.string(),
});

export default publicProcedure
  .input(
    z.object({
      id: z.string(),
      date: z.string(),
      routeTemplateId: z.string(),
      routeName: z.string(),
      routeType: z.enum(['TRAILER', 'FURGO']),
      drivers: z.array(driverSchema),
      tractorPlate: z.string().optional(),
      trailerPlate: z.string().optional(),
      vehiclePlate: z.string().optional(),
      seal: z.string(),
      createdAt: z.string(),
      departureTime: z.string().optional(),
    })
  )
  .mutation(({ input }) => {
    return store.updateRecord(input);
  });
