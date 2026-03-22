import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token || token !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { agent_id, event_type, action, status, summary, metadata, session_id, duration_ms } = body;

    // Validate required fields
    if (!agent_id || !event_type || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: agent_id, event_type, action' },
        { status: 400 }
      );
    }

    // Insert event
    const { data, error } = await supabase
      .from('agent_events')
      .insert({
        agent_id,
        event_type,
        action,
        status: status || 'completed',
        summary: summary || null,
        metadata: metadata || {},
        session_id: session_id || null,
        duration_ms: duration_ms || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting event:', error);
      return NextResponse.json(
        { error: 'Failed to insert event', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, event: data }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
