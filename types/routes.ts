export type RouteType = 'TRAILER' | 'FURGO';

export interface Driver {
  id: string;
  name: string;
  dni: string;
  phone: string;
}

export interface SavedDriver {
  id: string;
  name: string;
  dni: string;
  phone: string;
  routeId: string;
  usageCount: number;
  lastUsed: string;
}

export interface SavedTractor {
  id: string;
  plate: string;
  routeId: string;
  usageCount: number;
  lastUsed: string;
}

export interface SavedTrailer {
  id: string;
  plate: string;
  routeId: string;
  usageCount: number;
  lastUsed: string;
}

export interface SavedVan {
  id: string;
  plate: string;
  routeId: string;
  usageCount: number;
  lastUsed: string;
}

export interface RouteTemplate {
  id: string;
  name: string;
  type: RouteType;
}

export interface RouteRecord {
  id: string;
  date: string;
  routeTemplateId: string;
  routeName: string;
  routeType: RouteType;
  drivers: Driver[];
  tractorPlate?: string;
  trailerPlate?: string;
  vehiclePlate?: string;
  seal: string;
  createdAt: string;
  departureTime?: string;
}
