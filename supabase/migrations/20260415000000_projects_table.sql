-- Create projects table for tracking workstreams across the agent org
CREATE TABLE public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planning'
    CHECK (status IN ('planning', 'active', 'paused', 'complete')),
  priority TEXT DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  owner_agent_id UUID REFERENCES public.agents(id),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  repo_url TEXT,
  live_url TEXT,
  stack TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_projects_status ON public.projects(status);

CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION update_projects_updated_at();

-- Seed current projects
INSERT INTO public.projects (name, description, status, priority, progress, live_url, stack) VALUES
  ('Mission Control', 'Command center dashboard for agent team', 'active', 'high', 70, 'skylark-mission-control.vercel.app', ARRAY['Next.js', 'Supabase', 'Tailwind', 'shadcn/ui']),
  ('Skylark Nexus', 'Shared memory and knowledge base for agent team', 'active', 'high', 85, NULL, ARRAY['Python', 'FastMCP', 'Supabase', 'pgvector']),
  ('Skylark Care Board', 'Family connection app for elderly/dementia users', 'paused', 'high', 75, 'skylark-care-board.vercel.app', ARRAY['React', 'Supabase', 'Azure TTS']),
  ('Skylark Scholar', 'AI scholarship essay writing studio', 'paused', 'medium', 60, 'skylarkscholar.com', ARRAY['React', 'Vite', 'Supabase']),
  ('Signal Stream', 'Social signal monitoring for B2B leads', 'paused', 'medium', 20, NULL, ARRAY['Next.js', 'Supabase', 'Claude API']);
