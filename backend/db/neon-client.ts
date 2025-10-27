import { neon } from '@neondatabase/serverless';

let sqlInstance: ReturnType<typeof neon> | null = null;

export function getSql() {
  if (!sqlInstance) {
    const databaseUrl = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      console.error('[DB] Database URL not found. Checked NETLIFY_DATABASE_URL and DATABASE_URL');
      console.error('[DB] Available env vars:', Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('NETLIFY')));
      throw new Error('Database URL environment variable is not set');
    }
    
    console.log('[DB] Initializing database connection');
    console.log('[DB] Database URL is configured:', !!databaseUrl);
    console.log('[DB] Using NETLIFY_DATABASE_URL:', !!process.env.NETLIFY_DATABASE_URL);
    
    try {
      sqlInstance = neon(databaseUrl, {
        fetchOptions: {
          cache: 'no-store',
        },
      });
      console.log('[DB] Database client created successfully');
    } catch (error) {
      console.error('[DB] Error creating database client:', error);
      throw error;
    }
  }
  
  return sqlInstance;
}

export function sql(strings: TemplateStringsArray, ...values: any[]) {
  const client = getSql();
  return client(strings, ...values);
}

let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

export async function ensureTablesExist() {
  if (isInitialized) {
    console.log('[DB] Tables already initialized, skipping');
    return;
  }
  
  if (initializationPromise) {
    console.log('[DB] Waiting for ongoing initialization...');
    return initializationPromise;
  }
  
  initializationPromise = (async () => {
    try {
      console.log('[DB] Starting table initialization...');
      const startTime = Date.now();
      const sqlClient = getSql();
      console.log('[DB] SQL client obtained in', Date.now() - startTime, 'ms');
      
      await sqlClient`
        CREATE TABLE IF NOT EXISTS route_templates (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('TRAILER', 'FURGO')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      await sqlClient`
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

      await sqlClient`
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

      await sqlClient`
        CREATE TABLE IF NOT EXISTS saved_tractors (
          id TEXT PRIMARY KEY,
          plate TEXT NOT NULL,
          route_id TEXT NOT NULL,
          usage_count INTEGER DEFAULT 1,
          last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(plate, route_id)
        )
      `;

      await sqlClient`
        CREATE TABLE IF NOT EXISTS saved_trailers (
          id TEXT PRIMARY KEY,
          plate TEXT NOT NULL,
          route_id TEXT NOT NULL,
          usage_count INTEGER DEFAULT 1,
          last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(plate, route_id)
        )
      `;

      await sqlClient`
        CREATE TABLE IF NOT EXISTS saved_vans (
          id TEXT PRIMARY KEY,
          plate TEXT NOT NULL,
          route_id TEXT NOT NULL,
          usage_count INTEGER DEFAULT 1,
          last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(plate, route_id)
        )
      `;

      await sqlClient`CREATE INDEX IF NOT EXISTS idx_route_records_date ON route_records(date)`;
      await sqlClient`CREATE INDEX IF NOT EXISTS idx_route_records_template_id ON route_records(route_template_id)`;
      await sqlClient`CREATE INDEX IF NOT EXISTS idx_saved_drivers_route_id ON saved_drivers(route_id)`;
      await sqlClient`CREATE INDEX IF NOT EXISTS idx_saved_tractors_route_id ON saved_tractors(route_id)`;
      await sqlClient`CREATE INDEX IF NOT EXISTS idx_saved_trailers_route_id ON saved_trailers(route_id)`;
      await sqlClient`CREATE INDEX IF NOT EXISTS idx_saved_vans_route_id ON saved_vans(route_id)`;

      const duration = Date.now() - startTime;
      isInitialized = true;
      console.log('[DB] Tables created/verified successfully in', duration, 'ms');
    } catch (error) {
      console.error('[DB] Error ensuring tables exist:', error);
      console.error('[DB] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack',
        name: error instanceof Error ? error.name : 'Unknown',
      });
      initializationPromise = null;
      throw error;
    }
  })();
  
  return initializationPromise;
}
