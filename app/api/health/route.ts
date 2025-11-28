import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    message: 'Smart Todo API',
    storage: 'persistent',
    timestamp: new Date().toISOString(),
  });
}
