import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "./create-context";
import { store } from "../db/store";

const driverSchema = z.object({
  id: z.string(),
  name: z.string(),
  dni: z.string(),
  phone: z.string(),
});

const routeTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['TRAILER', 'FURGO']),
});

const routeRecordSchema = z.object({
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
});

const savedDriverSchema = z.object({
  id: z.string(),
  name: z.string(),
  dni: z.string(),
  phone: z.string(),
  routeId: z.string(),
  usageCount: z.number(),
  lastUsed: z.string(),
});

const savedVehicleSchema = z.object({
  id: z.string(),
  plate: z.string(),
  routeId: z.string(),
  usageCount: z.number(),
  lastUsed: z.string(),
});

export const appRouter = createTRPCRouter({
  routes: createTRPCRouter({
    getRoutes: publicProcedure.query(() => {
      return store.getRoutes();
    }),
    
    addRoute: publicProcedure
      .input(routeTemplateSchema)
      .mutation(({ input }) => {
        return store.addRoute(input);
      }),
    
    deleteRoute: publicProcedure
      .input(z.object({ routeId: z.string() }))
      .mutation(({ input }) => {
        return store.deleteRoute(input.routeId);
      }),
  }),

  records: createTRPCRouter({
    getRecords: publicProcedure.query(() => {
      return store.getRecords();
    }),
    
    addRecord: publicProcedure
      .input(routeRecordSchema)
      .mutation(({ input }) => {
        return store.addRecord(input);
      }),
    
    updateRecord: publicProcedure
      .input(routeRecordSchema)
      .mutation(({ input }) => {
        return store.updateRecord(input);
      }),
    
    deleteRecord: publicProcedure
      .input(z.object({ recordId: z.string() }))
      .mutation(({ input }) => {
        return store.deleteRecord(input.recordId);
      }),
  }),

  vehicles: createTRPCRouter({
    getDrivers: publicProcedure.query(() => {
      return store.getDrivers();
    }),
    
    saveDriver: publicProcedure
      .input(savedDriverSchema)
      .mutation(({ input }) => {
        return store.saveDriver(input);
      }),
    
    getTractors: publicProcedure.query(() => {
      return store.getTractors();
    }),
    
    saveTractor: publicProcedure
      .input(savedVehicleSchema)
      .mutation(({ input }) => {
        return store.saveTractor(input);
      }),
    
    getTrailers: publicProcedure.query(() => {
      return store.getTrailers();
    }),
    
    saveTrailer: publicProcedure
      .input(savedVehicleSchema)
      .mutation(({ input }) => {
        return store.saveTrailer(input);
      }),
    
    getVans: publicProcedure.query(() => {
      return store.getVans();
    }),
    
    saveVan: publicProcedure
      .input(savedVehicleSchema)
      .mutation(({ input }) => {
        return store.saveVan(input);
      }),
  }),
});

export type AppRouter = typeof appRouter;
