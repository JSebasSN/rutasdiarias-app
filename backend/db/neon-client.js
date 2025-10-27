const { neon } = require('@neondatabase/serverless');

let sqlInstance = null;

function getSql() {
  if (!sqlInstance) {
    const databaseUrl = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      const error = new Error('Database URL is not configured. Please set NETLIFY_DATABASE_URL environment variable.');
      console.error('[DB] ERROR:', error.message);
      console.error('[DB] Available vars:', Object.keys(process.env).filter(k => 
        k.includes('DATABASE') || k.includes('NETLIFY') || k.includes('NEON')
      ));
      throw error;
    }
    
    console.log('[DB] Initializing connection...');
    console.log('[DB] Using URL from:', process.env.NETLIFY_DATABASE_URL ? 'NETLIFY_DATABASE_URL' : 'DATABASE_URL');
    
    try {
      sqlInstance = neon(databaseUrl, {
        fetchOptions: {
          cache: 'no-store',
        },
      });
      console.log('[DB] Connection initialized');
    } catch (error) {
      console.error('[DB] Failed to initialize:', error?.message);
      sqlInstance = null;
      throw error;
    }
  }
  
  return sqlInstance;
}

function sql(strings, ...values) {
  try {
    const client = getSql();
    return client(strings, ...values);
  } catch (error) {
    console.error('[DB] Query error:', error?.message);
    throw error;
  }
}

module.exports = {
  getSql,
  sql,
};
