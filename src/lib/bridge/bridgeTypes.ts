export type BridgeService = 'gmail' | 'drive';
export type BridgeRiskLevel = 'low' | 'medium' | 'high';
export type BridgeRequestStatus = 'pending' | 'approved' | 'rejected' | 'executed' | 'failed';

export interface BridgeConnection {
  user_id: string;
  service: BridgeService;
  connected_at: string;
  scopes: string[];
  email: string | null;
}

export interface BridgeRequest {
  id: string;
  user_id: string;
  service: BridgeService;
  action: string;
  params: Record<string, any>;
  risk: BridgeRiskLevel;
  reason: string;
  requesting_agent_id: string | null;
  status: BridgeRequestStatus;
  created_at: string;
  decided_at: string | null;
  executed_at: string | null;
  result: Record<string, any> | null;
  error: string | null;
  source: 'live' | 'mock';
}
