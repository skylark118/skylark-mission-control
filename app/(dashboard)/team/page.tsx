import { mcClient } from '@/lib/supabase/clients';
import type { Agent } from '@/types';
import { AgentAvatar } from '@/components/agent-avatar';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

// Supplementary metadata that isn't (yet) in the agents table.
// When we move these into agents.config JSONB we can drop this.
const agentMeta: Record<
  string,
  { title: string; slack: string; tags: string[] }
> = {
  Stella: {
    title: 'Chief of Staff',
    slack: '#1-stella',
    tags: ['Orchestration', 'Delegation', 'QA'],
  },
  Cora: {
    title: 'Engineering Lead',
    slack: '#2-cora',
    tags: ['Architecture', 'Deploys', 'Infra'],
  },
  Remy: {
    title: 'Research Lead',
    slack: '#3-remy',
    tags: ['Market research', 'Analysis', 'Synthesis'],
  },
  Penny: {
    title: 'Content Lead',
    slack: '#4-penny',
    tags: ['Writing', 'Editing', 'Publishing'],
  },
};

function deriveStatus(agent: Agent): Agent['status'] {
  if (!agent.last_heartbeat) return agent.status;
  const diffMin =
    (Date.now() - new Date(agent.last_heartbeat).getTime()) / 60000;
  if (diffMin > 120) return 'offline';
  if (diffMin > 30) return 'idle';
  return 'active';
}

const statusStyle: Record<
  Agent['status'],
  { label: string; dot: string; pulse: boolean }
> = {
  active: { label: 'Active', dot: 'bg-emerald-500', pulse: true },
  idle: { label: 'Idle', dot: 'bg-skylark-blue', pulse: false },
  error: { label: 'Error', dot: 'bg-red-500', pulse: false },
  offline: { label: 'Offline', dot: 'bg-muted-foreground', pulse: false },
};

export default async function TeamPage() {
  const supabase = mcClient();
  const { data } = await supabase.from('agents').select('*');
  const agents = (data as Agent[]) || [];

  const orchestrator = agents.find((a) => a.role === 'orchestrator');
  const others = agents
    .filter((a) => a.role !== 'orchestrator')
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-10">
      {orchestrator && (
        <section className="space-y-3">
          <SectionHeader label="Orchestrator" />
          <AgentProfile agent={orchestrator} variant="hero" />
        </section>
      )}

      {others.length > 0 && (
        <section className="space-y-3">
          <SectionHeader label="Specialists" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {others.map((agent) => (
              <AgentProfile key={agent.id} agent={agent} variant="standard" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {label}
    </p>
  );
}

function AgentProfile({
  agent,
  variant,
}: {
  agent: Agent;
  variant: 'hero' | 'standard';
}) {
  const meta = agentMeta[agent.name] ?? {
    title: agent.role,
    slack: '',
    tags: [],
  };
  const status = deriveStatus(agent);
  const s = statusStyle[status];

  if (variant === 'hero') {
    return (
      <Card className="overflow-hidden border-skylark-orange/30 bg-gradient-to-br from-[#F5B94A]/10 via-background to-background">
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            <AgentAvatar name={agent.name} size="lg" />
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-medium">{agent.name}</h2>
                  <StatusBadge statusLabel={s.label} dot={s.dot} pulse={s.pulse} />
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{meta.title}</p>
              </div>

              <dl className="grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
                <DetailRow label="Model" value={agent.default_model} />
                <DetailRow label="Slack" value={meta.slack} mono />
              </dl>

              {meta.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {meta.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-skylark-sky/30 px-2 py-0.5 text-xs font-medium text-skylark-slate"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-3 p-5">
        <div className="flex items-start gap-3">
          <AgentAvatar name={agent.name} size="md" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{agent.name}</h3>
              <StatusBadge statusLabel={s.label} dot={s.dot} pulse={s.pulse} />
            </div>
            <p className="text-xs text-muted-foreground">{meta.title}</p>
          </div>
        </div>

        <dl className="space-y-1 text-xs">
          <DetailRow label="Model" value={agent.default_model} dense />
          {meta.slack && <DetailRow label="Slack" value={meta.slack} dense mono />}
        </dl>

        {meta.tags.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
            {meta.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-skylark-sand/25 px-2 py-0.5 text-[11px] font-medium text-skylark-slate"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({
  statusLabel,
  dot,
  pulse,
}: {
  statusLabel: string;
  dot: string;
  pulse: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      <span className={cn('h-1.5 w-1.5 rounded-full', dot, pulse && 'animate-pulse')} />
      {statusLabel}
    </span>
  );
}

function DetailRow({
  label,
  value,
  mono,
  dense,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  dense?: boolean;
}) {
  if (!value) return null;
  return (
    <div className={cn('flex items-baseline gap-2', dense ? 'text-xs' : 'text-sm')}>
      <dt className="text-muted-foreground">{label}:</dt>
      <dd className={cn('text-foreground', mono && 'font-mono')}>{value}</dd>
    </div>
  );
}
