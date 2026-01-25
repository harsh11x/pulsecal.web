import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://13.205.127.21:3001';

async function proxyToBackend(request: NextRequest, pathSegments: string[]) {
    const path = pathSegments.join('/');
    const searchParams = request.nextUrl.search;
    const targetUrl = `${BACKEND_URL}/api/v1/${path}${searchParams}`;
    
    console.log(`[Proxy] ${request.method} -> ${targetUrl}`);
    
    try {
        // Get body for non-GET requests
        let body: string | null = null;
        if (request.method !== 'GET' && request.method !== 'HEAD') {
            try {
                body = await request.text();
            } catch {
                body = null;
            }
        }

        // Build headers
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        
        // Forward Authorization header
        const authHeader = request.headers.get('authorization');
        if (authHeader) {
            headers['Authorization'] = authHeader;
            console.log('[Proxy] Forwarding auth token');
        }

        // Make request to backend
        const backendResponse = await fetch(targetUrl, {
            method: request.method,
            headers,
            body: body || undefined,
        });

        // Get response
        const responseText = await backendResponse.text();
        
        console.log(`[Proxy] Response: ${backendResponse.status} for ${path}`);
        
        // Log error responses
        if (backendResponse.status >= 400) {
            console.error(`[Proxy] Error response: ${responseText.substring(0, 200)}`);
        }

        // Return response
        return new NextResponse(responseText, {
            status: backendResponse.status,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error: any) {
        console.error('[Proxy] FATAL ERROR:', error.message);
        console.error('[Proxy] Stack:', error.stack);
        return NextResponse.json(
            { 
                success: false, 
                message: 'Proxy error: ' + error.message,
                targetUrl,
            },
            { status: 502 }
        );
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    return proxyToBackend(request, params.path);
}

export async function POST(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    return proxyToBackend(request, params.path);
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    return proxyToBackend(request, params.path);
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    return proxyToBackend(request, params.path);
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    return proxyToBackend(request, params.path);
}
