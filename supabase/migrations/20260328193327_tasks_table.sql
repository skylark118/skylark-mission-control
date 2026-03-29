-- Create tasks table for agent delegation
CREATE TABLE public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES public.agents(id),
  created_by UUID REFERENCES public.agents(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'review', 'complete', 'blocked')),
  priority TEXT DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  result TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tasks_assigned ON public.tasks(assigned_to, status);
CREATE INDEX idx_tasks_status ON public.tasks(status);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN 
  NEW.updated_at = now(); 
  RETURN NEW; 
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at 
BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION update_tasks_updated_at();

-- Broadcast task changes via Realtime
CREATE OR REPLACE FUNCTION notify_task_change()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'task_update',
    json_build_object(
      'task_id', NEW.id,
      'title', NEW.title,
      'assigned_to', NEW.assigned_to,
      'status', NEW.status,
      'priority', NEW.priority,
      'updated_at', NEW.updated_at
    )::text
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tasks_broadcast
AFTER INSERT OR UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION notify_task_change();
