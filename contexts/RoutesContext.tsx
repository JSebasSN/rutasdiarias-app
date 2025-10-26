import { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RouteTemplate, RouteRecord, SavedDriver, SavedTractor, SavedTrailer, SavedVan } from '@/types/routes';
import { trpc } from '@/lib/trpc';

type RoutesContextType = {
  routes: RouteTemplate[];
  records: RouteRecord[];
  savedDrivers: SavedDriver[];
  savedTractors: SavedTractor[];
  savedTrailers: SavedTrailer[];
  savedVans: SavedVan[];
  isLoading: boolean;
  addRoute: (route: RouteTemplate) => void;
  deleteRoute: (routeId: string) => void;
  addRecord: (record: RouteRecord) => void;
  updateRecord: (record: RouteRecord) => void;
  deleteRecord: (recordId: string) => void;
  saveDriver: (driver: { name: string; dni: string; phone: string; routeId: string }) => void;
  saveTractor: (params: { plate: string; routeId: string }) => Promise<SavedTractor>;
  saveTrailer: (params: { plate: string; routeId: string }) => Promise<SavedTrailer>;
  saveVan: (params: { plate: string; routeId: string }) => Promise<SavedVan>;
  isAddingRoute: boolean;
  isAddingRecord: boolean;
};

const RoutesContext = createContext<RoutesContextType | undefined>(undefined);

