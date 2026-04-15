'use client';

import { useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { AgentAvatar } from '@/components/agent-avatar';
import { Search, ChevronDown, ChevronRight, FileText, Activity, Lightbulb } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type {
  SharedLearning,
  ClientDocument,
  NexusActivityLogEntry,
  NexusAgent,
  Agent,
} from '@/types';

interface MemoryViewProps {
  learnings: SharedLearning[];
  documents: ClientDocument[];
  activity: NexusActivityLogEntry[];
  nexusAgents: Partial<NexusAgent>[];
  mcAgents: Agent[];
}

export function MemoryView({
  learnings,
  documents,
  activity,
  nexusAgents,
  mcAgents,
}: MemoryViewProps) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  // Map Nexus agent_id -> display name (via Nexus agents table),
  // falling back to the MC agents table by name where possible.
  const agentNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const a of nexusAgents) {
      if (a.id && a.name) map[a.id] = a.name;
    }
    return map;
  }, [nexusAgents]);

  const mcAgentByName = useMemo(() => {
    const map: Record<string, Agent> = {};
    for (const a of mcAgents) map[a.name] = a;
    return map;
  }, [mcAgents]);

  const filteredLearnings = useMemo(
    () =>
      !q
        ? learnings
        : learnings.filter(
            (l) =>
              l.learning?.toLowerCase().includes(q) ||
              l.category?.toLowerCase().includes(q) ||
              l.tags?.some((t) => t.toLowerCase().includes(q))
          ),
    [learnings, q]
  );

  const filteredDocuments = useMemo(
    () =>
      !q
        ? documents
        : documents.filter(
            (d) =>
              d.title?.toLowerCase().includes(q) ||
              d.description?.toLowerCase().includes(q) ||
              d.knowledge_type?.toLowerCase().includes(q)
          ),
    [documents, q]
  );

  const filteredActivity = useMemo(
    () =>
      !q
        ? activity
        : activity.filter(
            (e) =>
              e.input_summary?.toLowerCase().includes(q) ||
              e.output_summary?.toLowerCase().includes(q) ||
              e.action?.toLowerCase().includes(q)
          ),
    [activity, q]
  );

  const resolveAgent = (agent_id: string | null): Agent | null => {
    if (!agent_id) return null;
    const name = agentNameById[agent_id];
    if (name && mcAgentByName[name]) return mcAgentByName[name];
    return null;
  };

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search knowledge..."
          className="w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-3 text-sm transition-colors placeholder:text-muted-foreground focus:border-skylark-blue focus:outline-none focus:ring-2 focus:ring-skylark-blue/20"
        />
      </div>

      <Tabs defaultValue="learnings">
        <TabsList>
          <TabsTrigger value="learnings">
            <Lightbulb className="h-3.5 w-3.5" strokeWidth={1.75} />
            Shared Learnings
            <CountBadge value={filteredLearnings.length} />
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="h-3.5 w-3.5" strokeWidth={1.75} />
            Documents
            <CountBadge value={filteredDocuments.length} />
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="h-3.5 w-3.5" strokeWidth={1.75} />
            Activity Log
            <CountBadge value={filteredActivity.length} />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="learnings" className="mt-5">
          {filteredLearnings.length === 0 ? (
            <EmptyState message={q ? 'No learnings match your search' : 'No shared learnings yet'} />
          ) : (
            <div className="space-y-3">
              {filteredLearnings.map((l) => (
                <LearningCard key={l.id} learning={l} agent={resolveAgent(l.agent_id)} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents" className="mt-5">
          {filteredDocuments.length === 0 ? (
            <EmptyState message={q ? 'No documents match your search' : 'No documents yet'} />
          ) : (
            <div className="space-y-3">
              {filteredDocuments.map((d) => (
                <DocumentCard key={d.id} doc={d} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-5">
          {filteredActivity.length === 0 ? (
            <EmptyState message={q ? 'No activity matches your search' : 'No activity recorded yet'} />
          ) : (
            <div className="space-y-2">
              {filteredActivity.map((e) => (
                <ActivityRow key={e.id} entry={e} agent={resolveAgent(e.agent_id)} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CountBadge({ value }: { value: number }) {
  if (value === 0) return null;
  return (
    <span className="ml-1.5 rounded-full bg-foreground/10 px-1.5 text-[10px] font-medium">
      {value}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center text-sm text-muted-foreground">
        {message}
      </CardContent>
    </Card>
  );
}

function LearningCard({ learning, agent }: { learning: SharedLearning; agent: Agent | null }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = learning.learning.length > 220;
  const preview = isLong && !expanded ? learning.learning.slice(0, 220) + '…' : learning.learning;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {learning.category && (
              <span className="inline-flex items-center rounded-md bg-skylark-sky/30 px-2 py-0.5 text-xs font-medium text-skylark-slate">
                {learning.category}
              </span>
            )}
            {learning.tags?.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-skylark-sand/25 px-2 py-0.5 text-[11px] font-medium text-skylark-slate"
              >
                {tag}
              </span>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(learning.created_at), { addSuffix: true })}
          </span>
        </div>

        <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{preview}</p>

        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-skylark-blue hover:underline"
          >
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}

        {agent && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <AgentAvatar name={agent.name} size="sm" className="h-5 w-5 [&>svg]:h-3 [&>svg]:w-3" />
            <span className="font-medium text-foreground/80">{agent.name}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DocumentCard({ doc }: { doc: ClientDocument }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold">{doc.title}</h3>
            {doc.description && (
              <p className="mt-0.5 text-sm text-muted-foreground">{doc.description}</p>
            )}
          </div>
          <span className="flex-none text-xs text-muted-foreground">
            {format(new Date(doc.created_at), 'MMM d')}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
          {doc.file_type && (
            <span className="rounded-md bg-skylark-sky/30 px-2 py-0.5 font-medium uppercase text-skylark-slate">
              {doc.file_type}
            </span>
          )}
          {doc.knowledge_type && (
            <span className="rounded-md bg-skylark-sand/25 px-2 py-0.5 font-medium text-skylark-slate">
              {doc.knowledge_type}
            </span>
          )}
          {doc.privacy_level && (
            <span
              className={cn(
                'rounded-md border px-2 py-0.5 font-medium',
                doc.privacy_level === 'private' || doc.privacy_level === 'confidential'
                  ? 'border-red-500/40 text-red-600'
                  : 'border-border text-muted-foreground'
              )}
            >
              {doc.privacy_level}
            </span>
          )}
          {doc.status && (
            <span className="rounded-md border border-border px-2 py-0.5 font-medium text-muted-foreground">
              {doc.status}
            </span>
          )}
        </div>

        {doc.content && (
          <>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-skylark-blue hover:underline"
            >
              {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              {expanded ? 'Hide content' : 'View content'}
            </button>
            {expanded && (
              <div className="mt-2 max-h-96 overflow-auto rounded-md bg-muted p-3 text-xs text-muted-foreground whitespace-pre-wrap">
                {doc.content}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityRow({
  entry,
  agent,
}: {
  entry: NexusActivityLogEntry;
  agent: Agent | null;
}) {
  return (
    <article className="flex items-start gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:border-skylark-blue/40">
      {agent ? (
        <AgentAvatar name={agent.name} size="md" />
      ) : (
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-muted">
          <Activity className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {agent && <span className="text-sm font-semibold">{agent.name}</span>}
          {entry.action && (
            <span className="rounded bg-skylark-sky/20 px-1.5 py-0.5 font-mono text-[11px] text-skylark-slate">
              {entry.action}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
          </span>
        </div>
        {entry.input_summary && (
          <p className="mt-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/70">in:</span> {entry.input_summary}
          </p>
        )}
        {entry.output_summary && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/70">out:</span> {entry.output_summary}
          </p>
        )}
      </div>
    </article>
  );
}
