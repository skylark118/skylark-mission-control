'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Task, Agent, TaskStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentAvatar } from '@/components/agent-avatar';
import { formatDistanceToNow, format } from 'date-fns';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskListProps {
  initialTasks: Task[];
  agents: Agent[];
  projectNames?: Record<string, string>;
}

const statusConfig: Record<TaskStatus, { label: string; dot: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  pending: { label: 'Pending', dot: 'bg-muted-foreground', variant: 'secondary' },
  in_progress: { label: 'In Progress', dot: 'bg-skylark-blue', variant: 'default' },
  review: { label: 'Review', dot: 'bg-skylark-orange', variant: 'outline' },
  complete: { label: 'Complete', dot: 'bg-emerald-500', variant: 'outline' },
  blocked: { label: 'Blocked', dot: 'bg-red-500', variant: 'destructive' },
};

const priorityConfig = {
  low: { label: 'Low', className: 'text-muted-foreground border-muted-foreground/30' },
  medium: { label: 'Medium', className: 'text-skylark-blue border-skylark-blue/40' },
  high: { label: 'High', className: 'text-skylark-orange border-skylark-orange/40' },
  urgent: { label: 'Urgent', className: 'text-red-500 border-red-500/40' },
};

const activeGroupOrder: TaskStatus[] = ['blocked', 'in_progress', 'review', 'pending'];

const taskTypeStyle: Record<string, { label: string; className: string }> = {
  project: { label: 'Project', className: 'bg-skylark-blue/10 text-skylark-blue border-skylark-blue/30' },
  ad_hoc: { label: 'Ad hoc', className: 'bg-skylark-sand/30 text-skylark-slate border-skylark-sand' },
  routine: { label: 'Routine', className: 'bg-skylark-sky/25 text-skylark-slate border-skylark-sky' },
};

