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
  created_at: string;
  updated_at: string;
}
