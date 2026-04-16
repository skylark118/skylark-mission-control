import { nexusClient } from '@/lib/supabase/clients';
import { mcClient } from '@/lib/supabase/clients';
import type {
  SharedLearning,
  ClientDocument,
  NexusActivityLogEntry,
  NexusAgent,
  Agent,
} from '@/types';
import { MemoryView } from '@/components/memory/memory-view';

export const dynamic = 'force-dynamic';

export default async function MemoryPage() {
  const nexus = nexusClient();
  const mc = mcClient();

  const [learnings, documents, activity, nexusAgents, mcAgents] = await Promise.all([
    nexus
      .from('shared_learnings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50),
    nexus
      .from('client_documents')
      .select(
        'id, client_id, title, description, file_type, filename, knowledge_type, privacy_level, business_category, status, content, created_at, updated_at'
      )
      .order('created_at', { ascending: false })
      .limit(50),
    nexus
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50),
    nexus.from('agents').select('id, name, agent_type, status, last_seen_at'),
    mc.from('agents').select('*'),
  ]);

  return (
    <div>
      <MemoryView
        learnings={(learnings.data as SharedLearning[]) || []}
        documents={(documents.data as ClientDocument[]) || []}
        activity={(activity.data as NexusActivityLogEntry[]) || []}
        nexusAgents={(nexusAgents.data as Partial<NexusAgent>[]) || []}
        mcAgents={(mcAgents.data as Agent[]) || []}
      />
    </div>
  );
}
