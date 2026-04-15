import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { AgentAvatar } from '@/components/agent-avatar';
import type { Agent, Project } from '@/types';
import { cn } from '@/lib/utils';
import { ExternalLink, Github } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  owner: Agent | null;
}

const statusStyle: Record<
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

const priorityStyle: Record<Project['priority'], string> = {
  urgent: 'text-red-500 border-red-500/40',
  high: 'text-skylark-orange border-skylark-orange/40',
  medium: 'text-skylark-blue border-skylark-blue/40',
  low: 'text-muted-foreground border-muted-foreground/30',
};

export function ProjectCard({ project, owner }: ProjectCardProps) {
  const s = statusStyle[project.status];

  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
      <CardContent className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold leading-tight">{project.name}</h3>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
              s.className
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
            {s.label}
          </span>
        </div>

        {project.description && (
          <p className="text-sm text-muted-foreground">{project.description}</p>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span className="font-medium text-foreground">{project.progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                project.status === 'active'
                  ? 'bg-skylark-blue'
                  : project.status === 'paused'
                  ? 'bg-skylark-orange'
                  : 'bg-skylark-slate/50'
              )}
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        {project.stack && project.stack.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {project.stack.map((tech) => (
              <span
                key={tech}
                className="rounded-md bg-skylark-sand/25 px-2 py-0.5 text-[11px] font-medium text-skylark-slate"
              >
                {tech}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            {owner ? (
              <div className="flex items-center gap-1.5">
                <AgentAvatar name={owner.name} size="sm" />
                <span className="text-xs font-medium text-muted-foreground">
                  {owner.name}
                </span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">Unassigned</span>
            )}
            <span
              className={cn(
                'rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                priorityStyle[project.priority]
              )}
            >
              {project.priority}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            {project.live_url && (
              <Link
                href={
                  project.live_url.startsWith('http')
                    ? project.live_url
                    : `https://${project.live_url}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-skylark-blue"
                aria-label="Live site"
              >
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
              </Link>
            )}
            {project.repo_url && (
              <Link
                href={project.repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-skylark-blue"
                aria-label="Repository"
              >
                <Github className="h-3.5 w-3.5" strokeWidth={1.75} />
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