export function RoutesProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const routesQuery = trpc.routes.getRoutes.useQuery();
  const recordsQuery = trpc.records.getRecords.useQuery();
  const driversQuery = trpc.vehicles.getDrivers.useQuery();
  const tractorsQuery = trpc.vehicles.getTractors.useQuery();
  const trailersQuery = trpc.vehicles.getTrailers.useQuery();
  const vansQuery = trpc.vehicles.getVans.useQuery();

  const addRouteMutation = trpc.routes.addRoute.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['routes', 'getRoutes']] });
    },
  });

  const deleteRouteMutation = trpc.routes.deleteRoute.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['routes', 'getRoutes']] });
    },
  });

  const addRecordMutation = trpc.records.addRecord.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['records', 'getRecords']] });
    },
  });

  const updateRecordMutation = trpc.records.updateRecord.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['records', 'getRecords']] });
    },
  });

  const deleteRecordMutation = trpc.records.deleteRecord.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['records', 'getRecords']] });
    },
  });

  const saveDriverMutation = trpc.vehicles.saveDriver.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['vehicles', 'getDrivers']] });
    },
  });

  const saveTractorMutation = trpc.vehicles.saveTractor.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['vehicles', 'getTractors']] });
    },
  });

  const saveTrailerMutation = trpc.vehicles.saveTrailer.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['vehicles', 'getTrailers']] });
    },
  });

  const saveVanMutation = trpc.vehicles.saveVan.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['vehicles', 'getVans']] });
    },
  });

  const handleAddRoute = useCallback((route: RouteTemplate) => {
    addRouteMutation.mutate(route);
  }, [addRouteMutation]);

  const handleDeleteRoute = useCallback((routeId: string) => {
    deleteRouteMutation.mutate({ routeId });
  }, [deleteRouteMutation]);

  const handleAddRecord = useCallback((record: RouteRecord) => {
    addRecordMutation.mutate(record);
  }, [addRecordMutation]);

  const handleUpdateRecord = useCallback((record: RouteRecord) => {
    updateRecordMutation.mutate(record);
  }, [updateRecordMutation]);

  const handleDeleteRecord = useCallback((recordId: string) => {
    deleteRecordMutation.mutate({ recordId });
  }, [deleteRecordMutation]);

  const handleSaveDriver = useCallback((driver: { name: string; dni: string; phone: string; routeId: string }) => {
    const drivers = driversQuery.data || [];
    const existing = drivers.find((d) => d.dni === driver.dni && d.routeId === driver.routeId);
    
    if (existing) {
      saveDriverMutation.mutate({
        ...existing,
        name: driver.name,
        phone: driver.phone,
        usageCount: existing.usageCount + 1,
        lastUsed: new Date().toISOString(),
      });
    } else {
      const newDriver: SavedDriver = {
        id: Date.now().toString(),
        name: driver.name,
        dni: driver.dni,
        phone: driver.phone,
        routeId: driver.routeId,
        usageCount: 1,
        lastUsed: new Date().toISOString(),
      };
      saveDriverMutation.mutate(newDriver);
    }
  }, [driversQuery.data, saveDriverMutation]);

  const handleSaveTractor = useCallback(async (params: { plate: string; routeId: string }): Promise<SavedTractor> => {
    const tractors = tractorsQuery.data || [];
    const existing = tractors.find((t) => t.plate === params.plate && t.routeId === params.routeId);
    
    if (existing) {
      return saveTractorMutation.mutateAsync({
        ...existing,
        usageCount: existing.usageCount + 1,
        lastUsed: new Date().toISOString(),
      });
    } else {
      const newTractor: SavedTractor = {
        id: Date.now().toString(),
        plate: params.plate,
        routeId: params.routeId,
        usageCount: 1,
        lastUsed: new Date().toISOString(),
      };
      return saveTractorMutation.mutateAsync(newTractor);
    }
  }, [tractorsQuery.data, saveTractorMutation]);

  const handleSaveTrailer = useCallback(async (params: { plate: string; routeId: string }): Promise<SavedTrailer> => {
    const trailers = trailersQuery.data || [];
    const existing = trailers.find((t) => t.plate === params.plate && t.routeId === params.routeId);
    
    if (existing) {
      return saveTrailerMutation.mutateAsync({
        ...existing,
        usageCount: existing.usageCount + 1,
        lastUsed: new Date().toISOString(),
      });
    } else {
      const newTrailer: SavedTrailer = {
        id: Date.now().toString(),
        plate: params.plate,
        routeId: params.routeId,
        usageCount: 1,
        lastUsed: new Date().toISOString(),
      };
      return saveTrailerMutation.mutateAsync(newTrailer);
    }
  }, [trailersQuery.data, saveTrailerMutation]);

  const handleSaveVan = useCallback(async (params: { plate: string; routeId: string }): Promise<SavedVan> => {
    const vans = vansQuery.data || [];
    const existing = vans.find((v) => v.plate === params.plate && v.routeId === params.routeId);
    
    if (existing) {
      return saveVanMutation.mutateAsync({
        ...existing,
        usageCount: existing.usageCount + 1,
        lastUsed: new Date().toISOString(),
      });
    } else {
      const newVan: SavedVan = {
        id: Date.now().toString(),
        plate: params.plate,
        routeId: params.routeId,
        usageCount: 1,
        lastUsed: new Date().toISOString(),
      };
      return saveVanMutation.mutateAsync(newVan);
    }
  }, [vansQuery.data, saveVanMutation]);

  const value = useMemo(() => ({
    routes: routesQuery.data || [],
    records: recordsQuery.data || [],
    savedDrivers: driversQuery.data || [],
    savedTractors: tractorsQuery.data || [],
    savedTrailers: trailersQuery.data || [],
    savedVans: vansQuery.data || [],
    isLoading: routesQuery.isLoading || recordsQuery.isLoading,
    addRoute: handleAddRoute,
    deleteRoute: handleDeleteRoute,
    addRecord: handleAddRecord,
    updateRecord: handleUpdateRecord,
    deleteRecord: handleDeleteRecord,
    saveDriver: handleSaveDriver,
    saveTractor: handleSaveTractor,
    saveTrailer: handleSaveTrailer,
    saveVan: handleSaveVan,
    isAddingRoute: addRouteMutation.isPending,
    isAddingRecord: addRecordMutation.isPending,
  }), [
    routesQuery.data,
    recordsQuery.data,
    driversQuery.data,
    tractorsQuery.data,
    trailersQuery.data,
    vansQuery.data,
    routesQuery.isLoading,
    recordsQuery.isLoading,
    addRouteMutation.isPending,
    addRecordMutation.isPending,
    handleAddRoute,
    handleDeleteRoute,
    handleAddRecord,
    handleUpdateRecord,
    handleDeleteRecord,
    handleSaveDriver,
    handleSaveTractor,
    handleSaveTrailer,
    handleSaveVan,
  ]);

  return (
    <RoutesContext.Provider value={value}>
      {children}
    </RoutesContext.Provider>
  );
}

export function useRoutes() {
  const context = useContext(RoutesContext);
  if (context === undefined) {
    throw new Error('useRoutes must be used within a RoutesProvider');
  }
  return context;
}
