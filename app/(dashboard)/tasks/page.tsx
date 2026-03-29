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

  // Fetch agents
  const { data: agents } = await supabase
    .from('agents')
    .select('*')
    .order('name');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tasks</h1>
        <p className="text-muted-foreground">
          Manage and track agent task assignments
        </p>
      </div>

      <TaskList initialTasks={tasks || []} agents={agents || []} />
    </div>
  );
}
