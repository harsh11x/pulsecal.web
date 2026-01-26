import { NextRequest, NextResponse } from 'next/server';

// Backend URL - MUST be set in Vercel environment variables
const BACKEND_URL = process.env.BACKEND_URL || 'http://13.205.127.21:3001';

export const dynamic = 'force-dynamic';

async function handleProxy(request: NextRequest, pathArray: string[]) {
    const path = pathArray.join('/');
    const searchParams = request.nextUrl.search || '';
    const targetUrl = `${BACKEND_URL}/api/v1/${path}${searchParams}`;
    
    try {
        // Get request body
        let bodyText: string | undefined = undefined;
        if (request.method !== 'GET' && request.method !== 'HEAD') {
            try {
                bodyText = await request.text();
            } catch (e) {
                // No body
            }
        }

        // Build headers
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
        
        // Forward auth header
        const authHeader = request.headers.get('authorization');
        if (authHeader) {
            headers['Authorization'] = authHeader;
        }

        // Make the request
        const response = await fetch(targetUrl, {
            method: request.method,
            headers,
            body: bodyText,
            cache: 'no-store',
        });

        // Read response
        const responseText = await response.text();

        // Return with proper headers
        return new NextResponse(responseText, {
            status: response.status,
            statusText: response.statusText,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store',
            },
        });
        
    } catch (error: any) {
        console.error('[API Proxy Error]', error.message);
        return NextResponse.json(
            { 
                success: false, 
                message: `Backend connection failed: ${error.message}`,
                path,
                targetUrl,
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
