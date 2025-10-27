const { getSql } = require('./neon-client');

async function runMigrations() {
  const startTime = Date.now();
  console.log('[Migration] Starting database migrations...');
  
  try {
    const sql = getSql();
    
    console.log('[Migration] Creating route_templates table...');
    await sql`
      CREATE TABLE IF NOT EXISTS route_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('TRAILER', 'FURGO')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('[Migration] Creating route_records table...');
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

    console.log('[Migration] Creating saved_drivers table...');
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

    console.log('[Migration] Creating saved_tractors table...');
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

    console.log('[Migration] Creating saved_trailers table...');
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

    console.log('[Migration] Creating saved_vans table...');
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

    console.log('[Migration] Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_route_records_date ON route_records(date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_route_records_template_id ON route_records(route_template_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_saved_drivers_route_id ON saved_drivers(route_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_saved_tractors_route_id ON saved_tractors(route_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_saved_trailers_route_id ON saved_trailers(route_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_saved_vans_route_id ON saved_vans(route_id)`;

    const duration = Date.now() - startTime;
    console.log('[Migration] Migrations completed successfully in', duration, 'ms');
    return { success: true, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Migration] Error running migrations after', duration, 'ms:', error);
    throw error;
  }
}

module.exports = {
  runMigrations,
};
