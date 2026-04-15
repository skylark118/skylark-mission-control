import { Card, CardContent } from '@/components/ui/card';
import type { ScheduledTask, ScheduledTaskCategory } from '@/types';
import { Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarWeekViewProps {
  tasks: ScheduledTask[];
}

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const categoryStyle: Record<
  ScheduledTaskCategory,
  { bg: string; border: string; text: string; dot: string }
> = {
  briefing: {
    bg: 'bg-skylark-blue/10',
    border: 'border-skylark-blue/40',
    text: 'text-skylark-blue',
    dot: 'bg-skylark-blue',
  },
  research: {
    bg: 'bg-skylark-orange/10',
    border: 'border-skylark-orange/40',
    text: 'text-skylark-orange',
    dot: 'bg-skylark-orange',
  },
  content: {
    bg: 'bg-skylark-sky/25',
    border: 'border-skylark-sky',
    text: 'text-skylark-slate',
    dot: 'bg-skylark-sky',
  },
  maintenance: {
    bg: 'bg-skylark-sand/25',
    border: 'border-skylark-sand',
    text: 'text-skylark-slate',
    dot: 'bg-skylark-sand',
  },
  general: {
    bg: 'bg-muted',
    border: 'border-border',
    text: 'text-muted-foreground',
    dot: 'bg-muted-foreground',
  },
};

interface ParsedSchedule {
  type: 'always' | 'weekly' | 'other';
  days?: number[]; // 0=Sun..6=Sat
  time?: string;
}

function parseCron(expr: string): ParsedSchedule {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return { type: 'other' };
  const [minute, hour, dom, month, dow] = parts;

  // Sub-daily: interval minutes (*/N), interval hours, or "every hour"
  if (minute.startsWith('*/') || minute === '*' || hour.startsWith('*/') || hour === '*') {
    return { type: 'always' };
  }

  if (dom !== '*' || month !== '*') return { type: 'other' };

  const minuteN = parseInt(minute, 10);
  const hourN = parseInt(hour, 10);
  if (Number.isNaN(minuteN) || Number.isNaN(hourN)) return { type: 'other' };

  // Daily (dow === '*') — treat as "Always Running" for the daily row
  if (dow === '*') {
    return { type: 'always' };
  }

  // Weekly on specific day(s)
  const days = dow
    .split(',')
    .map((d) => parseInt(d, 10))
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
  if (days.length === 0) return { type: 'other' };

  const time = formatTime(hourN, minuteN);
  return { type: 'weekly', days, time };
}

function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'pm' : 'am';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const mm = minute.toString().padStart(2, '0');
  return minute === 0 ? `${displayHour}${period}` : `${displayHour}:${mm}${period}`;
}

export function CalendarWeekView({ tasks }: CalendarWeekViewProps) {
  const alwaysRunning: ScheduledTask[] = [];
  const byDay: ScheduledTask[][] = [[], [], [], [], [], [], []];
  const other: ScheduledTask[] = [];

  for (const task of tasks) {
    const parsed = parseCron(task.schedule);
    if (parsed.type === 'always') {
      alwaysRunning.push(task);
    } else if (parsed.type === 'weekly' && parsed.days) {
      for (const d of parsed.days) byDay[d].push(task);
    } else {
      other.push(task);
    }
  }

  // Sort each day column by time
  for (const col of byDay) {
    col.sort((a, b) => {
      const at = parseCron(a.schedule).time ?? '';
      const bt = parseCron(b.schedule).time ?? '';
      return at.localeCompare(bt);
    });
  }

  return (
    <div className="space-y-6">
      {alwaysRunning.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-skylark-orange" strokeWidth={1.75} />
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Always Running
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {alwaysRunning.map((t) => (
              <AlwaysPill key={t.id} task={t} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          This Week
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
          {dayLabels.map((label, dayIdx) => (
            <div key={label} className="space-y-2">
              <p className="px-1 text-xs font-semibold text-foreground">{label}</p>
              <div className="min-h-[120px] space-y-2">
                {byDay[dayIdx].length === 0 ? (
                  <p className="rounded-md border border-dashed border-border px-2 py-3 text-center text-[11px] text-muted-foreground">
                    —
                  </p>
                ) : (
                  byDay[dayIdx].map((task) => (
                    <TaskBlock key={task.id} task={task} />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {other.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Other Schedules
          </h2>
          <div className="space-y-2">
            {other.map((task) => (
              <Card key={task.id}>
                <CardContent className="flex items-center justify-between gap-3 p-3">
                  <div>
                    <p className="text-sm font-medium">{task.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.schedule_human || task.schedule}
                    </p>
                  </div>
                  <CategoryPill category={task.category} />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function TaskBlock({ task }: { task: ScheduledTask }) {
  const s = categoryStyle[task.category];
  const parsed = parseCron(task.schedule);
  const time = parsed.time ?? task.schedule_human ?? '';
  const paused = task.status !== 'active';

  return (
    <div
      className={cn(
        'rounded-md border px-2 py-1.5 transition-opacity',
        s.bg,
        s.border,
        paused && 'opacity-50'
      )}
    >
      <p className={cn('text-[11px] font-semibold', s.text)}>{time}</p>
      <p className="mt-0.5 text-xs leading-snug text-foreground">{task.name}</p>
    </div>
  );
}

function AlwaysPill({ task }: { task: ScheduledTask }) {
  const s = categoryStyle[task.category];
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium',
        s.bg,
        s.border,
        s.text
      )}
    >
      <Clock className="h-3 w-3" strokeWidth={1.75} />
      <span>{task.name}</span>
      <span className="text-foreground/60">· {task.schedule_human || task.schedule}</span>
    </div>
  );
}

function CategoryPill({ category }: { category: ScheduledTaskCategory }) {
  const s = categoryStyle[category];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize',
        s.bg,
        s.border,
        s.text
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
      {category}
    </span>
  );
}
