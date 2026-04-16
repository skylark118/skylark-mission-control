-- Milestones: time-boxed or goal-boxed groupings within a project
CREATE TABLE public.milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planning'
    CHECK (status IN ('planning', 'active', 'complete')),
  target_date DATE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_milestones_project ON public.milestones(project_id, status);

CREATE OR REPLACE FUNCTION update_milestones_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER milestones_updated_at
BEFORE UPDATE ON public.milestones
FOR EACH ROW EXECUTE FUNCTION update_milestones_updated_at();

-- Link tasks to projects, milestones, and scheduled routines
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id),
  ADD COLUMN IF NOT EXISTS milestone_id UUID REFERENCES public.milestones(id),
  ADD COLUMN IF NOT EXISTS task_type TEXT DEFAULT 'ad_hoc'
    CHECK (task_type IN ('project', 'ad_hoc', 'routine')),
  ADD COLUMN IF NOT EXISTS scheduled_task_id UUID REFERENCES public.scheduled_tasks(id);

CREATE INDEX idx_tasks_project ON public.tasks(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX idx_tasks_milestone ON public.tasks(milestone_id) WHERE milestone_id IS NOT NULL;
CREATE INDEX idx_tasks_type ON public.tasks(task_type);

-- Seed milestones for active projects
INSERT INTO public.milestones (project_id, name, description, status, sort_order) VALUES
  (
    (SELECT id FROM projects WHERE name = 'Mission Control'),
    'Phase 1: Foundation',
    'Activity feed, agent status cards, task queue, webhook API',
    'complete', 1
  ),
  (
    (SELECT id FROM projects WHERE name = 'Mission Control'),
    'Phase 2: Full Dashboard',
    'All 7 pages, dual Supabase, Nexus integration, Skylark design system',
    'active', 2
  ),
  (
    (SELECT id FROM projects WHERE name = 'Skylark Nexus'),
    'Core MCP Server',
    'FastMCP server with search, share, document tools',
    'complete', 1
  ),
  (
    (SELECT id FROM projects WHERE name = 'Skylark Nexus'),
    'Knowledge Graph',
    'pgvector embeddings, semantic search, cross-agent synthesis',
    'active', 2
  );
