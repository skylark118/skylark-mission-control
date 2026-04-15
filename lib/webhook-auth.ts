import { NextRequest, NextResponse } from 'next/server';

export function requireWebhookAuth(request: NextRequest): NextResponse | null {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (token !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
