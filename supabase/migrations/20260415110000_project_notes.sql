-- Project notes: sprint plans, decisions, retros, standups
CREATE TABLE public.project_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES public.milestones(id),
  author_agent_id UUID REFERENCES public.agents(id),
  note_type TEXT DEFAULT 'note'
    CHECK (note_type IN ('plan', 'decision', 'note', 'retro', 'standup')),
  title TEXT,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_project_notes_project ON public.project_notes(project_id, created_at DESC);
CREATE INDEX idx_project_notes_milestone ON public.project_notes(milestone_id) WHERE milestone_id IS NOT NULL;
CREATE INDEX idx_project_notes_type ON public.project_notes(note_type);
