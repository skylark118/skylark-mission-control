export type AgentStatus = 'active' | 'idle' | 'error' | 'offline';
export type EventStatus = 'pending' | 'running' | 'completed' | 'failed';
export type TaskStatus = 'pending' | 'in_progress' | 'review' | 'complete' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  avatar_emoji: string;
  default_model: string | null;
  last_heartbeat: string | null;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AgentEvent {
  id: string;
  agent_id: string;
  event_type: string;
  action: string;
  status: EventStatus;
  summary: string | null;
  metadata: Record<string, unknown>;
  session_id: string | null;
  duration_ms: number | null;
  created_at: string;
}

export interface AgentWithEvents extends Agent {
  latest_event?: AgentEvent;
}

export type TaskType = 'project' | 'ad_hoc' | 'routine';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  created_by: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  result: string | null;
  metadata: Record<string, unknown>;
  project_id: string | null;
  milestone_id: string | null;
  task_type: TaskType;
  scheduled_task_id: string | null;
  created_at: string;
  updated_at: string;
}

export type MilestoneStatus = 'planning' | 'active' | 'complete';

export interface Milestone {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  status: MilestoneStatus;
  target_date: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type NoteType = 'plan' | 'decision' | 'note' | 'retro' | 'standup';

export interface ProjectNote {
  id: string;
  project_id: string;
  milestone_id: string | null;
  author_agent_id: string | null;
  note_type: NoteType;
  title: string | null;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type ProjectStatus = 'planning' | 'active' | 'paused' | 'complete';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  priority: TaskPriority;
  owner_agent_id: string | null;
  progress: number;
  repo_url: string | null;
  live_url: string | null;
  stack: string[] | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type ScheduledTaskStatus = 'active' | 'paused' | 'disabled';
export type ScheduledTaskCategory =
  | 'briefing'
  | 'research'
  | 'content'
  | 'maintenance'
  | 'general';

export interface ScheduledTask {
  id: string;
  name: string;
  description: string | null;
  schedule: string;
  schedule_human: string | null;
  agent_id: string | null;
  status: ScheduledTaskStatus;
  last_run: string | null;
  next_run: string | null;
  category: ScheduledTaskCategory;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Nexus tables (read-only from Mission Control)
export interface NexusAgent {
  id: string;
  client_id: string | null;
  name: string;
  agent_type: string | null;
  external_id: string | null;
  status: string | null;
  last_seen_at: string | null;
  scopes: string[] | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface SharedLearning {
  id: string;
  agent_id: string | null;
  actor_id: string | null;
  contributing_client_id: string | null;
  category: string | null;
  learning: string;
  tags: string[] | null;
  status: string | null;
  created_at: string;
}

export interface ClientDocument {
  id: string;
  title: string;
  description: string | null;
  file_type: string | null;
  filename: string | null;
  knowledge_type: string | null;
  privacy_level: string | null;
  business_category: string | null;
  status: string | null;
  content: string | null;
  created_at: string;
  updated_at: string;
}

export interface NexusActivityLogEntry {
  id: string;
  client_id: string | null;
  agent_id: string | null;
  session_id: string | null;
  action: string | null;
  actor_type: string | null;
  actor_id: string | null;
  input_summary: string | null;
  output_summary: string | null;
  document_ids: string[] | null;
  metadata: Record<string, unknown>;
  created_at: string;
}
