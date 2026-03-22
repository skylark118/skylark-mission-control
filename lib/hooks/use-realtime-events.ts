'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { AgentEvent } from '@/types';

export function useRealtimeEvents(initialEvents: AgentEvent[]) {
  const [events, setEvents] = useState<AgentEvent[]>(initialEvents);
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    const channel = supabase
      .channel('agent-events')
      .on('broadcast', { event: 'new_event' }, (payload) => {
        const newEvent = payload.payload as AgentEvent;
        setEvents((prev) => [newEvent, ...prev].slice(0, 500));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return events;
}
