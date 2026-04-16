import { TaskList } from '@/components/tasks/task-list';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function TasksPage() {
  const supabase = await createClient();

  // Fetch tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  // Fetch agents (Stella first, then alphabetical)
  const { data: agents } = await supabase
    .from('agents')
    .select('*')
    .order('name');

  const sortedAgents = (agents || []).slice().sort((a, b) => {
    if (a.name === 'Stella') return -1;
    if (b.name === 'Stella') return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div>
      <TaskList initialTasks={tasks || []} agents={sortedAgents} />
    </div>
  );
}
