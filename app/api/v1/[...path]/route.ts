import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'http://13.205.127.21:3001';

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
    try {
        const path = pathSegments.join('/');
        const url = new URL(request.url);
        const targetUrl = `${BACKEND_URL}/api/v1/${path}${url.search}`;

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

        return new NextResponse(responseBody, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
        });
    } catch (error: any) {
        console.error('Proxy error:', error);
        return NextResponse.json(
            { success: false, message: 'Backend connection failed', error: error.message },
            { status: 502 }
        );
    }
}
