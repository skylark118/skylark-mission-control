'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AgentAvatar } from '@/components/agent-avatar';
import type { Agent, Milestone, Project, ProjectNote, Task } from '@/types';
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Github,
  Target,
  FileText,
  Lightbulb,
  ClipboardList,
  RotateCcw,
  MessageSquare,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface ProjectDetailProps {
  project: Project;
  owner: Agent | null;
  milestones: Milestone[];
  tasks: Task[];
  tasksByMilestone: Record<string, Task[]>;
  notes: ProjectNote[];
  agentMap: Record<string, Agent>;
}

const noteTypeConfig: Record<
  ProjectNote['note_type'],
  { label: string; icon: typeof FileText; className: string }
> = {
  plan: { label: 'Plan', icon: ClipboardList, className: 'bg-skylark-blue/10 text-skylark-blue border-skylark-blue/30' },
  decision: { label: 'Decision', icon: Lightbulb, className: 'bg-skylark-orange/10 text-skylark-orange border-skylark-orange/30' },
  note: { label: 'Note', icon: FileText, className: 'bg-skylark-sand/25 text-skylark-slate border-skylark-sand' },
  retro: { label: 'Retro', icon: RotateCcw, className: 'bg-skylark-sky/25 text-skylark-slate border-skylark-sky' },
  standup: { label: 'Standup', icon: MessageSquare, className: 'bg-muted text-muted-foreground border-border' },
};

const projectStatusStyle: Record<
  Project['status'],
  { label: string; className: string; dot: string }
> = {
  active: {
    label: 'Active',
    className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700',
    dot: 'bg-emerald-500',
  },
  paused: {
    label: 'Paused',
    className: 'border-skylark-orange/40 bg-skylark-orange/10 text-skylark-orange',
    dot: 'bg-skylark-orange',
  },
  planning: {
    label: 'Planning',
    className: 'border-skylark-blue/40 bg-skylark-blue/10 text-skylark-blue',
    dot: 'bg-skylark-blue',
  },
  complete: {
    label: 'Complete',
    className: 'border-skylark-slate/30 bg-skylark-slate/10 text-skylark-slate',
    dot: 'bg-skylark-slate',
  },
};

const milestoneStatusStyle: Record<
  Milestone['status'],
  { label: string; dot: string }
> = {
  planning: { label: 'Planning', dot: 'border border-skylark-blue bg-transparent' },
  active: { label: 'Active', dot: 'bg-emerald-500' },
  complete: { label: 'Complete', dot: 'bg-skylark-slate' },
};

const taskStatusStyle: Record<Task['status'], string> = {
  pending: 'text-muted-foreground border-muted-foreground/30',
  in_progress: 'text-skylark-blue border-skylark-blue/40',
  review: 'text-skylark-orange border-skylark-orange/40',
  complete: 'text-emerald-700 border-emerald-500/40',
  blocked: 'text-red-600 border-red-500/40',
};

