'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Task, Agent, TaskStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { DropdownMenu } from '@/components/ui/dropdown-menu';

interface TaskListProps {
  initialTasks: Task[];
  agents: Agent[];
}

const statusConfig = {
  pending: { label: 'Pending', variant: 'secondary' as const, color: 'text-gray-500' },
  in_progress: { label: 'In Progress', variant: 'default' as const, color: 'text-blue-500' },
  review: { label: 'Review', variant: 'outline' as const, color: 'text-amber-500' },
  complete: { label: 'Complete', variant: 'outline' as const, color: 'text-green-500' },
  blocked: { label: 'Blocked', variant: 'destructive' as const, color: 'text-red-500' },
};

const priorityConfig = {
  low: { label: 'Low', color: 'text-gray-400' },
  medium: { label: 'Medium', color: 'text-blue-400' },
  high: { label: 'High', color: 'text-orange-400' },
  urgent: { label: 'Urgent', color: 'text-red-400' },
};

export function TaskList({ initialTasks, agents }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'all'>('all');
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    const channel = supabase
      .channel('tasks')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks((prev) => [payload.new as Task, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks((prev) =>
              prev.map((task) =>
                task.id === payload.new.id ? (payload.new as Task) : task
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setTasks((prev) => prev.filter((task) => task.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const agentMap = agents.reduce((acc, agent) => {
    acc[agent.id] = agent;
    return acc;
  }, {} as Record<string, Agent>);

  const filteredTasks = tasks.filter((task) => {
    if (selectedAgent !== 'all' && task.assigned_to !== selectedAgent) {
      return false;
    }
    if (selectedStatus !== 'all' && task.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Agent</label>
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Agents</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.avatar_emoji} {agent.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">Status</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as TaskStatus | 'all')}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="complete">Complete</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No tasks found
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => {
            const agent = task.assigned_to ? agentMap[task.assigned_to] : null;
            const statusConf = statusConfig[task.status];
            const priorityConf = priorityConfig[task.priority];

            return (
              <Card key={task.id}>
                <CardContent className="flex items-start gap-4 p-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold">{task.title}</h3>
                      <Badge variant={statusConf.variant}>
                        {statusConf.label}
                      </Badge>
                    </div>

                    {task.description && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {task.description}
                      </p>
                    )}

                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                      {agent && (
                        <div className="flex items-center gap-1">
                          <span>{agent.avatar_emoji}</span>
                          <span>{agent.name}</span>
                        </div>
                      )}
                      <span className={priorityConf.color}>
                        {priorityConf.label} priority
                      </span>
                      <span>
                        {formatDistanceToNow(new Date(task.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>

                    {task.result && (
                      <div className="mt-3 rounded-md bg-muted p-3 text-sm">
                        <p className="font-medium">Result:</p>
                        <p className="mt-1 text-muted-foreground">{task.result}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
