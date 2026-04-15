'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import type { Task } from '@/types';
import { Activity, AlertOctagon, CheckCircle2, CalendarCheck, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskStatsCardsProps {
  initialTasks: Task[];
}

interface Stats {
  pending: number;
  inProgress: number;
  blocked: number;
  completedToday: number;
  completedWeek: number;
}

function computeStats(tasks: Task[]): Stats {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfWeek = Date.now() - 7 * 24 * 60 * 60 * 1000;

  let pending = 0;
  let inProgress = 0;
  let blocked = 0;
  let completedToday = 0;
  let completedWeek = 0;

  for (const t of tasks) {
    if (t.status === 'pending') pending++;
    else if (t.status === 'in_progress') inProgress++;
    else if (t.status === 'blocked') blocked++;
    else if (t.status === 'complete') {
      const updated = new Date(t.updated_at).getTime();
      if (updated >= startOfToday.getTime()) completedToday++;
      if (updated >= startOfWeek) completedWeek++;
    }
  }

  return { pending, inProgress, blocked, completedToday, completedWeek };
}

export function TaskStatsCards({ initialTasks }: TaskStatsCardsProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    const channel = supabase
      .channel('task-stats')
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

  const stats = useMemo(() => computeStats(tasks), [tasks]);
  const active = stats.pending + stats.inProgress;
  const weeklyAvg = (stats.completedWeek / 7).toFixed(1);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={Activity}
        label="Active"
        value={active}
        context={`${stats.pending} pending · ${stats.inProgress} in progress`}
        tone="blue"
      />
      <StatCard
        icon={AlertOctagon}
        label="Blocked"
        value={stats.blocked}
        context={stats.blocked > 0 ? 'Requires attention' : 'All clear'}
        tone={stats.blocked > 0 ? 'danger' : 'neutral'}
      />
      <StatCard
        icon={CheckCircle2}
        label="Completed Today"
        value={stats.completedToday}
        context="Last 24 hours"
        tone="accent"
      />
      <StatCard
        icon={CalendarCheck}
        label="Completed This Week"
        value={stats.completedWeek}
        context={`${weeklyAvg} per day average`}
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
