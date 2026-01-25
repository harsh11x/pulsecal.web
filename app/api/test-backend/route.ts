import { NextResponse } from 'next/server';

// Test endpoint to verify backend connectivity
const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://13.205.127.21:3000';

export async function GET() {
    const testResults: Record<string, any> = {
        timestamp: new Date().toISOString(),
        backendUrl: BACKEND_URL,
        envVars: {
            BACKEND_URL: process.env.BACKEND_URL || 'NOT SET',
            NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'NOT SET',
            BACKEND_HOST: process.env.BACKEND_HOST || 'NOT SET',
            BACKEND_PROTOCOL: process.env.BACKEND_PROTOCOL || 'NOT SET',
        },
        tests: {},
    };

    // Test 1: Backend health check
    try {
        const healthUrl = `${BACKEND_URL}/health`;
        console.log(`[Test] Testing backend health: ${healthUrl}`);
        
        const response = await fetch(healthUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        
        const data = await response.text();
        testResults.tests.health = {
            success: response.ok,
            status: response.status,
            statusText: response.statusText,
            data: data.substring(0, 200),
        };
    } catch (error: any) {
        console.error('[Test] Health check failed:', error);
        testResults.tests.health = {
            success: false,
            error: error.message,
            errorType: error.name,
            cause: error.cause?.message || 'Unknown',
        };
    }

    // Test 2: Backend API endpoint
    try {
        const apiUrl = `${BACKEND_URL}/api/v1/doctors/search?limit=1`;
        console.log(`[Test] Testing backend API: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        
        const data = await response.text();
        testResults.tests.api = {
            success: response.ok,
            status: response.status,
            statusText: response.statusText,
            data: data.substring(0, 200),
        };
    } catch (error: any) {
        console.error('[Test] API test failed:', error);
        testResults.tests.api = {
            success: false,
            error: error.message,
            errorType: error.name,
        };
    }

    // Return results
    return NextResponse.json(testResults, { status: 200 });
}

