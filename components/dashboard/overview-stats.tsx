'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import type { Task } from '@/types';
import {
  Users,
  ListTodo,
  AlertOctagon,
  Lightbulb,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OverviewStatsProps {
  agentCount: number;
  initialTasks: Task[];
  learningCount: number;
}

export function OverviewStats({
  agentCount,
  initialTasks,
  learningCount,
}: OverviewStatsProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    const channel = supabase
      .channel('overview-stats-tasks')
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

  const counts = useMemo(() => {
    let pending = 0;
    let inProgress = 0;
    let blocked = 0;
    for (const t of tasks) {
      if (t.status === 'pending') pending++;
      else if (t.status === 'in_progress') inProgress++;
      else if (t.status === 'blocked') blocked++;
    }
    return { pending, inProgress, blocked, active: pending + inProgress };
  }, [tasks]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={Users}
        label="Agents"
        value={agentCount}
        context="On the team"
        tone="blue"
      />
      <StatCard
        icon={ListTodo}
        label="Active Tasks"
        value={counts.active}
        context={`${counts.pending} pending · ${counts.inProgress} in progress`}
        tone="blue"
      />
      <StatCard
        icon={AlertOctagon}
        label="Blocked"
        value={counts.blocked}
        context={counts.blocked > 0 ? 'Requires attention' : 'All clear'}
        tone={counts.blocked > 0 ? 'danger' : 'neutral'}
      />
      <StatCard
        icon={Lightbulb}
        label="Learnings"
        value={learningCount}
        context="Shared by the team"
        tone="accent"
      />
    </div>
  );
}

type Tone = 'blue' | 'accent' | 'danger' | 'neutral';

const toneStyles: Record<Tone, { iconBg: string; iconText: string; valueText: string }> = {
  blue: {
    iconBg: 'bg-skylark-sky/25',
    iconText: 'text-skylark-blue',
    valueText: 'text-skylark-slate',
  },
  accent: {
    iconBg: 'bg-skylark-orange/15',
    iconText: 'text-skylark-orange',
    valueText: 'text-skylark-slate',
  },
  danger: {
    iconBg: 'bg-red-500/10',
    iconText: 'text-red-600',
    valueText: 'text-red-600',
  },
  neutral: {
    iconBg: 'bg-skylark-sand/25',
    iconText: 'text-skylark-slate-light',
    valueText: 'text-skylark-slate',
  },
};

function StatCard({
  icon: Icon,
  label,
  value,
  context,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  context: string;
  tone: Tone;
}) {
  const s = toneStyles[tone];
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-9 w-9 flex-none items-center justify-center rounded-lg',
              s.iconBg
            )}
          >
            <Icon className={cn('h-4 w-4', s.iconText)} strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className={cn('mt-1 text-3xl font-light leading-none', s.valueText)}>
              {value}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{context}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
