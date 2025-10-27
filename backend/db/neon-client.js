const { neon } = require('@neondatabase/serverless');

let sqlInstance = null;

function getSql() {
  if (!sqlInstance) {
    const databaseUrl = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      console.error('[DB] ERROR: Database URL not found');
      console.error('[DB] Checked: NETLIFY_DATABASE_URL, DATABASE_URL');
      console.error('[DB] Available env vars:', Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('NETLIFY')).join(', '));
      throw new Error('Database URL environment variable is not set. Please configure NETLIFY_DATABASE_URL in Netlify dashboard.');
    }
    
    console.log('[DB] Initializing Neon database connection');
    console.log('[DB] Using NETLIFY_DATABASE_URL:', !!process.env.NETLIFY_DATABASE_URL);
    console.log('[DB] Using DATABASE_URL:', !!process.env.DATABASE_URL);
    
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
