const app = require('../backend/hono.js');

exports.handler = async (req, context) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    console.log('========================================');
    console.log('[Netlify Function] Request ID:', requestId);
    console.log('[Netlify Function] Method:', req.method);
    console.log('[Netlify Function] URL:', req.url);
    console.log('[Netlify Function] Time:', new Date().toISOString());
    
    console.log('[Netlify Function] Environment:');
    console.log('  - NETLIFY_DATABASE_URL:', !!process.env.NETLIFY_DATABASE_URL ? 'SET' : 'NOT SET');
    console.log('  - DATABASE_URL:', !!process.env.DATABASE_URL ? 'SET' : 'NOT SET');
    console.log('  - NODE_ENV:', process.env.NODE_ENV);

    const url = new URL(req.url);
    const originalPath = url.pathname;
    
    let path = url.pathname.replace(/^\/\.netlify\/functions\/api/, '');
    
    if (path.startsWith('/api')) {
      path = path.substring(4);
    }
    
    if (!path || path === '/') {
      path = '/';
    }
    
    url.pathname = path;
    
    console.log('[Netlify Function] Path:', originalPath, '->', path);

    let body = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
      try {
        const text = await req.text();
        if (text) {
          console.log('[Netlify Function] Body length:', text.length);
          body = text;
        }
      } catch (error) {
        console.error('[Netlify Function] Error reading body:', error);
      }
    }
    
    console.log('[Netlify Function] Calling Hono...');
    const honoStartTime = Date.now();
    
    const newReq = new Request(url.toString(), {
      method: req.method,
      headers: req.headers,
      body: body,
    });
    
    const response = await Promise.race([
      app.default.fetch(newReq, {}, context),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout after 20 seconds')), 20000)
      )
    ]);
    
    const honoDuration = Date.now() - honoStartTime;
    const totalDuration = Date.now() - startTime;
    
    console.log('[Netlify Function] Response Status:', response.status);
    console.log('[Netlify Function] Hono Duration:', honoDuration, 'ms');
    console.log('[Netlify Function] Total Duration:', totalDuration, 'ms');
    console.log('========================================');
    
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('========================================');
    console.error('[Netlify Function] ERROR - Request ID:', requestId);
    console.error('[Netlify Function] Duration:', duration, 'ms');
    console.error('[Netlify Function] Error Name:', error?.name);
    console.error('[Netlify Function] Error Message:', error?.message);
    console.error('[Netlify Function] Error Stack:', error?.stack);
    console.error('========================================');
    
    return new Response(JSON.stringify({ 
      error: error?.message || 'Internal Server Error',
      name: error?.name,
      requestId,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    }, null, 2), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
};
