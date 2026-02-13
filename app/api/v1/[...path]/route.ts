import { NextRequest, NextResponse } from 'next/server';

// Backend URL - MUST be set in Vercel environment variables
const BACKEND_URL = process.env.BACKEND_URL || 'http://13.205.127.21:3001';

export const dynamic = 'force-dynamic';

async function handleProxy(request: NextRequest, pathArray: string[]) {
    const path = pathArray.join('/');
    const searchParams = request.nextUrl.search || '';
    // Avoid double /api/v1 if BACKEND_URL already includes it
    const base = BACKEND_URL.replace(/\/+$/, '');
    const baseWithApi =
        base.endsWith('/api/v1') || base.endsWith('/api/v1/')
            ? base.replace(/\/+$/, '')
            : `${base}/api/v1`;
    const targetUrl = `${baseWithApi}/${path}${searchParams}`;

    try {
        // Forward headers (don’t force JSON; allow multipart, etc.)
        const headers: HeadersInit = {};
        request.headers.forEach((value, key) => {
            const k = key.toLowerCase();
            // Skip hop-by-hop / auto-managed headers
            if (k === 'host' || k === 'content-length') return;
            headers[key] = value;
        });
        // Ensure no caching
        headers['Cache-Control'] = 'no-store';

        // Forward body as binary (works for JSON + multipart)
        const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
        const body = hasBody ? await request.arrayBuffer() : undefined;

        // Make the request
        const response = await fetch(targetUrl, {
            method: request.method,
            headers,
            body: body ? Buffer.from(body) : undefined,
            cache: 'no-store',
        });

        // Return response preserving content-type (json, text, etc.)
        const contentType = response.headers.get('content-type') || 'application/json';
        const responseBody = await response.arrayBuffer();
        return new NextResponse(responseBody, {
            status: response.status,
            statusText: response.statusText,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'no-store',
                'X-Proxy-Target': targetUrl,
            },
        });

    } catch (error: any) {
        console.error('[API Proxy Error]', error.message);
        console.error('[API Proxy Details]', {
            path,
            targetUrl,
            errorName: error.name,
            cause: error.cause
        });

        return NextResponse.json(
            {
                success: false,
                message: `Backend connection failed: ${error.message}`,
                path,
                targetUrl,
                timestamp: new Date().toISOString()
            },
            { status: 502 }
        );
    }
}

// Next.js 14+ requires awaiting params
type RouteContext = { params: Promise<{ path: string[] }> | { path: string[] } };

async function getPathArray(context: RouteContext): Promise<string[]> {
    // Handle both Promise and non-Promise params (Next.js version compatibility)
    const params = 'then' in context.params ? await context.params : context.params;
    return Array.isArray(params.path) ? params.path : [params.path];
}

export async function GET(request: NextRequest, context: RouteContext) {
    const pathArray = await getPathArray(context);
    return handleProxy(request, pathArray);
}

export async function POST(request: NextRequest, context: RouteContext) {
    const pathArray = await getPathArray(context);
    return handleProxy(request, pathArray);
}

export async function PUT(request: NextRequest, context: RouteContext) {
    const pathArray = await getPathArray(context);
    return handleProxy(request, pathArray);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
    const pathArray = await getPathArray(context);
    return handleProxy(request, pathArray);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
    const pathArray = await getPathArray(context);
    return handleProxy(request, pathArray);
}
