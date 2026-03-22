-- Mission Control Phase 1: Database Schema
-- Run this in Supabase SQL Editor

-- Agent registry
CREATE TABLE public.agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT DEFAULT 'idle' CHECK (status IN ('active', 'idle', 'error', 'offline')),
  avatar_emoji TEXT DEFAULT '🦞',
  default_model TEXT,
  last_heartbeat TIMESTAMPTZ,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed agents
INSERT INTO public.agents (name, role, avatar_emoji, default_model) VALUES
  ('Stella', 'orchestrator', '⭐', 'claude-sonnet-4'),
  ('Cora', 'engineering', '🦞', 'gpt-5.3-codex'),
  ('Remy', 'research', '🔍', 'claude-sonnet-4'),
  ('Penny', 'content', '✍️', 'claude-sonnet-4');

-- Activity events
CREATE TABLE public.agent_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  action TEXT NOT NULL,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  summary TEXT,
  metadata JSONB DEFAULT '{}',
  session_id UUID,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX idx_events_agent_created ON public.agent_events(agent_id, created_at DESC);
CREATE INDEX idx_events_type ON public.agent_events(event_type);
CREATE INDEX idx_events_created ON public.agent_events(created_at DESC);

-- Broadcast trigger
CREATE OR REPLACE FUNCTION notify_agent_activity()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM realtime.send(
    jsonb_build_object(
      'event_id', NEW.id,
      'agent_id', NEW.agent_id,
      'event_type', NEW.event_type,
      'action', NEW.action,
      'status', NEW.status,
      'summary', NEW.summary,
      'metadata', NEW.metadata,
      'created_at', NEW.created_at
    ),
    'new_event',
    'agent-events'
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER agent_events_broadcast
AFTER INSERT ON public.agent_events
FOR EACH ROW EXECUTE FUNCTION notify_agent_activity();
