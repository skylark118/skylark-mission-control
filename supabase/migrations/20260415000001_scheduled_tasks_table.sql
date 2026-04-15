-- Create scheduled_tasks table for cron/recurring agent routines
CREATE TABLE public.scheduled_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  schedule TEXT NOT NULL,
  schedule_human TEXT,
  agent_id UUID REFERENCES public.agents(id),
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'disabled')),
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  category TEXT DEFAULT 'general'
    CHECK (category IN ('briefing', 'research', 'content', 'maintenance', 'general')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed current scheduled tasks
INSERT INTO public.scheduled_tasks (name, schedule, schedule_human, category, status) VALUES
  ('Dreaming (Memory Consolidation)', '0 3 * * *', 'Daily at 3:00 AM', 'maintenance', 'active'),
  ('Sunday Week Ahead Planning', '0 9 * * 0', 'Sundays at 9:00 AM', 'briefing', 'active'),
  ('Monday AI Strategic Intelligence', '0 9 * * 1', 'Mondays at 9:00 AM', 'research', 'active'),
  ('Tuesday Content Generation', '0 9 * * 2', 'Tuesdays at 9:00 AM', 'content', 'active'),
  ('Wednesday Revenue & Growth', '0 9 * * 3', 'Wednesdays at 9:00 AM', 'research', 'active'),
  ('Thursday Product Health + AI News', '0 9 * * 4', 'Thursdays at 9:00 AM', 'research', 'active'),
  ('Friday Agent Ecosystem Prep', '0 9 * * 5', 'Fridays at 9:00 AM', 'research', 'active'),
  ('Saturday Week in Review', '0 9 * * 6', 'Saturdays at 9:00 AM', 'briefing', 'active'),
  ('Weekly Goals Check-In', '0 10 * * 1', 'Mondays at 10:00 AM', 'briefing', 'active'),
  ('Stella Heartbeat', '*/30 * * * *', 'Every 30 minutes (8am-midnight)', 'maintenance', 'active');
