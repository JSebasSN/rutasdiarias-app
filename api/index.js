const app = require('../backend/hono.js');

exports.handler = async (event, context) => {
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    console.log('========================================');
    console.log('[Lambda]', requestId, '- New request');
    console.log('[Lambda] Method:', event.httpMethod);
    console.log('[Lambda] Path:', event.path);
    console.log('[Lambda] ENV Check - NETLIFY_DATABASE_URL:', !!process.env.NETLIFY_DATABASE_URL);
    
    let path = event.path;
    
    if (path.startsWith('/.netlify/functions/api')) {
      path = path.replace('/.netlify/functions/api', '');
    }
    
    if (path.startsWith('/api')) {
      path = path.substring(4);
    }
    
    if (!path || path === '') {
      path = '/';
    }
    
    console.log('[Lambda] Normalized path:', path);
    
    const queryString = event.queryStringParameters 
      ? '?' + Object.entries(event.queryStringParameters)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
          .join('&')
      : '';
    
    const url = `https://example.com${path}${queryString}`;
    console.log('[Lambda] Full URL:', url);
    
    const headers = new Headers();
    if (event.headers) {
      Object.entries(event.headers).forEach(([key, value]) => {
        if (value) {
          headers.set(key, value);
        }
      });
    }
    
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (event.httpMethod === 'OPTIONS') {
      console.log('[Lambda] OPTIONS request - returning 204');
      return {
        statusCode: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
        body: '',
      };
    }
    
    const request = new Request(url, {
      method: event.httpMethod,
      headers: headers,
      body: event.body || undefined,
    });
    
    console.log('[Lambda] Calling Hono app...');
    const response = await app.default.fetch(request);
    
    console.log('[Lambda] Hono response status:', response.status);
    
    const responseBody = await response.text();
    
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    
    responseHeaders['Access-Control-Allow-Origin'] = '*';
    responseHeaders['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    responseHeaders['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    
    console.log('[Lambda]', requestId, '- Success:', response.status);
    console.log('========================================');
    
    return {
      statusCode: response.status,
      headers: responseHeaders,
      body: responseBody,
    };
  } catch (error) {
    console.error('========================================');
    console.error('[Lambda]', requestId, '- ERROR');
    console.error('[Lambda] Error:', error);
    console.error('[Lambda] Error message:', error?.message);
    console.error('[Lambda] Error stack:', error?.stack);
    console.error('========================================');
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: JSON.stringify({
        error: error?.message || 'Internal Server Error',
        requestId,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};
