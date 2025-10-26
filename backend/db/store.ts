import { RouteTemplate, RouteRecord, SavedDriver, SavedTractor, SavedTrailer, SavedVan } from '@/types/routes';
import { DEFAULT_ROUTES } from '@/constants/defaultRoutes';

class InMemoryStore {
  private routes: RouteTemplate[] = [...DEFAULT_ROUTES];
  private records: RouteRecord[] = [];
  private drivers: SavedDriver[] = [];
  private tractors: SavedTractor[] = [];
  private trailers: SavedTrailer[] = [];
  private vans: SavedVan[] = [];

  getRoutes() {
    return [...this.routes];
  }

  addRoute(route: RouteTemplate) {
    this.routes.push(route);
    return route;
  }

  deleteRoute(routeId: string) {
    this.routes = this.routes.filter(r => r.id !== routeId);
    return true;
  }

  getRecords() {
    return [...this.records];
  }

  addRecord(record: RouteRecord) {
    this.records.push(record);
    return record;
  }

  updateRecord(record: RouteRecord) {
    const index = this.records.findIndex(r => r.id === record.id);
    if (index !== -1) {
      this.records[index] = record;
      return record;
    }
    return null;
  }

  deleteRecord(recordId: string) {
    this.records = this.records.filter(r => r.id !== recordId);
    return true;
  }

  getDrivers() {
    return [...this.drivers];
  }

  saveDriver(driver: SavedDriver) {
    const existing = this.drivers.find(d => d.dni === driver.dni && d.routeId === driver.routeId);
    if (existing) {
      existing.name = driver.name;
      existing.phone = driver.phone;
      existing.usageCount = driver.usageCount;
      existing.lastUsed = driver.lastUsed;
      return existing;
    }
    this.drivers.push(driver);
    return driver;
  }

  getTractors() {
    return [...this.tractors];
  }

  saveTractor(tractor: SavedTractor) {
    const existing = this.tractors.find(t => t.plate === tractor.plate && t.routeId === tractor.routeId);
    if (existing) {
      existing.usageCount = tractor.usageCount;
      existing.lastUsed = tractor.lastUsed;
      return existing;
    }
    this.tractors.push(tractor);
    return tractor;
  }

  getTrailers() {
    return [...this.trailers];
  }

  saveTrailer(trailer: SavedTrailer) {
    const existing = this.trailers.find(t => t.plate === trailer.plate && t.routeId === trailer.routeId);
    if (existing) {
      existing.usageCount = trailer.usageCount;
      existing.lastUsed = trailer.lastUsed;
      return existing;
    }
    this.trailers.push(trailer);
    return trailer;
  }

  getVans() {
    return [...this.vans];
  }

  saveVan(van: SavedVan) {
    const existing = this.vans.find(v => v.plate === van.plate && v.routeId === van.routeId);
    if (existing) {
      existing.usageCount = van.usageCount;
      existing.lastUsed = van.lastUsed;
      return existing;
    }
    this.vans.push(van);
    return van;
  }
}

export const store = new InMemoryStore();
