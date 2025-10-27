const { sql } = require('./neon-client');



let migrationDone = false;
let migrationInProgress = false;

async function ensureTables() {
  if (migrationDone) {
    return;
  }

  if (migrationInProgress) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return ensureTables();
  }

  migrationInProgress = true;

  try {
    console.log('[Store] Creating tables...');
    
    await sql`
      CREATE TABLE IF NOT EXISTS route_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('TRAILER', 'FURGO')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS route_records (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        route_template_id TEXT NOT NULL,
        route_name TEXT NOT NULL,
        route_type TEXT NOT NULL CHECK (route_type IN ('TRAILER', 'FURGO')),
        drivers JSONB NOT NULL,
        tractor_plate TEXT,
        trailer_plate TEXT,
        vehicle_plate TEXT,
        seal TEXT NOT NULL,
        departure_time TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS saved_drivers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        dni TEXT NOT NULL,
        phone TEXT NOT NULL,
        route_id TEXT NOT NULL,
        usage_count INTEGER DEFAULT 1,
        last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(dni, route_id)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS saved_tractors (
        id TEXT PRIMARY KEY,
        plate TEXT NOT NULL,
        route_id TEXT NOT NULL,
        usage_count INTEGER DEFAULT 1,
        last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(plate, route_id)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS saved_trailers (
        id TEXT PRIMARY KEY,
        plate TEXT NOT NULL,
        route_id TEXT NOT NULL,
        usage_count INTEGER DEFAULT 1,
        last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(plate, route_id)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS saved_vans (
        id TEXT PRIMARY KEY,
        plate TEXT NOT NULL,
        route_id TEXT NOT NULL,
        usage_count INTEGER DEFAULT 1,
        last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(plate, route_id)
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_route_records_date ON route_records(date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_route_records_template_id ON route_records(route_template_id)`;
    
    migrationDone = true;
    console.log('[Store] Tables created successfully');
  } catch (error) {
    console.error('[Store] Error creating tables:', error?.message);
    throw error;
  } finally {
    migrationInProgress = false;
  }
}

class NeonStore {
  async getRoutes() {
    try {
      await ensureTables();
      
      console.log('[Store] Getting routes...');
      const rows = await sql`SELECT * FROM route_templates ORDER BY created_at DESC`;
      console.log('[Store] Retrieved', rows.length, 'routes');
      
      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        type: row.type,
      }));
    } catch (error) {
      console.error('[Store] Error getting routes:', error?.message);
      throw error;
    }
  }

  async addRoute(route) {
    try {
      await ensureTables();
      
      await sql`
        INSERT INTO route_templates (id, name, type)
        VALUES (${route.id}, ${route.name}, ${route.type})
      `;
      return route;
    } catch (error) {
      console.error('[Store] Error adding route:', error?.message);
      throw error;
    }
  }

  async deleteRoute(routeId) {
    try {
      await ensureTables();
      
      await sql`DELETE FROM route_templates WHERE id = ${routeId}`;
      return true;
    } catch (error) {
      console.error('[Store] Error deleting route:', error?.message);
      throw error;
    }
  }

  async getRecords() {
    try {
      await ensureTables();
      
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
      console.error('[Store] Error getting records:', error?.message);
      throw error;
    }
  }

  async addRecord(record) {
    try {
      await ensureTables();
      
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
      console.error('[Store] Error adding record:', error?.message);
      throw error;
    }
  }

  async updateRecord(record) {
    try {
      await ensureTables();
      
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
      console.error('[Store] Error updating record:', error?.message);
      throw error;
    }
  }

  async deleteRecord(recordId) {
    try {
      await ensureTables();
      
      await sql`DELETE FROM route_records WHERE id = ${recordId}`;
      return true;
    } catch (error) {
      console.error('[Store] Error deleting record:', error?.message);
      throw error;
    }
  }

  async getDrivers() {
    try {
      await ensureTables();
      
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
      console.error('[Store] Error getting drivers:', error?.message);
      throw error;
    }
  }

  async saveDriver(driver) {
    try {
      await ensureTables();
      
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
      console.error('[Store] Error saving driver:', error?.message);
      throw error;
    }
  }

  async getTractors() {
    try {
      await ensureTables();
      
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
      console.error('[Store] Error getting tractors:', error?.message);
      throw error;
    }
  }

  async saveTractor(tractor) {
    try {
      await ensureTables();
      
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
      console.error('[Store] Error saving tractor:', error?.message);
      throw error;
    }
  }

  async getTrailers() {
    try {
      await ensureTables();
      
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
      console.error('[Store] Error getting trailers:', error?.message);
      throw error;
    }
  }

  async saveTrailer(trailer) {
    try {
      await ensureTables();
      
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
      console.error('[Store] Error saving trailer:', error?.message);
      throw error;
    }
  }

  async getVans() {
    try {
      await ensureTables();
      
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
      console.error('[Store] Error getting vans:', error?.message);
      throw error;
    }
  }

  async saveVan(van) {
    try {
      await ensureTables();
      
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
      console.error('[Store] Error saving van:', error?.message);
      throw error;
    }
  }
}

const store = new NeonStore();

module.exports = {
  store,
};
