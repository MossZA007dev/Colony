export type CrewAgentKind = 'research' | 'analyst' | 'writer' | 'reviewer';

export interface CrewRunAgent {
  id: string;
  kind: CrewAgentKind;
  name: string;
  focus: string;
}

export interface CrewRunActivity {
  agent_id: string;
  step: string;
  output_excerpt: string;
  timestamp: string;
}

export interface CrewRunDeliverable {
  title: string;
  content_md: string;
  word_count: number;
  sources_cited: number;
}

export interface CrewRunResponse {
  crew_id: string;
  task: string;
  agents: CrewRunAgent[];
  activity: CrewRunActivity[];
  deliverable: CrewRunDeliverable;
  duration_seconds: number;
  model_calls: number;
  source: 'live' | 'mock';
}
