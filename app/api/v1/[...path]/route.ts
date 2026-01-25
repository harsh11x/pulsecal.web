import { NextRequest, NextResponse } from 'next/server';

// Server-side only - use BACKEND_URL env var
// IMPORTANT: Use environment variable, never hardcode HTTP URLs
// In production, BACKEND_URL should be set in Vercel environment variables
const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://13.205.127.21:3000';

// Log warning if using HTTP in production
if (typeof window === 'undefined' && BACKEND_URL.startsWith('http://')) {
  console.warn('[Proxy] WARNING: Using HTTP backend URL. This will cause mixed content errors with HTTPS frontend.');
  console.warn('[Proxy] Set BACKEND_URL environment variable to HTTPS URL in Vercel.');
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
    
    try {

        // Get request body for non-GET requests
        let body: string | undefined;
        if (request.method !== 'GET' && request.method !== 'HEAD') {
            try {
                body = await request.text();
            } catch {
                body = undefined;
            }
        }

        // Forward headers (excluding host and some others)
        const headers: Record<string, string> = {};
        request.headers.forEach((value, key) => {
            if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
                headers[key] = value;
            }
        });

        // Explicitly ensure Authorization header is present
        const authHeader = request.headers.get('authorization');
        if (authHeader) {
            headers['authorization'] = authHeader;
            console.log("Proxy: Forwarding Authorization header:", authHeader.substring(0, 20) + "...");
        } else {
            console.warn("Proxy: No Authorization header found in request");
        }

        console.log(`[Proxy] ${request.method} ${targetUrl}`);

        // Make the request to the backend
        const response = await fetch(targetUrl, {
            method: request.method,
            headers,
            body: body || undefined,
        });

        // Get response body
        const responseBody = await response.text();

        // Create response with same status and headers
        const responseHeaders = new Headers();
        response.headers.forEach((value, key) => {
            if (!['content-encoding', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
                responseHeaders.set(key, value);
            }
        });

        // Set content-type if not present
        if (!responseHeaders.has('content-type')) {
            responseHeaders.set('content-type', 'application/json');
        }

        console.log(`[Proxy] Response: ${response.status} ${response.statusText}`);

        return new NextResponse(responseBody, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
        });
    } catch (error: any) {
        console.error('[Proxy] Error:', error);
        console.error('[Proxy] Target URL was:', targetUrl);
        return NextResponse.json(
            { 
                success: false, 
                message: 'Backend connection failed', 
                error: error.message,
                details: `Failed to connect to ${BACKEND_URL}. Please check if the backend server is running.`
            },
            { status: 502 }
        );
    }
}
