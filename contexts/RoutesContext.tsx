import { createContext, useContext, ReactNode, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RouteTemplate, RouteRecord, SavedDriver, SavedTractor, SavedTrailer, SavedVan } from '@/types/routes';
import { DEFAULT_ROUTES } from '@/constants/defaultRoutes';

const ROUTES_KEY = 'route_templates';
const RECORDS_KEY = 'route_records';
const DRIVERS_KEY = 'saved_drivers';
const TRACTORS_KEY = 'saved_tractors';
const TRAILERS_KEY = 'saved_trailers';
const VANS_KEY = 'saved_vans';

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
  saveTractor: (params: { plate: string; routeId: string }) => Promise<SavedTractor[]>;
  saveTrailer: (params: { plate: string; routeId: string }) => Promise<SavedTrailer[]>;
  saveVan: (params: { plate: string; routeId: string }) => Promise<SavedVan[]>;
  isAddingRoute: boolean;
  isAddingRecord: boolean;
};

const RoutesContext = createContext<RoutesContextType | undefined>(undefined);

export function RoutesProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const routesQuery = useQuery({
    queryKey: ['routes'],
    queryFn: async (): Promise<RouteTemplate[]> => {
      const stored = await AsyncStorage.getItem(ROUTES_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      await AsyncStorage.setItem(ROUTES_KEY, JSON.stringify(DEFAULT_ROUTES));
      return DEFAULT_ROUTES;
    },
  });

  const recordsQuery = useQuery({
    queryKey: ['records'],
    queryFn: async (): Promise<RouteRecord[]> => {
      const stored = await AsyncStorage.getItem(RECORDS_KEY);
      return stored ? JSON.parse(stored) : [];
    },
  });

  const driversQuery = useQuery({
    queryKey: ['drivers'],
    queryFn: async (): Promise<SavedDriver[]> => {
      const stored = await AsyncStorage.getItem(DRIVERS_KEY);
      return stored ? JSON.parse(stored) : [];
    },
  });

  const tractorsQuery = useQuery({
    queryKey: ['tractors'],
    queryFn: async (): Promise<SavedTractor[]> => {
      const stored = await AsyncStorage.getItem(TRACTORS_KEY);
      return stored ? JSON.parse(stored) : [];
    },
  });

  const trailersQuery = useQuery({
    queryKey: ['trailers'],
    queryFn: async (): Promise<SavedTrailer[]> => {
      const stored = await AsyncStorage.getItem(TRAILERS_KEY);
      return stored ? JSON.parse(stored) : [];
    },
  });

  const vansQuery = useQuery({
    queryKey: ['vans'],
    queryFn: async (): Promise<SavedVan[]> => {
      const stored = await AsyncStorage.getItem(VANS_KEY);
      return stored ? JSON.parse(stored) : [];
    },
  });

  const addRouteMutation = useMutation({
    mutationFn: async (route: RouteTemplate) => {
      const routes = routesQuery.data || [];
      const updated = [...routes, route];
      await AsyncStorage.setItem(ROUTES_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['routes'], data);
    },
  });

  const deleteRouteMutation = useMutation({
    mutationFn: async (routeId: string) => {
      console.log('Deleting route:', routeId);
      const routes = routesQuery.data || [];
      const updated = routes.filter((r) => r.id !== routeId);
      console.log('Routes before delete:', routes.length, 'Routes after delete:', updated.length);
      await AsyncStorage.setItem(ROUTES_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (data) => {
      console.log('Delete route success, updating cache with:', data.length, 'routes');
      queryClient.setQueryData(['routes'], data);
    },
    onError: (error) => {
      console.error('Error deleting route:', error);
    },
  });

  const addRecordMutation = useMutation({
    mutationFn: async (record: RouteRecord) => {
      const records = recordsQuery.data || [];
      const updated = [...records, record];
      await AsyncStorage.setItem(RECORDS_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['records'], data);
    },
  });

  const updateRecordMutation = useMutation({
    mutationFn: async (record: RouteRecord) => {
      console.log('Updating record:', record.id);
      const records = recordsQuery.data || [];
      const updated = records.map((r) => r.id === record.id ? record : r);
      console.log('Records before update:', records.length);
      await AsyncStorage.setItem(RECORDS_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (data) => {
      console.log('Update record success');
      queryClient.setQueryData(['records'], data);
    },
    onError: (error) => {
      console.error('Error updating record:', error);
    },
  });

  const deleteRecordMutation = useMutation({
    mutationFn: async (recordId: string) => {
      console.log('Deleting record:', recordId);
      const records = recordsQuery.data || [];
      const updated = records.filter((r) => r.id !== recordId);
      console.log('Records before delete:', records.length, 'Records after delete:', updated.length);
      await AsyncStorage.setItem(RECORDS_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (data) => {
      console.log('Delete record success, updating cache with:', data.length, 'records');
      queryClient.setQueryData(['records'], data);
    },
    onError: (error) => {
      console.error('Error deleting record:', error);
    },
  });

  const saveDriverMutation = useMutation({
    mutationFn: async (driver: { name: string; dni: string; phone: string; routeId: string }) => {
      const drivers = driversQuery.data || [];
      const existing = drivers.find((d) => d.dni === driver.dni && d.routeId === driver.routeId);
      
      if (existing) {
        const updated = drivers.map((d) =>
          d.dni === driver.dni && d.routeId === driver.routeId
            ? { ...d, name: driver.name, phone: driver.phone, usageCount: d.usageCount + 1, lastUsed: new Date().toISOString() }
            : d
        );
        await AsyncStorage.setItem(DRIVERS_KEY, JSON.stringify(updated));
        return updated;
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
        const updated = [...drivers, newDriver];
        await AsyncStorage.setItem(DRIVERS_KEY, JSON.stringify(updated));
        return updated;
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['drivers'], data);
    },
  });

  const saveTractorMutation = useMutation({
    mutationFn: async (params: { plate: string; routeId: string }) => {
      console.log('saveTractorMutation called with:', params);
      const tractors = tractorsQuery.data || [];
      const existing = tractors.find((t) => t.plate === params.plate && t.routeId === params.routeId);
      
      if (existing) {
        console.log('Updating existing tractor');
        const updated = tractors.map((t) =>
          t.plate === params.plate && t.routeId === params.routeId
            ? { ...t, usageCount: t.usageCount + 1, lastUsed: new Date().toISOString() }
            : t
        );
        await AsyncStorage.setItem(TRACTORS_KEY, JSON.stringify(updated));
        return updated;
      } else {
        console.log('Creating new tractor');
        const newTractor: SavedTractor = {
          id: Date.now().toString(),
          plate: params.plate,
          routeId: params.routeId,
          usageCount: 1,
          lastUsed: new Date().toISOString(),
        };
        const updated = [...tractors, newTractor];
        await AsyncStorage.setItem(TRACTORS_KEY, JSON.stringify(updated));
        console.log('Tractor saved to AsyncStorage:', updated);
        return updated;
      }
    },
    onSuccess: (data) => {
      console.log('saveTractorMutation success, data:', data);
      queryClient.setQueryData(['tractors'], data);
      queryClient.invalidateQueries({ queryKey: ['tractors'] });
    },
  });

  const saveTrailerMutation = useMutation({
    mutationFn: async (params: { plate: string; routeId: string }) => {
      console.log('saveTrailerMutation called with:', params);
      const trailers = trailersQuery.data || [];
      const existing = trailers.find((t) => t.plate === params.plate && t.routeId === params.routeId);
      
      if (existing) {
        console.log('Updating existing trailer');
        const updated = trailers.map((t) =>
          t.plate === params.plate && t.routeId === params.routeId
            ? { ...t, usageCount: t.usageCount + 1, lastUsed: new Date().toISOString() }
            : t
        );
        await AsyncStorage.setItem(TRAILERS_KEY, JSON.stringify(updated));
        return updated;
      } else {
        console.log('Creating new trailer');
        const newTrailer: SavedTrailer = {
          id: Date.now().toString(),
          plate: params.plate,
          routeId: params.routeId,
          usageCount: 1,
          lastUsed: new Date().toISOString(),
        };
        const updated = [...trailers, newTrailer];
        await AsyncStorage.setItem(TRAILERS_KEY, JSON.stringify(updated));
        console.log('Trailer saved to AsyncStorage:', updated);
        return updated;
      }
    },
    onSuccess: (data) => {
      console.log('saveTrailerMutation success, data:', data);
      queryClient.setQueryData(['trailers'], data);
      queryClient.invalidateQueries({ queryKey: ['trailers'] });
    },
  });

  const saveVanMutation = useMutation({
    mutationFn: async (params: { plate: string; routeId: string }) => {
      console.log('saveVanMutation called with:', params);
      const vans = vansQuery.data || [];
      const existing = vans.find((v) => v.plate === params.plate && v.routeId === params.routeId);
      
      if (existing) {
        console.log('Updating existing van');
        const updated = vans.map((v) =>
          v.plate === params.plate && v.routeId === params.routeId
            ? { ...v, usageCount: v.usageCount + 1, lastUsed: new Date().toISOString() }
            : v
        );
        await AsyncStorage.setItem(VANS_KEY, JSON.stringify(updated));
        return updated;
      } else {
        console.log('Creating new van');
        const newVan: SavedVan = {
          id: Date.now().toString(),
          plate: params.plate,
          routeId: params.routeId,
          usageCount: 1,
          lastUsed: new Date().toISOString(),
        };
        const updated = [...vans, newVan];
        await AsyncStorage.setItem(VANS_KEY, JSON.stringify(updated));
        console.log('Van saved to AsyncStorage:', updated);
        return updated;
      }
    },
    onSuccess: (data) => {
      console.log('saveVanMutation success, data:', data);
      queryClient.setQueryData(['vans'], data);
      queryClient.invalidateQueries({ queryKey: ['vans'] });
    },
  });

  const value = useMemo(() => ({
    routes: routesQuery.data || [],
    records: recordsQuery.data || [],
    savedDrivers: driversQuery.data || [],
    savedTractors: tractorsQuery.data || [],
    savedTrailers: trailersQuery.data || [],
    savedVans: vansQuery.data || [],
    isLoading: routesQuery.isLoading || recordsQuery.isLoading,
    addRoute: addRouteMutation.mutate,
    deleteRoute: deleteRouteMutation.mutate,
    addRecord: addRecordMutation.mutate,
    updateRecord: updateRecordMutation.mutate,
    deleteRecord: deleteRecordMutation.mutate,
    saveDriver: saveDriverMutation.mutate,
    saveTractor: saveTractorMutation.mutateAsync,
    saveTrailer: saveTrailerMutation.mutateAsync,
    saveVan: saveVanMutation.mutateAsync,
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
    addRouteMutation.mutate,
    addRouteMutation.isPending,
    deleteRouteMutation.mutate,
    addRecordMutation.mutate,
    addRecordMutation.isPending,
    updateRecordMutation.mutate,
    deleteRecordMutation.mutate,
    saveDriverMutation.mutate,
    saveTractorMutation.mutateAsync,
    saveTrailerMutation.mutateAsync,
    saveVanMutation.mutateAsync,
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
