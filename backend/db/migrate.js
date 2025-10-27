const { getSql } = require('./neon-client');

let migrationCompleted = false;
let migrationPromise = null;

async function runMigrations() {
  if (migrationCompleted) {
    console.log('[Migration] Already completed, skipping');
    return { success: true, cached: true };
  }

  if (migrationPromise) {
    console.log('[Migration] Already in progress, waiting...');
    return migrationPromise;
  }

  const startTime = Date.now();
  console.log('[Migration] Starting database migrations...');
  
  migrationPromise = (async () => {
    try {
      const sql = getSql();
      
      console.log('[Migration] Creating tables in batch...');
      await sql`
        CREATE TABLE IF NOT EXISTS route_templates (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('TRAILER', 'FURGO')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

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
        );

        CREATE TABLE IF NOT EXISTS saved_drivers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          dni TEXT NOT NULL,
          phone TEXT NOT NULL,
          route_id TEXT NOT NULL,
          usage_count INTEGER DEFAULT 1,
          last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(dni, route_id)
        );

        CREATE TABLE IF NOT EXISTS saved_tractors (
          id TEXT PRIMARY KEY,
          plate TEXT NOT NULL,
          route_id TEXT NOT NULL,
          usage_count INTEGER DEFAULT 1,
          last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(plate, route_id)
        );

        CREATE TABLE IF NOT EXISTS saved_trailers (
          id TEXT PRIMARY KEY,
          plate TEXT NOT NULL,
          route_id TEXT NOT NULL,
          usage_count INTEGER DEFAULT 1,
          last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(plate, route_id)
        );

        CREATE TABLE IF NOT EXISTS saved_vans (
          id TEXT PRIMARY KEY,
          plate TEXT NOT NULL,
          route_id TEXT NOT NULL,
          usage_count INTEGER DEFAULT 1,
          last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(plate, route_id)
        );

        CREATE INDEX IF NOT EXISTS idx_route_records_date ON route_records(date);
        CREATE INDEX IF NOT EXISTS idx_route_records_template_id ON route_records(route_template_id);
        CREATE INDEX IF NOT EXISTS idx_saved_drivers_route_id ON saved_drivers(route_id);
        CREATE INDEX IF NOT EXISTS idx_saved_tractors_route_id ON saved_tractors(route_id);
        CREATE INDEX IF NOT EXISTS idx_saved_trailers_route_id ON saved_trailers(route_id);
        CREATE INDEX IF NOT EXISTS idx_saved_vans_route_id ON saved_vans(route_id);
      `;

      migrationCompleted = true;
      const duration = Date.now() - startTime;
      console.log('[Migration] Migrations completed successfully in', duration, 'ms');
      return { success: true, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('[Migration] Error running migrations after', duration, 'ms:', error);
      migrationPromise = null;
      throw error;
    }
  })();
  
  return migrationPromise;
}

module.exports = {
  runMigrations,
};
