import { mcClient } from '@/lib/supabase/clients';
import type { Agent, Project, Milestone, Task } from '@/types';
import { ProjectCard } from '@/components/projects/project-card';
import { ProjectDetail } from '@/components/projects/project-detail';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const supabase = mcClient();
  const [{ data: projects }, { data: agents }, { data: milestones }, { data: tasks }] =
    await Promise.all([
      supabase
        .from('projects')
        .select('*')
        .order('status', { ascending: true })
        .order('priority', { ascending: true })
        .order('updated_at', { ascending: false }),
      supabase.from('agents').select('*'),
      supabase
        .from('milestones')
        .select('*')
        .order('sort_order', { ascending: true }),
      supabase
        .from('tasks')
        .select('*')
        .not('project_id', 'is', null)
        .order('updated_at', { ascending: false }),
    ]);

  const allProjects = (projects as Project[]) || [];
  const allAgents = (agents as Agent[]) || [];
  const allMilestones = (milestones as Milestone[]) || [];
  const allTasks = (tasks as Task[]) || [];

  const agentMap = allAgents.reduce((acc, a) => {
    acc[a.id] = a;
    return acc;
  }, {} as Record<string, Agent>);

  const milestonesByProject: Record<string, Milestone[]> = {};
  for (const m of allMilestones) {
    (milestonesByProject[m.project_id] ??= []).push(m);
  }

  const tasksByProject: Record<string, Task[]> = {};
  const tasksByMilestone: Record<string, Task[]> = {};
  for (const t of allTasks) {
    if (t.project_id) (tasksByProject[t.project_id] ??= []).push(t);
    if (t.milestone_id) (tasksByMilestone[t.milestone_id] ??= []).push(t);
  }

  return (
    <div className="space-y-8">
      {allProjects.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No projects yet.
        </p>
      ) : (
        allProjects.map((project) => (
          <ProjectDetail
            key={project.id}
            project={project}
            owner={project.owner_agent_id ? agentMap[project.owner_agent_id] : null}
            milestones={milestonesByProject[project.id] || []}
            tasks={tasksByProject[project.id] || []}
            tasksByMilestone={tasksByMilestone}
            agentMap={agentMap}
          />
        ))
      )}
    </div>
  );
}
