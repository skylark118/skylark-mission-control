import { TaskList } from '@/components/tasks/task-list';
import { TaskStatsCards } from '@/components/dashboard/task-stats-cards';
import { mcClient } from '@/lib/supabase/clients';
import type { Agent, Task, Project } from '@/types';

export const dynamic = 'force-dynamic';

export default async function TasksPage() {
  const supabase = mcClient();

  const [{ data: tasks }, { data: agents }, { data: projects }] = await Promise.all([
    supabase.from('tasks').select('*').order('created_at', { ascending: false }),
    supabase.from('agents').select('*').order('name'),
    supabase.from('projects').select('id, name'),
  ]);

  const allTasks = (tasks as Task[]) || [];
  const sortedAgents = ((agents as Agent[]) || []).slice().sort((a, b) => {
    if (a.name === 'Stella') return -1;
    if (b.name === 'Stella') return 1;
    return a.name.localeCompare(b.name);
  });
  const projectMap = ((projects as Pick<Project, 'id' | 'name'>[]) || []).reduce(
    (acc, p) => {
      acc[p.id] = p.name;
      return acc;
    },
    {} as Record<string, string>
  );

  return (
    <div className="space-y-6">
      <TaskStatsCards initialTasks={allTasks} />
      <TaskList initialTasks={allTasks} agents={sortedAgents} projectNames={projectMap} />
    </div>
  );
}
