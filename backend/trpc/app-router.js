const { z } = require("zod");
const { createTRPCRouter, publicProcedure } = require("./create-context");
const { store } = require("../db/store");

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

const appRouter = createTRPCRouter({
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
    
    checkDuplicateRecord: publicProcedure
      .input(z.object({ 
        routeTemplateId: z.string(),
        routeType: z.enum(['TRAILER', 'FURGO']),
        date: z.string(),
      }))
      .query(({ input }) => {
        return store.checkDuplicateRecord(input.routeTemplateId, input.routeType, input.date);
      }),
    
    addRecord: publicProcedure
      .input(routeRecordSchema)
      .mutation(async ({ input }) => {
        const isDuplicate = await store.checkDuplicateRecord(input.routeTemplateId, input.routeType, input.date);
        if (isDuplicate) {
          throw new Error('Ya existe un registro para esta ruta en la fecha seleccionada');
        }
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

module.exports = {
  appRouter,
};
