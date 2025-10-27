const { neon } = require('@neondatabase/serverless');

let sqlInstance = null;

function getSql() {
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

function sql(strings, ...values) {
  const client = getSql();
  return client(strings, ...values);
}

module.exports = {
  getSql,
  sql,
};