export function TaskList({ initialTasks, agents, projectNames = {} }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [supabase] = useState(() => createClient());
  const [historyDays, setHistoryDays] = useState(7);

  useEffect(() => {
    const channel = supabase
      .channel('tasks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks((prev) => [payload.new as Task, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks((prev) =>
              prev.map((t) => (t.id === payload.new.id ? (payload.new as Task) : t))
            );
          } else if (payload.eventType === 'DELETE') {
            setTasks((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const agentMap = useMemo(
    () =>
      agents.reduce((acc, a) => {
        acc[a.id] = a;
        return acc;
      }, {} as Record<string, Agent>),
    [agents]
  );

  const activeTasks = useMemo(() => {
    const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    return tasks
      .filter((t) => t.status !== 'complete')
      .sort((a, b) => {
        const pa = priorityOrder[a.priority] ?? 99;
        const pb = priorityOrder[b.priority] ?? 99;
        if (pa !== pb) return pa - pb;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [tasks]);

  const activeByStatus = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = {
      pending: [],
      in_progress: [],
      review: [],
      complete: [],
      blocked: [],
    };
    for (const t of activeTasks) groups[t.status].push(t);
    return groups;
  }, [activeTasks]);

  const historyTasks = useMemo(() => {
    const since = Date.now() - historyDays * 24 * 60 * 60 * 1000;
    return tasks
      .filter((t) => t.status === 'complete' && new Date(t.updated_at).getTime() >= since)
      .sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
  }, [tasks, historyDays]);

  return (
    <Tabs defaultValue="active" className="w-full">
      <TabsList>
        <TabsTrigger value="active">
          Active
          {activeTasks.length > 0 && (
            <span className="ml-1.5 rounded-full bg-foreground/10 px-1.5 text-xs">
              {activeTasks.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>

      <TabsContent value="active" className="mt-6">
        {activeTasks.length === 0 ? (
          <EmptyCard message="No active tasks" />
        ) : (
          <div className="space-y-6">
            {activeGroupOrder.map((status) => {
              const group = activeByStatus[status];
              if (group.length === 0) return null;
              const cfg = statusConfig[status];
              return (
                <section key={status} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      {cfg.label}
                    </h2>
                    <span className="text-xs text-muted-foreground">({group.length})</span>
                  </div>
                  <div className="space-y-2">
                    {group.map((task) => (
                      <ActiveTaskCard
                        key={task.id}
                        task={task}
                        agent={task.assigned_to ? agentMap[task.assigned_to] : null}
                        projectName={task.project_id ? projectNames[task.project_id] : null}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </TabsContent>

      <TabsContent value="history" className="mt-6">
        {historyTasks.length === 0 ? (
          <EmptyCard message={`No completed tasks in the last ${historyDays} days`} />
        ) : (
          <div className="space-y-3">
            {historyTasks.map((task) => (
              <HistoryTaskCard
                key={task.id}
                task={task}
                agent={task.assigned_to ? agentMap[task.assigned_to] : null}
                projectName={task.project_id ? projectNames[task.project_id] : null}
              />
            ))}
          </div>
        )}
        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHistoryDays((d) => (d >= 90 ? d : d === 7 ? 30 : 90))}
            disabled={historyDays >= 90}
          >
            {historyDays >= 90 ? 'Showing last 90 days' : `Load older (last ${historyDays === 7 ? 30 : 90} days)`}
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
}

function EmptyCard({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center text-muted-foreground">{message}</CardContent>
    </Card>
  );
}

function ActiveTaskCard({ task, agent, projectName }: { task: Task; agent: Agent | null; projectName: string | null }) {
  const statusConf = statusConfig[task.status];
  const priorityConf = priorityConfig[task.priority];
  const isBlocked = task.status === 'blocked';
  const typeConf = taskTypeStyle[task.task_type] ?? taskTypeStyle.ad_hoc;

  return (
    <Card className={isBlocked ? 'border-red-500/40' : undefined}>
      <CardContent className="flex items-start gap-4 p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold truncate">{task.title}</h3>
            <Badge variant={statusConf.variant}>{statusConf.label}</Badge>
          </div>

          {task.description && (
            <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {agent && (
              <div className="flex items-center gap-1.5">
                <AgentAvatar name={agent.name} size="sm" />
                <span className="font-medium text-foreground/80">{agent.name}</span>
              </div>
            )}
            <Badge variant="outline" className={priorityConf.className}>
              {priorityConf.label}
            </Badge>
            <span className={cn('rounded-full border px-1.5 py-0.5 text-[10px] font-medium', typeConf.className)}>
              {typeConf.label}
            </span>
            {projectName && (
              <span className="font-medium text-skylark-blue">{projectName}</span>
            )}
            <span>
              {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
            </span>
          </div>

          {isBlocked && task.result && (
            <div className="mt-3 rounded-md border border-red-500/30 bg-red-500/5 p-3 text-sm">
              <p className="font-medium text-red-600">Blocked:</p>
              <p className="mt-1 text-muted-foreground">{task.result}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function HistoryTaskCard({ task, agent, projectName }: { task: Task; agent: Agent | null; projectName: string | null }) {
  const [expanded, setExpanded] = useState(false);
  const priorityConf = priorityConfig[task.priority];
  const typeConf = taskTypeStyle[task.task_type] ?? taskTypeStyle.ad_hoc;
  const hasResult = Boolean(task.result);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold truncate">{task.title}</h3>
          <Badge variant="outline" className="border-emerald-500/40 text-emerald-600">
            Complete
          </Badge>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {agent && (
            <div className="flex items-center gap-1.5">
              <AgentAvatar name={agent.name} size="sm" className="h-5 w-5 [&>svg]:h-3 [&>svg]:w-3" />
              <span className="font-medium text-foreground/80">{agent.name}</span>
            </div>
          )}
          <Badge variant="outline" className={priorityConf.className}>
            {priorityConf.label}
          </Badge>
          <span className={cn('rounded-full border px-1.5 py-0.5 text-[10px] font-medium', typeConf.className)}>
            {typeConf.label}
          </span>
          {projectName && (
            <span className="font-medium text-skylark-blue">{projectName}</span>
          )}
          <span>completed {format(new Date(task.updated_at), 'MMM d, h:mm a')}</span>
        </div>

        {hasResult && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-skylark-blue hover:underline"
          >
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            {expanded ? 'Hide result' : 'Show result'}
          </button>
        )}

        {expanded && task.result && (
          <div className="mt-2 rounded-md bg-muted p-3 text-sm text-muted-foreground whitespace-pre-wrap">
            {task.result}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
