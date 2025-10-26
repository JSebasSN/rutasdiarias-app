import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import getRoutes from "./routes/routes/get-routes";
import addRoute from "./routes/routes/add-route";
import deleteRoute from "./routes/routes/delete-route";
import getRecords from "./routes/records/get-records";
import addRecord from "./routes/records/add-record";
import updateRecord from "./routes/records/update-record";
import deleteRecord from "./routes/records/delete-record";
import getDrivers from "./routes/vehicles/get-drivers";
import saveDriver from "./routes/vehicles/save-driver";
import getTractors from "./routes/vehicles/get-tractors";
import saveTractor from "./routes/vehicles/save-tractor";
import getTrailers from "./routes/vehicles/get-trailers";
import saveTrailer from "./routes/vehicles/save-trailer";
import getVans from "./routes/vehicles/get-vans";
import saveVan from "./routes/vehicles/save-van";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  routes: createTRPCRouter({
    getRoutes,
    addRoute,
    deleteRoute,
  }),
  records: createTRPCRouter({
    getRecords,
    addRecord,
    updateRecord,
    deleteRecord,
  }),
  vehicles: createTRPCRouter({
    getDrivers,
    saveDriver,
    getTractors,
    saveTractor,
    getTrailers,
    saveTrailer,
    getVans,
    saveVan,
  }),
});

export type AppRouter = typeof appRouter;
