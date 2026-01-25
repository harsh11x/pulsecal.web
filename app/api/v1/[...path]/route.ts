import { NextRequest, NextResponse } from 'next/server';

// Server-side only - use BACKEND_URL env var
// IMPORTANT: In production, BACKEND_URL should be set in Vercel environment variables
const BACKEND_PROTOCOL = process.env.BACKEND_PROTOCOL || 'http';
const BACKEND_HOST = process.env.BACKEND_HOST || process.env.BACKEND_URL?.replace(/^https?:\/\//, '') || '13.205.127.21:3000';
const BACKEND_URL = `${BACKEND_PROTOCOL}://${BACKEND_HOST}`;

// Log configuration (server-side only)
if (typeof window === 'undefined') {
  console.log('[Proxy] Backend URL:', BACKEND_URL);
  if (BACKEND_URL.startsWith('http://')) {
    console.warn('[Proxy] WARNING: Using HTTP backend URL. This may cause mixed content errors.');
  }
}

export async function GET(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    return proxyRequest(request, params.path);
}

export async function POST(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    return proxyRequest(request, params.path);
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    return proxyRequest(request, params.path);
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    return proxyRequest(request, params.path);
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    return proxyRequest(request, params.path);
}

async function proxyRequest(request: NextRequest, pathSegments: string[]) {
    const path = pathSegments.join('/');
    const url = new URL(request.url);
    
    // Remove /api/v1 prefix if it exists in path (since we're already in /api/v1 route)
    const cleanPath = path.startsWith('api/v1/') ? path.replace('api/v1/', '') : path;
    const targetUrl = `${BACKEND_URL}/api/v1/${cleanPath}${url.search}`;
    
    // Log the request (server-side only)
    if (typeof window === 'undefined') {
        console.log(`[Proxy] ${request.method} ${targetUrl}`);
    }
    
    try {
        // Get request body for non-GET requests
        let body: string | undefined;
        if (request.method !== 'GET' && request.method !== 'HEAD') {
            try {
                body = await request.text();
            } catch (err) {
                console.warn('[Proxy] Failed to read request body:', err);
                body = undefined;
            }
        }

        // Forward headers (excluding host and some others)
        const headers: Record<string, string> = {};
        request.headers.forEach((value, key) => {
            const lowerKey = key.toLowerCase();
            if (!['host', 'connection', 'content-length', 'content-encoding', 'transfer-encoding'].includes(lowerKey)) {
                headers[key] = value;
            }
        });

        // Explicitly ensure Authorization header is present
        const authHeader = request.headers.get('authorization');
        if (authHeader) {
            headers['authorization'] = authHeader;
            if (typeof window === 'undefined') {
                console.log('[Proxy] Forwarding Authorization header');
            }
        } else {
            if (typeof window === 'undefined') {
                console.warn('[Proxy] No Authorization header found in request');
            }
        }

        // Add timeout to fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        try {
            // Make the request to the backend
            const response = await fetch(targetUrl, {
                method: request.method,
                headers,
                body: body || undefined,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            // Get response body
            let responseBody: string;
            try {
                responseBody = await response.text();
            } catch (err) {
                console.error('[Proxy] Failed to read response body:', err);
                responseBody = '';
            }

            // Create response with same status and headers
            const responseHeaders = new Headers();
            response.headers.forEach((value, key) => {
                const lowerKey = key.toLowerCase();
                if (!['content-encoding', 'transfer-encoding', 'connection', 'content-length'].includes(lowerKey)) {
                    responseHeaders.set(key, value);
                }
            });

            // Set content-type if not present
            if (!responseHeaders.has('content-type')) {
                responseHeaders.set('content-type', 'application/json');
            }

            if (typeof window === 'undefined') {
                console.log(`[Proxy] Response: ${response.status} ${response.statusText} for ${request.method} ${cleanPath}`);
            }

            // If backend returned 500, log the response body for debugging
            if (response.status === 500 && typeof window === 'undefined') {
                console.error('[Proxy] Backend returned 500 error');
                console.error('[Proxy] Response body:', responseBody.substring(0, 500));
            }

            return new NextResponse(responseBody, {
                status: response.status,
                statusText: response.statusText,
                headers: responseHeaders,
            });
        } catch (fetchError: any) {
            clearTimeout(timeoutId);
            
            if (fetchError.name === 'AbortError') {
                console.error('[Proxy] Request timeout after 30 seconds');
                return NextResponse.json(
                    { 
                        success: false, 
                        message: 'Backend request timeout',
                        error: 'The backend server did not respond within 30 seconds',
                        details: `Timeout connecting to ${BACKEND_URL}`
                    },
                    { status: 504 }
                );
            }
            
            throw fetchError;
        }
    } catch (error: any) {
        console.error('[Proxy] Error proxying request:', error);
        console.error('[Proxy] Target URL was:', targetUrl);
        console.error('[Proxy] Error message:', error.message);
        console.error('[Proxy] Error stack:', error.stack);
        
        // Return detailed error for debugging
        return NextResponse.json(
            { 
                success: false, 
                message: 'Backend connection failed', 
                error: error.message || 'Unknown error',
                errorType: error.name || 'Unknown',
                details: `Failed to connect to ${BACKEND_URL}. Error: ${error.message}`,
                targetUrl: targetUrl,
            },
            { status: 502 }
        );
    }
}
