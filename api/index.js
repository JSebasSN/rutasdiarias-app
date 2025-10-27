import app from '../backend/hono';

export const handler = async (req, context) => {
  const startTime = Date.now();
  
  try {
    console.log('[Netlify Function] ========== NEW REQUEST ==========');
    console.log('[Netlify Function] Received request:', {
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString(),
    });
    
    console.log('[Netlify Function] Environment check:', {
      hasDbUrl: !!process.env.DATABASE_URL,
      hasNetlifyDbUrl: !!process.env.NETLIFY_DATABASE_URL,
      netlifyDbUrlPrefix: process.env.NETLIFY_DATABASE_URL ? process.env.NETLIFY_DATABASE_URL.substring(0, 20) : 'N/A',
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
      search: url.search,
      fullUrl: url.toString(),
    });

    let body = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
      try {
        const text = await req.text();
        if (text) {
          console.log('[Netlify Function] Request body length:', text.length);
          console.log('[Netlify Function] Request body preview:', text.substring(0, 200));
          body = text;
        }
      } catch (error) {
        console.error('[Netlify Function] Error reading body:', error);
      }
    }
    
    console.log('[Netlify Function] Calling Hono app...');
    const newReq = new Request(url.toString(), {
      method: req.method,
      headers: req.headers,
      body: body,
    });
    
    const response = await app.fetch(newReq, {}, context);
    const duration = Date.now() - startTime;
    
    console.log('[Netlify Function] Response:', {
      status: response.status,
      statusText: response.statusText,
      duration: `${duration}ms`,
    });
    
    if (response.status >= 400) {
      try {
        const responseText = await response.text();
        console.error('[Netlify Function] Error response body:', responseText);
        
        const responseHeaders = new Headers(response.headers);
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        return new Response(responseText, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
        });
      } catch (err) {
        console.error('[Netlify Function] Error reading error response:', err);
      }
    }
    
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    console.log('[Netlify Function] Request completed successfully in', duration, 'ms');
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Netlify Function] ========== ERROR ==========');
    console.error('[Netlify Function] Error in API handler after', duration, 'ms:');
    console.error('[Netlify Function] Error message:', error?.message);
    console.error('[Netlify Function] Error stack:', error?.stack);
    console.error('[Netlify Function] Error name:', error?.name);
    console.error('[Netlify Function] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    return new Response(JSON.stringify({ 
      error: error?.message || 'Unknown error',
      name: error?.name,
      stack: error?.stack,
      duration: `${duration}ms`,
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