export function ProjectDetail({
  project,
  owner,
  milestones,
  tasks,
  tasksByMilestone,
  notes,
  agentMap,
}: ProjectDetailProps) {
  const [expanded, setExpanded] = useState(project.status === 'active');
  const ps = projectStatusStyle[project.status];

  const ungroupedTasks = tasks.filter(
    (t) => !t.milestone_id
  );

  const taskCounts = tasks.reduce(
    (acc, t) => {
      if (t.status === 'complete') acc.done++;
      else acc.open++;
      return acc;
    },
    { open: 0, done: 0 }
  );

  return (
    <Card>
      <CardContent className="p-0">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-start gap-4 p-5 text-left transition-colors hover:bg-muted/30"
        >
          <div className="mt-0.5 text-muted-foreground">
            {expanded ? (
              <ChevronDown className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-base font-semibold">{project.name}</h2>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
                  ps.className
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', ps.dot)} />
                {ps.label}
              </span>
            </div>

            {project.description && (
              <p className="text-sm text-muted-foreground">{project.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-full max-w-[80px] overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      project.status === 'active' ? 'bg-skylark-blue' : 'bg-skylark-orange'
                    )}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                <span className="font-medium text-foreground">{project.progress}%</span>
              </div>

              {milestones.length > 0 && (
                <span>{milestones.length} {milestones.length === 1 ? 'milestone' : 'milestones'}</span>
              )}

              {tasks.length > 0 && (
                <span>
                  {taskCounts.open} open · {taskCounts.done} done
                </span>
              )}

              {owner && (
                <div className="flex items-center gap-1">
                  <AgentAvatar name={owner.name} size="sm" className="h-4 w-4 [&>svg]:h-2.5 [&>svg]:w-2.5" />
                  <span>{owner.name}</span>
                </div>
              )}
            </div>
          </div>
        </button>

        {expanded && (
          <div className="border-t px-5 pb-5 pt-4 space-y-6">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {project.stack?.map((tech) => (
                <span
                  key={tech}
                  className="rounded-md bg-skylark-sand/25 px-2 py-0.5 font-medium text-skylark-slate"
                >
                  {tech}
                </span>
              ))}
              {project.live_url && (
                <Link
                  href={project.live_url.startsWith('http') ? project.live_url : `https://${project.live_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-skylark-blue hover:underline"
                >
                  <ExternalLink className="h-3 w-3" strokeWidth={1.75} />
                  Live
                </Link>
              )}
              {project.repo_url && (
                <Link
                  href={project.repo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-skylark-blue hover:underline"
                >
                  <Github className="h-3 w-3" strokeWidth={1.75} />
                  Repo
                </Link>
              )}
            </div>

            {milestones.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Milestones
                </h3>
                {milestones.map((milestone) => {
                  const mTasks = tasksByMilestone[milestone.id] || [];
                  const ms = milestoneStatusStyle[milestone.status];
                  const done = mTasks.filter((t) => t.status === 'complete').length;
                  const pct = mTasks.length > 0 ? Math.round((done / mTasks.length) * 100) : 0;
                  return (
                    <div
                      key={milestone.id}
                      className="rounded-lg border bg-card p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Target className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                          <span className="text-sm font-medium">{milestone.name}</span>
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <span className={cn('h-1.5 w-1.5 rounded-full', ms.dot)} />
                            {ms.label}
                          </span>
                        </div>
                        {mTasks.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {done}/{mTasks.length} · {pct}%
                          </span>
                        )}
                      </div>
                      {milestone.description && (
                        <p className="text-xs text-muted-foreground">{milestone.description}</p>
                      )}
                      {mTasks.length > 0 && (
                        <div className="space-y-1 pt-1">
                          {mTasks.map((t) => (
                            <TaskRow key={t.id} task={t} agentMap={agentMap} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {ungroupedTasks.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Tasks
                </h3>
                <div className="space-y-1">
                  {ungroupedTasks.map((t) => (
                    <TaskRow key={t.id} task={t} agentMap={agentMap} />
                  ))}
                </div>
              </div>
            )}

            {notes.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Notes
                </h3>
                <div className="space-y-2">
                  {notes.map((note) => (
                    <NoteCard key={note.id} note={note} agentMap={agentMap} />
                  ))}
                </div>
              </div>
            )}

            {milestones.length === 0 && ungroupedTasks.length === 0 && notes.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No milestones, tasks, or notes linked yet.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TaskRow({
  task,
  agentMap,
}: {
  task: Task;
  agentMap: Record<string, Agent>;
}) {
  const agent = task.assigned_to ? agentMap[task.assigned_to] : null;
  return (
    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted/30">
      {agent && (
        <AgentAvatar name={agent.name} size="sm" className="h-5 w-5 [&>svg]:h-3 [&>svg]:w-3" />
      )}
      <span className="min-w-0 flex-1 truncate text-foreground">{task.title}</span>
      <span
        className={cn(
          'flex-none rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize',
          taskStatusStyle[task.status]
        )}
      >
        {task.status.replace('_', ' ')}
      </span>
      <span className="flex-none text-muted-foreground">
        {formatDistanceToNow(new Date(task.updated_at), { addSuffix: true })}
      </span>
    </div>
  );
}

function NoteCard({
  note,
  agentMap,
}: {
  note: ProjectNote;
  agentMap: Record<string, Agent>;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = noteTypeConfig[note.note_type] ?? noteTypeConfig.note;
  const Icon = config.icon;
  const agent = note.author_agent_id ? agentMap[note.author_agent_id] : null;
  const isLong = note.content.length > 180;
  const preview = isLong && !expanded ? note.content.slice(0, 180) + '…' : note.content;

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
              config.className
            )}
          >
            <Icon className="h-3 w-3" strokeWidth={1.75} />
            {config.label}
          </span>
          {note.title && (
            <span className="text-sm font-medium">{note.title}</span>
          )}
        </div>
        <span className="flex-none text-[11px] text-muted-foreground">
          {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
        </span>
      </div>

      <p className="whitespace-pre-wrap text-xs text-muted-foreground">{preview}</p>

      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-skylark-blue hover:underline"
        >
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}

      {agent && (
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <AgentAvatar name={agent.name} size="sm" className="h-4 w-4 [&>svg]:h-2.5 [&>svg]:w-2.5" />
          <span>{agent.name}</span>
        </div>
      )}
    </div>
  );
}
