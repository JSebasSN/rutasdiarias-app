import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Database URL not found. Checked NETLIFY_DATABASE_URL and DATABASE_URL');
  console.error('Available env vars:', Object.keys(process.env).filter(k => !k.includes('SECRET')));
  throw new Error('Database URL environment variable is not set');
}

console.log('Database URL is configured:', !!databaseUrl);
console.log('Using NETLIFY_DATABASE_URL:', !!process.env.NETLIFY_DATABASE_URL);

export const sql = neon(databaseUrl);

export async function initializeDatabase() {
  console.log('Initializing database...');
  
  try {
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
    await sql`CREATE INDEX IF NOT EXISTS idx_saved_drivers_route_id ON saved_drivers(route_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_saved_tractors_route_id ON saved_tractors(route_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_saved_trailers_route_id ON saved_trailers(route_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_saved_vans_route_id ON saved_vans(route_id)`;

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}
