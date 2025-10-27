const app = require('../backend/hono.js');

exports.handler = async (req, context) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    console.log('[Netlify Function] ========== NEW REQUEST ==========');
    console.log('[Netlify Function] Request ID:', requestId);
    console.log('[Netlify Function] Received request:', {
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString(),
    });
    
    console.log('[Netlify Function] Environment check:', {
      hasDbUrl: !!process.env.DATABASE_URL,
      hasNetlifyDbUrl: !!process.env.NETLIFY_DATABASE_URL,
      nodeEnv: process.env.NODE_ENV,
    });

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
    
    console.log('[Netlify Function] Path transformation:', {
      original: originalPath,
      rewritten: path,
    });

    let body = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
      try {
        const text = await req.text();
        if (text) {
          console.log('[Netlify Function] Request body length:', text.length);
          body = text;
        }
      } catch (error) {
        console.error('[Netlify Function] Error reading body:', error);
      }
    }
    
    console.log('[Netlify Function] Calling Hono app...');
    const honoStartTime = Date.now();
    const newReq = new Request(url.toString(), {
      method: req.method,
      headers: req.headers,
      body: body,
    });
    
    const response = await Promise.race([
      app.default.fetch(newReq, {}, context),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout after 25 seconds')), 25000)
      )
    ]);
    const honoDuration = Date.now() - honoStartTime;
    const duration = Date.now() - startTime;
    
    console.log('[Netlify Function] Response:', {
      requestId,
      status: response.status,
      statusText: response.statusText,
      honoDuration: `${honoDuration}ms`,
      totalDuration: `${duration}ms`,
    });
    
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    console.log('[Netlify Function] Request', requestId, 'completed successfully in', duration, 'ms');
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Netlify Function] ========== ERROR ==========');
    console.error('[Netlify Function] Request ID:', requestId);
    console.error('[Netlify Function] Error after', duration, 'ms:');
    console.error('[Netlify Function] Error message:', error?.message);
    console.error('[Netlify Function] Error stack:', error?.stack);
    
    return new Response(JSON.stringify({ 
      error: error?.message || 'Unknown error',
      name: error?.name,
      stack: error?.stack,
      requestId,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
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
