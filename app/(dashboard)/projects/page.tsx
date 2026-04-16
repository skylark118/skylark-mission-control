import { mcClient } from '@/lib/supabase/clients';
import type { Agent, Project, ProjectStatus } from '@/types';
import { ProjectCard } from '@/components/projects/project-card';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const supabase = mcClient();
  const [{ data: projects }, { data: agents }] = await Promise.all([
    supabase
      .from('projects')
      .select('*')
      .order('status', { ascending: true })
      .order('priority', { ascending: true })
      .order('updated_at', { ascending: false }),
    supabase.from('agents').select('*'),
  ]);

  const allProjects = (projects as Project[]) || [];
  const allAgents = (agents as Agent[]) || [];
  const agentMap = allAgents.reduce((acc, a) => {
    acc[a.id] = a;
    return acc;
  }, {} as Record<string, Agent>);

  const counts = allProjects.reduce(
    (acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      acc.total++;
      return acc;
    },
    { total: 0, planning: 0, active: 0, paused: 0, complete: 0 } as Record<
      'total' | ProjectStatus,
      number
    >
  );

  return (
    <div>
      {allProjects.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No projects yet.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {allProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              owner={project.owner_agent_id ? agentMap[project.owner_agent_id] : null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
