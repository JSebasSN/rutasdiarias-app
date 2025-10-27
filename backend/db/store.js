const { sql } = require('./neon-client');

const DEFAULT_ROUTES = [
  { id: '1', name: 'ZARAGOZA', type: 'TRAILER' },
  { id: '2', name: 'ALMERIA', type: 'TRAILER' },
  { id: '3', name: 'MADRID', type: 'TRAILER' },
  { id: '4', name: 'VALENCIA', type: 'TRAILER' },
  { id: '5', name: 'MALAGA', type: 'TRAILER' },
  { id: '6', name: 'CORDOBA', type: 'TRAILER' },
  { id: '7', name: 'ALICANTE', type: 'TRAILER' },
  { id: '8', name: 'CASTELLON', type: 'TRAILER' },
  { id: '9', name: 'PALMA', type: 'TRAILER' },
  { id: '10', name: 'PALMA', type: 'FURGO' },
  { id: '11', name: 'MENORCA', type: 'FURGO' },
  { id: '12', name: 'IBIZA', type: 'FURGO' },
];

class NeonStore {
  async getRoutes() {
    try {
      console.log('[Store] Getting routes...');
      const rows = await sql`SELECT * FROM route_templates ORDER BY created_at DESC`;
      console.log('[Store] Retrieved', rows.length, 'routes');
      
      if (rows.length === 0) {
        console.log('[Store] No routes found, inserting defaults');
        for (const route of DEFAULT_ROUTES) {
          await sql`
            INSERT INTO route_templates (id, name, type)
            VALUES (${route.id}, ${route.name}, ${route.type})
            ON CONFLICT (id) DO NOTHING
          `;
        }
        return DEFAULT_ROUTES;
      }
      
      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        type: row.type,
      }));
    } catch (error) {
      console.error('[Store] Error getting routes:', error);
      console.error('[Store] Error stack:', error instanceof Error ? error.stack : 'No stack');
      throw error;
    }
  }

  async addRoute(route) {
    try {
      await sql`
        INSERT INTO route_templates (id, name, type)
        VALUES (${route.id}, ${route.name}, ${route.type})
      `;
      return route;
    } catch (error) {
      console.error('Error adding route:', error);
      throw error;
    }
  }

  async deleteRoute(routeId) {
    try {
      await sql`DELETE FROM route_templates WHERE id = ${routeId}`;
      return true;
    } catch (error) {
      console.error('Error deleting route:', error);
      throw error;
    }
  }

  async getRecords() {
    try {
      console.log('[Store] Getting records...');
      const rows = await sql`
        SELECT * FROM route_records 
        ORDER BY created_at DESC
      `;
      console.log('[Store] Retrieved', rows.length, 'records');
      
      return rows.map((row) => ({
        id: row.id,
        date: row.date,
        routeTemplateId: row.route_template_id,
        routeName: row.route_name,
        routeType: row.route_type,
        drivers: row.drivers,
        tractorPlate: row.tractor_plate,
        trailerPlate: row.trailer_plate,
        vehiclePlate: row.vehicle_plate,
        seal: row.seal,
        createdAt: row.created_at,
        departureTime: row.departure_time,
      }));
    } catch (error) {
      console.error('[Store] Error getting records:', error);
      console.error('[Store] Error stack:', error instanceof Error ? error.stack : 'No stack');
      throw error;
    }
  }

  async addRecord(record) {
    try {
      await sql`
        INSERT INTO route_records (
          id, date, route_template_id, route_name, route_type, 
          drivers, tractor_plate, trailer_plate, vehicle_plate, 
          seal, departure_time
        )
        VALUES (
          ${record.id}, ${record.date}, ${record.routeTemplateId}, 
          ${record.routeName}, ${record.routeType}, ${JSON.stringify(record.drivers)}, 
          ${record.tractorPlate || null}, ${record.trailerPlate || null}, 
          ${record.vehiclePlate || null}, ${record.seal}, 
          ${record.departureTime || null}
        )
      `;
      return record;
    } catch (error) {
      console.error('Error adding record:', error);
      throw error;
    }
  }

  async updateRecord(record) {
    try {
      await sql`
        UPDATE route_records SET
          date = ${record.date},
          route_template_id = ${record.routeTemplateId},
          route_name = ${record.routeName},
          route_type = ${record.routeType},
          drivers = ${JSON.stringify(record.drivers)},
          tractor_plate = ${record.tractorPlate || null},
          trailer_plate = ${record.trailerPlate || null},
          vehicle_plate = ${record.vehiclePlate || null},
          seal = ${record.seal},
          departure_time = ${record.departureTime || null}
        WHERE id = ${record.id}
      `;
      return record;
    } catch (error) {
      console.error('Error updating record:', error);
      throw error;
    }
  }

  async deleteRecord(recordId) {
    try {
      await sql`DELETE FROM route_records WHERE id = ${recordId}`;
      return true;
    } catch (error) {
      console.error('Error deleting record:', error);
      throw error;
    }
  }

  async getDrivers() {
    try {
      console.log('[Store] Getting drivers...');
      const rows = await sql`
        SELECT * FROM saved_drivers 
        ORDER BY last_used DESC
      `;
      console.log('[Store] Retrieved', rows.length, 'drivers');
      
      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        dni: row.dni,
        phone: row.phone,
        routeId: row.route_id,
        usageCount: row.usage_count,
        lastUsed: row.last_used,
      }));
    } catch (error) {
      console.error('[Store] Error getting drivers:', error);
      console.error('[Store] Error stack:', error instanceof Error ? error.stack : 'No stack');
      throw error;
    }
  }

  async saveDriver(driver) {
    try {
      await sql`
        INSERT INTO saved_drivers (id, name, dni, phone, route_id, usage_count, last_used)
        VALUES (
          ${driver.id}, ${driver.name}, ${driver.dni}, ${driver.phone}, 
          ${driver.routeId}, ${driver.usageCount}, ${driver.lastUsed}
        )
        ON CONFLICT (dni, route_id) DO UPDATE SET
          name = ${driver.name},
          phone = ${driver.phone},
          usage_count = ${driver.usageCount},
          last_used = ${driver.lastUsed}
      `;
      return driver;
    } catch (error) {
      console.error('Error saving driver:', error);
      throw error;
    }
  }

  async getTractors() {
    try {
      console.log('[Store] Getting tractors...');
      const rows = await sql`
        SELECT * FROM saved_tractors 
        ORDER BY last_used DESC
      `;
      console.log('[Store] Retrieved', rows.length, 'tractors');
      
      return rows.map((row) => ({
        id: row.id,
        plate: row.plate,
        routeId: row.route_id,
        usageCount: row.usage_count,
        lastUsed: row.last_used,
      }));
    } catch (error) {
      console.error('[Store] Error getting tractors:', error);
      console.error('[Store] Error stack:', error instanceof Error ? error.stack : 'No stack');
      throw error;
    }
  }

  async saveTractor(tractor) {
    try {
      await sql`
        INSERT INTO saved_tractors (id, plate, route_id, usage_count, last_used)
        VALUES (
          ${tractor.id}, ${tractor.plate}, ${tractor.routeId}, 
          ${tractor.usageCount}, ${tractor.lastUsed}
        )
        ON CONFLICT (plate, route_id) DO UPDATE SET
          usage_count = ${tractor.usageCount},
          last_used = ${tractor.lastUsed}
      `;
      return tractor;
    } catch (error) {
      console.error('Error saving tractor:', error);
      throw error;
    }
  }

  async getTrailers() {
    try {
      console.log('[Store] Getting trailers...');
      const rows = await sql`
        SELECT * FROM saved_trailers 
        ORDER BY last_used DESC
      `;
      console.log('[Store] Retrieved', rows.length, 'trailers');
      
      return rows.map((row) => ({
        id: row.id,
        plate: row.plate,
        routeId: row.route_id,
        usageCount: row.usage_count,
        lastUsed: row.last_used,
      }));
    } catch (error) {
      console.error('[Store] Error getting trailers:', error);
      console.error('[Store] Error stack:', error instanceof Error ? error.stack : 'No stack');
      throw error;
    }
  }

  async saveTrailer(trailer) {
    try {
      await sql`
        INSERT INTO saved_trailers (id, plate, route_id, usage_count, last_used)
        VALUES (
          ${trailer.id}, ${trailer.plate}, ${trailer.routeId}, 
          ${trailer.usageCount}, ${trailer.lastUsed}
        )
        ON CONFLICT (plate, route_id) DO UPDATE SET
          usage_count = ${trailer.usageCount},
          last_used = ${trailer.lastUsed}
      `;
      return trailer;
    } catch (error) {
      console.error('Error saving trailer:', error);
      throw error;
    }
  }

  async getVans() {
    try {
      console.log('[Store] Getting vans...');
      const rows = await sql`
        SELECT * FROM saved_vans 
        ORDER BY last_used DESC
      `;
      console.log('[Store] Retrieved', rows.length, 'vans');
      
      return rows.map((row) => ({
        id: row.id,
        plate: row.plate,
        routeId: row.route_id,
        usageCount: row.usage_count,
        lastUsed: row.last_used,
      }));
    } catch (error) {
      console.error('[Store] Error getting vans:', error);
      console.error('[Store] Error stack:', error instanceof Error ? error.stack : 'No stack');
      throw error;
    }
  }

  async saveVan(van) {
    try {
      await sql`
        INSERT INTO saved_vans (id, plate, route_id, usage_count, last_used)
        VALUES (
          ${van.id}, ${van.plate}, ${van.routeId}, 
          ${van.usageCount}, ${van.lastUsed}
        )
        ON CONFLICT (plate, route_id) DO UPDATE SET
          usage_count = ${van.usageCount},
          last_used = ${van.lastUsed}
      `;
      return van;
    } catch (error) {
      console.error('Error saving van:', error);
      throw error;
    }
  }
}

const store = new NeonStore();

module.exports = {
  store,
};
