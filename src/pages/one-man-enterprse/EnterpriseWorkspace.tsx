import React from 'react';
import { ArrowRight, Eye, Link as LinkIcon, MessageSquare, Plus, Search, Users, X } from 'lucide-react';
import type { AgentCapability, AgentSkill, ModelConfig } from '../../lib/aiOrchestration';
import {
  flushPendingSaves,
  loadWorkspaceLocal,
  refreshFromRemote,
  saveWorkspace,
} from '../../lib/enterprise/workspaceRepo';
import {
  ENTERPRISE_DEPARTMENT_COLOR_MAP,
  ENTERPRISE_DEPARTMENT_COLORS,
  buildEnterpriseConnections,
  defaultActiveModel,
  enterpriseAvatarForAgent,
  enterpriseCodeForAgent,
  inferCapabilitiesFromText,
  skillsForCapabilities,
  type AgentConnection,
  type AgentConnectionType,
  type AgentNodePosition,
  type EnterpriseAgent,
  type EnterpriseAgentStatus,
  type EnterpriseDepartment,
  type EnterpriseDepartmentColor,
  type EnterpriseWorkspaceAgent,
  type EnterpriseWorkspaceChannel,
  type EnterpriseWorkspaceProject,
} from './oneManEnterprise';

type EnterpriseModelRoutingSummaryProps = {
  skills: AgentSkill[];
  activeModel?: ModelConfig;
  onChange?: (skill: AgentSkill) => void;
};

type EnterpriseModelPickerModalProps = {
  title: string;
  skill: AgentSkill;
  activeModel?: ModelConfig;
  onSave: (skill: AgentSkill, activeModel: ModelConfig) => void;
  onClose: () => void;
};

type EnterpriseSkillModelPillsProps = {
  skills?: AgentSkill[] | AgentCapability[] | string[];
  activeModel?: ModelConfig;
  compact?: boolean;
};

export function EnterpriseWorkspace({
  project,
  onBack,
  ModelRoutingSummary,
  ModelPickerModal,
  SkillModelPills,
}: {
  project: EnterpriseWorkspaceProject;
  onBack: () => void;
  ModelRoutingSummary: React.ComponentType<EnterpriseModelRoutingSummaryProps>;
  ModelPickerModal: React.ComponentType<EnterpriseModelPickerModalProps>;
  SkillModelPills: React.ComponentType<EnterpriseSkillModelPillsProps>;
}) {
  const makeChannels = (items: EnterpriseWorkspaceAgent[]): EnterpriseWorkspaceChannel[] => [
    { id: 'general', name: 'general', type: 'system' },
    { id: 'task', name: 'task', type: 'system' },
    { id: 'research', name: 'research', type: 'system' },
    { id: 'strategy', name: 'strategy', type: 'system' },
    { id: 'updates', name: 'updates', type: 'system' },
    { id: 'team', name: 'Team', type: 'team' },
    ...items.map((agent) => ({ id: `agent-${agent.id}`, name: agent.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || agent.id, type: 'agent' as const, agentId: agent.id })),
  ];
  const initialMessages = React.useMemo(() => {
    const now = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    return [
      { id: 'wm-1', channelId: 'general', fromAgentId: project.agents.find(a => /Research/i.test(a.name))?.id ?? project.agents[2]?.id, timestamp: '09:42', content: 'I have collected market and competitor data for our target segments. Key trends show stronger adoption of AI-powered reporting tools.' },
      { id: 'wm-2', channelId: 'general', fromAgentId: project.agents.find(a => /Analyst|Strategy/i.test(a.name))?.id ?? project.agents[3]?.id, timestamp: '09:44', content: 'Analyzed the data. The top opportunity is mid-market teams that still run manual spreadsheet workflows.' },
      { id: 'wm-3', channelId: 'task', fromAgentId: project.agents.find(a => /Project Manager|Operations/i.test(a.name))?.id ?? project.agents[1]?.id, timestamp: '09:58', content: 'Current task split: Research validates data, Analyst synthesizes, Writer drafts, Quality Checker reviews before approval.' },
      { id: `wm-${Date.now()}`, channelId: 'updates', fromAgentId: project.agents[0]?.id, timestamp: now, content: 'Editable organization canvas is online. Drag nodes, add agents, and connect handoffs.' },
    ];
  }, [project.agents]);
  const restoredWorkspace = React.useMemo(() => {
    return loadWorkspaceLocal(project.id) as {
      agents?: EnterpriseWorkspaceAgent[];
      connections?: AgentConnection[];
      channels?: EnterpriseWorkspaceChannel[];
      messages?: Array<{ id: string; channelId: string; fromAgentId?: string; timestamp: string; content: string }>;
      departments?: EnterpriseDepartment[];
    } | null;
  }, [project.id]);
  const [agents, setAgents] = React.useState<EnterpriseWorkspaceAgent[]>(restoredWorkspace?.agents?.length ? restoredWorkspace.agents : project.agents);
  const [connections, setConnections] = React.useState<AgentConnection[]>(restoredWorkspace?.connections?.length ? restoredWorkspace.connections : project.connections?.length ? project.connections : buildEnterpriseConnections(project.agents));
  const [channels, setChannels] = React.useState<EnterpriseWorkspaceChannel[]>(restoredWorkspace?.channels?.length ? restoredWorkspace.channels : makeChannels(project.agents));
  const [messages, setMessages] = React.useState(restoredWorkspace?.messages?.length ? restoredWorkspace.messages : initialMessages);
  const [departments, setDepartments] = React.useState<EnterpriseDepartment[]>(restoredWorkspace?.departments ?? []);
  const [deptModal, setDeptModal] = React.useState<null | { mode: 'create' | 'manage'; departmentId?: string }>(null);
  const [selectedAgentId, setSelectedAgentId] = React.useState(project.agents[0]?.id ?? '');
  const [enterpriseModelPicker, setEnterpriseModelPicker] = React.useState<{ agentId: string; skillId: string } | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = React.useState('');
  const [selectedChannelId, setSelectedChannelId] = React.useState('general');
  const [canvasPosition, setCanvasPosition] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(0.92);
  const [isPanning, setIsPanning] = React.useState(false);
  const [isLocked, setIsLocked] = React.useState(false);
  const [isLive, setIsLive] = React.useState(true);
  const [chatPanelHeight, setChatPanelHeight] = React.useState(280);
  const [contextMenu, setContextMenu] = React.useState<null | { x: number; y: number; kind: 'canvas' | 'agent' | 'connection'; agentId?: string; connectionId?: string; canvasPoint?: AgentNodePosition }>(null);
  const [agentModal, setAgentModal] = React.useState<null | { mode: 'add' | 'edit'; agent?: EnterpriseWorkspaceAgent; position?: AgentNodePosition; connectToSelected?: boolean }>(null);
  const [agentAddMenu, setAgentAddMenu] = React.useState<null | { x: number; y: number; parentId: string }>(null);
  const [connectFromAgentId, setConnectFromAgentId] = React.useState('');
  const [draggingAgentId, setDraggingAgentId] = React.useState('');
  const [connectPreview, setConnectPreview] = React.useState<null | { fromAgentId: string; to: AgentNodePosition }>(null);
  const canvasStageRef = React.useRef<HTMLDivElement>(null);
  const nodeDragRef = React.useRef({ active: false, id: '', startX: 0, startY: 0, originX: 0, originY: 0, moved: false });
  const panStartRef = React.useRef({ x: 0, y: 0, originX: 0, originY: 0 });
  const dragDivRef = React.useRef({ active: false, startY: 0, startH: 0 });
  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId) ?? agents[0];
  const selectedConnection = connections.find((connection) => connection.id === selectedConnectionId);
  const agentName = React.useCallback((id?: string) => agents.find((agent) => agent.id === id)?.name ?? 'AI Ant', [agents]);
  const AgentAvatar = ({ agent, size = 'md', selected = false }: { agent: EnterpriseWorkspaceAgent; size?: 'sm' | 'md' | 'lg' | 'xl'; selected?: boolean }) => {
    const sizeClass = size === 'xl' ? 'h-[76px] w-[76px] rounded-[20px]' : size === 'lg' ? 'h-14 w-14 rounded-[17px]' : size === 'sm' ? 'h-10 w-10 rounded-[12px]' : 'h-11 w-11 rounded-[14px]';
    return (
      <span className={`relative grid shrink-0 place-items-center overflow-hidden border bg-[#f4f4f8] ${sizeClass} ${selected ? 'border-violet-300/70 shadow-[0_0_20px_rgba(124,92,252,0.30)]' : 'border-white/[0.12]'}`}>
        <img src={agent.avatar} alt={agent.name} draggable={false} className="h-full w-full object-cover" />
        <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0a101d] ${statusDot[agent.status]}`} />
      </span>
    );
  };
  const statusDot: Record<EnterpriseAgentStatus, string> = {
    idle: 'bg-white/25',
    thinking: 'bg-violet-300',
    working: 'bg-emerald-300',
    waiting: 'bg-amber-300',
    done: 'bg-cyan-300',
    blocked: 'bg-red-300',
  };
  const statusLabel: Record<EnterpriseAgentStatus, string> = {
    idle: 'online',
    thinking: 'thinking',
    working: 'running',
    waiting: 'waiting',
    done: 'done',
    blocked: 'blocked',
  };
  // Persist workspace state — writes to localStorage instantly + Firestore (debounced ~800ms).
  React.useEffect(() => {
    saveWorkspace(project.id, { agents, connections, channels, messages, departments });
  }, [agents, connections, channels, messages, departments, project.id]);

  // Flush any pending Firestore write on unmount so we don't lose the last edit.
  React.useEffect(() => {
    return () => {
      void flushPendingSaves(project.id);
    };
  }, [project.id]);

  // On mount, try to pull a newer copy from Firestore (e.g. edited on another device).
  React.useEffect(() => {
    let cancelled = false;
    void refreshFromRemote(project.id).then((remote) => {
      if (cancelled || !remote) return;
      if (remote.agents?.length) setAgents(remote.agents as EnterpriseWorkspaceAgent[]);
      if (remote.connections?.length) setConnections(remote.connections as AgentConnection[]);
      if (remote.channels?.length) setChannels(remote.channels as EnterpriseWorkspaceChannel[]);
      if (remote.messages?.length) setMessages(remote.messages as typeof messages);
      if (remote.departments) setDepartments(remote.departments as EnterpriseDepartment[]);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  // ── Department helpers ────────────────────────────────────────────────────
  const calculateDepartmentBounds = React.useCallback((agentIds: string[]) => {
    const PAD = 56;
    const NODE_W = 220;
    const NODE_H = 96;
    const members = agentIds
      .map((id) => agents.find((a) => a.id === id))
      .filter((a): a is EnterpriseWorkspaceAgent => !!a && !!(a as { position?: AgentNodePosition }).position);
    if (members.length === 0) return { x: 200, y: 200, width: 360, height: 220 };
    const xs = members.map((a) => (a as unknown as { position: AgentNodePosition }).position.x);
    const ys = members.map((a) => (a as unknown as { position: AgentNodePosition }).position.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs) + NODE_W;
    const maxY = Math.max(...ys) + NODE_H;
    return { x: minX - PAD, y: minY - PAD, width: maxX - minX + PAD * 2, height: maxY - minY + PAD * 2 };
  }, [agents]);

  const createDepartment = React.useCallback((name: string, color: EnterpriseDepartmentColor, agentIds: string[], description?: string) => {
    const id = `dept-${Date.now()}`;
    const channelId = `channel-${id}`;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || id;
    const bounds = calculateDepartmentBounds(agentIds);
    setDepartments((prev) => [...prev, { id, name, color, agentIds, channelId, bounds, description }]);
    setChannels((prev) => [...prev, { id: channelId, name: slug, type: 'department', departmentId: id }]);
    setSelectedChannelId(channelId);
  }, [calculateDepartmentBounds]);

  const updateDepartment = React.useCallback((id: string, patch: Partial<EnterpriseDepartment>) => {
    setDepartments((prev) => prev.map((d) => d.id === id ? { ...d, ...patch } : d));
    if (patch.name) {
      const slug = patch.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || id;
      setChannels((prev) => prev.map((c) => c.departmentId === id ? { ...c, name: slug } : c));
    }
  }, []);

  const deleteDepartment = React.useCallback((id: string) => {
    const dept = departments.find((d) => d.id === id);
    setDepartments((prev) => prev.filter((d) => d.id !== id));
    if (dept) setChannels((prev) => prev.filter((c) => c.id !== dept.channelId));
    if (dept && selectedChannelId === dept.channelId) setSelectedChannelId('general');
  }, [departments, selectedChannelId]);

  const setDepartmentAgents = React.useCallback((id: string, agentIds: string[]) => {
    setDepartments((prev) => prev.map((d) => {
      if (d.id !== id) return d;
      const bounds = d.manuallyPositioned ? d.bounds : calculateDepartmentBounds(agentIds);
      return { ...d, agentIds, bounds };
    }));
  }, [calculateDepartmentBounds]);

  const autoFitDepartment = React.useCallback((id: string) => {
    setDepartments((prev) => prev.map((d) => d.id === id ? { ...d, bounds: calculateDepartmentBounds(d.agentIds), manuallyPositioned: false } : d));
  }, [calculateDepartmentBounds]);

  const roleLabel = (agent: EnterpriseWorkspaceAgent) =>
    agent.name === 'AI Ant Director' ? 'Direction & Leadership' :
    /Project Manager|Operations/i.test(agent.name) ? 'Operations' :
    /Research/i.test(agent.name) ? 'Research' :
    /Analyst|Strategy|Finance/i.test(agent.name) ? 'Strategy' :
    /Writer|Content|Marketing/i.test(agent.name) ? 'Content' :
    /Quality|Support|Checker/i.test(agent.name) ? 'Quality Assurance' : agent.dept;
  const selectedChannel = channels.find((channel) => channel.id === selectedChannelId) ?? channels[0];
  const sampleMessages = [
    { id: 'wm-1', channelId: 'general', fromAgentId: project.agents.find(a => /Research/i.test(a.name))?.id ?? project.agents[2]?.id, timestamp: '09:42', content: 'I’ve collected market and competitor data for our target segments. Key trends show 12% growth in SMB SaaS adoption and a shift toward AI-powered reporting tools.' },
    { id: 'wm-2', channelId: 'general', fromAgentId: project.agents.find(a => /Analyst|Strategy/i.test(a.name))?.id ?? project.agents[3]?.id, timestamp: '09:44', content: 'Analyzed the data — top opportunity is mid-market teams in North America. Projected impact: +18% conversion with focused positioning.' },
    { id: 'wm-3', channelId: 'general', fromAgentId: project.agents.find(a => /Writer|Content/i.test(a.name))?.id ?? project.agents[4]?.id, timestamp: '09:47', content: 'Great insights. I’ll draft the executive summary and key findings. Anything specific you want highlighted?' },
    { id: 'wm-4', channelId: 'general', fromAgentId: project.agents.find(a => /Quality|Checker/i.test(a.name))?.id ?? project.agents[5]?.id, timestamp: '09:49', content: 'Please flag the methodology section for review. Also verify competitor metrics for source consistency.' },
    { id: 'wm-5', channelId: 'research', fromAgentId: project.agents.find(a => /Research/i.test(a.name))?.id ?? project.agents[2]?.id, timestamp: '09:52', content: 'Source pack is ready: competitor pricing, adoption trends, and customer pain-point excerpts.' },
    { id: 'wm-6', channelId: 'strategy', fromAgentId: project.agents.find(a => /Analyst|Strategy/i.test(a.name))?.id ?? project.agents[3]?.id, timestamp: '09:55', content: 'Strategy recommendation: start with automated sales reporting for teams that already export manual spreadsheets weekly.' },
    { id: 'wm-7', channelId: 'task', fromAgentId: project.agents.find(a => /Project Manager|Operations/i.test(a.name))?.id ?? project.agents[1]?.id, timestamp: '09:58', content: 'Current task split: Research validates data, Analyst synthesizes, Writer drafts, Quality Checker reviews before approval.' },
    { id: 'wm-8', channelId: 'updates', fromAgentId: project.agents[0]?.id, timestamp: '10:00', content: 'Operating plan is 48% complete. Deliverable draft is being assembled for review.' },
  ];
  const visibleMessages = messages.filter((message) => message.channelId === selectedChannelId);
  const progress = Math.round(project.tasks.reduce((sum, task) => sum + task.progress, 0) / project.tasks.length);
  const thinkingBullets = selectedAgent?.name === 'AI Ant Director'
    ? ['Evaluating business goals and priorities', 'Scoping first deliverable for maximum impact', 'Aligning agent roles and dependencies', 'Confirming success metrics']
    : ['Reviewing assigned objective', 'Summarizing useful signal only', 'Preparing structured handoff', 'Checking dependencies before output'];
  const orgDirector = project.agents.find((agent) => !agent.parentAgentId) ?? project.agents[0];
  const orgManager = project.agents.find((agent) => agent.parentAgentId === orgDirector?.id) ?? project.agents[1];
  const orgWorkers = project.agents.filter((agent) => agent.parentAgentId === orgManager?.id).slice(0, 4);
  const workspaceTitle = project.name;
  const workspaceSubtitle = project.goal;
  const clampZoom = (value: number) => Math.min(1.45, Math.max(0.68, value));
  const fitCanvas = React.useCallback(() => {
    // Center the viewport on the agents' bounding box at a zoom that fits them
    // comfortably inside the visible canvas area.
    if (agents.length === 0) {
      setCanvasPosition({ x: 0, y: 0 });
      setZoom(0.6);
      return;
    }
    const xs = agents.map((a) => a.position.x);
    const ys = agents.map((a) => a.position.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs) + NODE_W;
    const maxY = Math.max(...ys) + NODE_H;
    const bboxW = maxX - minX;
    const bboxH = maxY - minY;
    const stage = canvasStageRef.current;
    const viewportW = stage?.clientWidth ?? 1100;
    const viewportH = stage?.clientHeight ?? 600;
    const margin = 120;
    const fitZoom = Math.max(0.45, Math.min(1.0, Math.min((viewportW - margin) / bboxW, (viewportH - margin) / bboxH)));
    // World is centered with translate(-50%,-50%); we want bbox center on screen center.
    const worldCenterX = WORLD_W / 2;
    const worldCenterY = WORLD_H / 2;
    const bboxCenterX = (minX + maxX) / 2;
    const bboxCenterY = (minY + maxY) / 2;
    setZoom(fitZoom);
    setCanvasPosition({ x: (worldCenterX - bboxCenterX) * fitZoom, y: (worldCenterY - bboxCenterY) * fitZoom });
  }, [agents]);
  const handleCanvasPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isLocked) return;
    setIsPanning(true);
    panStartRef.current = { x: event.clientX, y: event.clientY, originX: canvasPosition.x, originY: canvasPosition.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const handleCanvasPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanning || isLocked) return;
    const start = panStartRef.current;
    setCanvasPosition({ x: start.originX + event.clientX - start.x, y: start.originY + event.clientY - start.y });
  };
  const handleCanvasPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanning) return;
    setIsPanning(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const handleCanvasWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (isLocked) return;
    event.preventDefault();
    setZoom((current) => clampZoom(current + (event.deltaY > 0 ? -0.06 : 0.06)));
  };
  const onDividerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragDivRef.current = { active: true, startY: e.clientY, startH: chatPanelHeight };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  };
  const onDividerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragDivRef.current.active) return;
    const delta = dragDivRef.current.startY - e.clientY;
    setChatPanelHeight(Math.min(520, Math.max(200, dragDivRef.current.startH + delta)));
  };
  const onDividerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragDivRef.current.active = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };
  const canvasPointFromClient = (clientX: number, clientY: number): AgentNodePosition => {
    const rect = canvasStageRef.current?.getBoundingClientRect();
    if (!rect) return { x: 360, y: 220 };
    return {
      x: Math.round((clientX - rect.left) / zoom),
      y: Math.round((clientY - rect.top) / zoom),
    };
  };
  // World size. Larger than viewport so users can drag freely; pan/zoom moves
  // the world inside the fixed viewport container.
  const WORLD_W = 3000;
  const WORLD_H = 2000;
  const NODE_W = 220;
  const NODE_H = 96;
  const clampNodePosition = (pos: AgentNodePosition): AgentNodePosition => ({
    x: Math.min(WORLD_W - NODE_W - 16, Math.max(16, pos.x)),
    y: Math.min(WORLD_H - NODE_H - 16, Math.max(16, pos.y)),
  });
  const makeAgentChannelName = (name: string, id: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || id;
  const addConnection = React.useCallback((fromAgentId: string, toAgentId: string, type: AgentConnectionType = 'handoff') => {
    if (!fromAgentId || !toAgentId || fromAgentId === toAgentId) return;
    setConnections((prev) => {
      if (prev.some((connection) => connection.fromAgentId === fromAgentId && connection.toAgentId === toAgentId)) return prev;
      const next: AgentConnection = {
        id: `conn-${fromAgentId}-${toAgentId}-${Date.now()}`,
        fromAgentId,
        toAgentId,
        type,
        label: type === 'review' ? 'Review' : type === 'collaboration' ? 'Collaboration' : 'Handoff',
        status: 'normal',
        animated: true,
        lastHandoff: 'Created now',
      };
      return [...prev, next];
    });
  }, []);
  const createEnterpriseAgent = (input: { name: string; role: string; dept: string; position: AgentNodePosition; parentId?: string; task?: string }): EnterpriseWorkspaceAgent => {
    const id = `enterprise-agent-${Date.now()}-${Math.round(Math.random() * 999)}`;
    const base: EnterpriseAgent = { id, name: input.name, role: input.role, dept: input.dept };
    const agentSkills = skillsForCapabilities(inferCapabilitiesFromText(input.name, input.role, input.dept, input.task));
    return {
      ...base,
      avatar: enterpriseAvatarForAgent(base),
      code: enterpriseCodeForAgent(base),
      description: input.role,
      parentAgentId: input.parentId,
      status: 'idle',
      position: clampNodePosition(input.position),
      currentTask: input.task || 'Define first responsibility',
      taskSummary: input.task || 'Define first responsibility',
      progress: 0,
      thoughtsSummary: 'New agent added to the operating canvas. Waiting for assignment.',
      output: 'No output yet.',
      tools: ['Workspace context'],
      dependencies: input.parentId ? [input.parentId] : [],
      agentSkills,
      activeModel: defaultActiveModel(agentSkills),
    };
  };
  const addChildNode = React.useCallback((parentId: string, openModal = false) => {
    const parent = agents.find((agent) => agent.id === parentId);
    if (!parent) return;
    const siblingCount = connections.filter((connection) => connection.fromAgentId === parentId).length;
    const position = clampNodePosition({ x: parent.position.x + (siblingCount - 0.5) * 230, y: parent.position.y + 165 });
    if (openModal) {
      setSelectedAgentId(parentId);
      setSelectedConnectionId('');
      setAgentModal({ mode: 'add', position, connectToSelected: true });
      return;
    }
    const child = createEnterpriseAgent({
      name: `New Agent ${agents.length + 1}`,
      role: 'Operations Agent',
      dept: 'Operations',
      position,
      parentId,
      task: `Support ${parent.name}`,
    });
    setAgents((prev) => [...prev, child]);
    setChannels((prev) => [...prev, { id: `agent-${child.id}`, name: makeAgentChannelName(child.name, child.id), type: 'agent', agentId: child.id }]);
    addConnection(parentId, child.id, 'handoff');
    setSelectedAgentId(child.id);
    setSelectedConnectionId('');
  }, [addConnection, agents, connections]);
  const deleteAgent = (agentId: string) => {
    const target = agents.find((agent) => agent.id === agentId);
    if (!target || !window.confirm(`Delete ${target.name}? This removes the node, related connections, and empty agent channel.`)) return;
    setAgents((prev) => prev.filter((agent) => agent.id !== agentId));
    setConnections((prev) => prev.filter((connection) => connection.fromAgentId !== agentId && connection.toAgentId !== agentId));
    setChannels((prev) => prev.filter((channel) => channel.agentId !== agentId || messages.some((message) => message.channelId === channel.id)));
    if (selectedAgentId === agentId) setSelectedAgentId(agents.find((agent) => agent.id !== agentId)?.id ?? '');
    setSelectedConnectionId('');
  };
  const autoLayoutAgents = React.useCallback(() => {
    const roots = agents.filter((agent) => !connections.some((connection) => connection.toAgentId === agent.id));
    const depthById = new Map<string, number>();
    const visit = (agentId: string, depth: number) => {
      if ((depthById.get(agentId) ?? Infinity) <= depth) return;
      depthById.set(agentId, depth);
      connections.filter((connection) => connection.fromAgentId === agentId).forEach((connection) => visit(connection.toAgentId, depth + 1));
    };
    (roots.length ? roots : agents.slice(0, 1)).forEach((agent) => visit(agent.id, 0));
    agents.forEach((agent) => { if (!depthById.has(agent.id)) depthById.set(agent.id, 1); });
    const grouped = agents.reduce<Record<number, EnterpriseWorkspaceAgent[]>>((acc, agent) => {
      const depth = depthById.get(agent.id) ?? 0;
      acc[depth] = [...(acc[depth] ?? []), agent];
      return acc;
    }, {});
    setAgents((prev) => prev.map((agent) => {
      const depth = depthById.get(agent.id) ?? 0;
      const row = grouped[depth] ?? [];
      const index = row.findIndex((item) => item.id === agent.id);
      const totalWidth = Math.max(0, (row.length - 1) * 250);
      return { ...agent, position: { x: 500 - totalWidth / 2 + index * 250, y: 35 + depth * 155 } };
    }));
  }, [agents, connections]);
  const duplicateAgent = (agentId: string) => {
    const agent = agents.find((item) => item.id === agentId);
    if (!agent) return;
    const clone: EnterpriseWorkspaceAgent = {
      ...agent,
      id: `agent-${Date.now()}`,
      name: `${agent.name} Copy`,
      code: enterpriseCodeForAgent({ ...agent, name: `${agent.name} Copy` }),
      position: clampNodePosition({ x: agent.position.x + 38, y: agent.position.y + 38 }),
      progress: 0,
      status: 'idle',
    };
    setAgents((prev) => [...prev, clone]);
    setChannels((prev) => [...prev, { id: `agent-${clone.id}`, name: makeAgentChannelName(clone.name, clone.id), type: 'agent', agentId: clone.id }]);
    setSelectedAgentId(clone.id);
    setSelectedConnectionId('');
  };
  const connectNodes = addConnection;
  const removeNode = deleteAgent;
  const duplicateNode = duplicateAgent;
  const updateNodePosition = (nodeId: string, x: number, y: number) => {
    setAgents((prev) => prev.map((agent) => agent.id === nodeId ? { ...agent, position: clampNodePosition({ x, y }) } : agent));
  };
  const autoLayoutGraph = autoLayoutAgents;
  const resetView = fitCanvas;
  const highlightConnectedNodes = (nodeId: string) => {
    setSelectedAgentId(nodeId);
    setSelectedConnectionId('');
  };
  React.useEffect(() => {
    if (!isLive || connections.length === 0) return;
    const timer = window.setInterval(() => {
      setConnections((prev) => {
        if (prev.length === 0) return prev;
        const activeIndex = Math.max(0, prev.findIndex((connection) => connection.status === 'active'));
        const nextIndex = (activeIndex + 1) % prev.length;
        const nextConnection = prev[nextIndex];
        setMessages((current) => [
          ...current.slice(-40),
          {
            id: `flow-${Date.now()}`,
            channelId: 'updates',
            fromAgentId: nextConnection.fromAgentId,
            timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
            content: `${agentName(nextConnection.fromAgentId)} handed work to ${agentName(nextConnection.toAgentId)}.`,
          },
        ]);
        return prev.map((connection, index) => ({ ...connection, status: index === nextIndex ? 'active' : connection.status === 'active' ? 'normal' : connection.status, animated: index === nextIndex || connection.animated }));
      });
    }, 4500);
    return () => window.clearInterval(timer);
  }, [agentName, connections.length, isLive]);

  const AgentListPanel = () => (
    <aside className="flex h-full min-w-0 flex-col overflow-hidden border-r border-white/[0.07] bg-[#0a101d]">
      <div className="border-b border-white/[0.06] px-4 py-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200/60">Agents</p>
        <p className="mt-1 text-xs text-white/34">Small AI company created by AI Ant</p>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {agents.map((agent) => (
          <button key={agent.id} onClick={() => { setSelectedAgentId(agent.id); setSelectedConnectionId(''); }}
            className={`flex w-full items-center gap-3 rounded-[15px] border p-3 text-left transition ${selectedAgent?.id === agent.id ? 'border-violet-400/35 bg-violet-500/14 shadow-[0_0_28px_rgba(124,92,252,0.16)]' : 'border-white/[0.07] bg-white/[0.025] hover:bg-white/[0.05]'}`}>
            <AgentAvatar agent={agent} selected={selectedAgent?.id === agent.id} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="truncate text-sm font-bold text-white/85">{agent.name}</span>
                <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-bold text-white/38">{agent.code}</span>
              </span>
              <span className="mt-0.5 block truncate text-[11px] text-white/38">{roleLabel(agent)}</span>
              <SkillModelPills skills={skillsForCapabilities(inferCapabilitiesFromText(agent.name, agent.role, agent.dept, agent.tools))} compact />
              <span className="mt-1 block truncate text-[10px] text-white/28">{agent.taskSummary ?? agent.currentTask}</span>
              <span className="mt-2 block h-1 overflow-hidden rounded-full bg-white/[0.08]">
                <span className="block h-full rounded-full bg-gradient-to-r from-violet-400 to-emerald-300" style={{ width: `${agent.progress}%` }} />
              </span>
            </span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold capitalize ${agent.status === 'working' ? 'bg-emerald-400/10 text-emerald-200' : agent.status === 'thinking' ? 'bg-violet-400/10 text-violet-200' : agent.status === 'waiting' ? 'bg-amber-400/10 text-amber-200' : 'bg-white/[0.06] text-white/35'}`}>{statusLabel[agent.status]}</span>
          </button>
        ))}
        <button onClick={() => setAgentModal({ mode: 'add', position: { x: 420, y: 250 } })} className="flex w-full items-center justify-center gap-2 rounded-[15px] border border-dashed border-white/[0.10] px-3 py-3 text-xs font-semibold text-white/32 transition hover:border-white/[0.18] hover:text-white/55">
          <Plus size={14} />
          Add new agent
        </button>
      </div>
      <div className="m-3 rounded-[16px] border border-emerald-400/15 bg-emerald-400/[0.06] p-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-300" />
          <p className="text-xs font-bold text-emerald-200">System running</p>
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-white/38">{project.agents.length} agents online · {progress}% complete</p>
      </div>
    </aside>
  );

  const OrgAgentNode = ({ agent }: { agent: EnterpriseWorkspaceAgent }) => (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        if (nodeDragRef.current.moved) return;
        if (connectFromAgentId && connectFromAgentId !== agent.id) {
          connectNodes(connectFromAgentId, agent.id);
          setConnectFromAgentId('');
        }
        setSelectedAgentId(agent.id);
        setSelectedConnectionId('');
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setContextMenu({ x: event.clientX, y: event.clientY, kind: 'agent', agentId: agent.id });
      }}
      onPointerDown={(event) => {
        if ((event.target as HTMLElement).closest('[data-connect-handle], [data-add-agent-menu]')) return;
        event.stopPropagation();
        if (isLocked) return;
        nodeDragRef.current = { active: true, id: agent.id, startX: event.clientX, startY: event.clientY, originX: agent.position.x, originY: agent.position.y, moved: false };
        setDraggingAgentId(agent.id);
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const drag = nodeDragRef.current;
        if (!drag.active || drag.id !== agent.id) return;
        const dx = (event.clientX - drag.startX) / zoom;
        const dy = (event.clientY - drag.startY) / zoom;
        if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
        const position = clampNodePosition({ x: drag.originX + dx, y: drag.originY + dy });
        updateNodePosition(agent.id, position.x, position.y);
      }}
      onPointerUp={(event) => {
        if (nodeDragRef.current.id === agent.id) {
          nodeDragRef.current.active = false;
          setDraggingAgentId('');
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }}
      className={`absolute h-[92px] w-[204px] rounded-[18px] border p-3 text-left transition ${draggingAgentId === agent.id ? 'cursor-grabbing' : 'cursor-grab'} ${selectedAgent?.id === agent.id ? 'border-violet-300/55 bg-violet-500/18 shadow-[0_0_34px_rgba(124,92,252,0.28)]' : 'border-white/[0.10] bg-[#101827]/92 hover:border-white/[0.18]'}`}
      style={{ left: agent.position.x, top: agent.position.y }}
      data-agent-id={agent.id}
    >
      <span
        data-input-handle
        className="absolute left-1/2 top-0 h-3 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.12] bg-[#0b101d] shadow-[0_0_12px_rgba(124,92,252,0.18)]"
        title="Connection input"
      />
      <div className="flex items-center gap-2">
        <AgentAvatar agent={agent} size="sm" selected={selectedAgent?.id === agent.id} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="block min-w-0 truncate text-[12px] font-bold leading-tight text-white/88">{agent.name}</span>
            <span className="rounded bg-white/[0.06] px-1 text-[8px] font-bold text-white/38">{agent.code}</span>
          </span>
          <span className="mt-0.5 block truncate text-[10px] leading-tight text-white/35">{roleLabel(agent)}</span>
        </span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.08]">
        <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-emerald-300" style={{ width: `${agent.progress}%` }} />
      </div>
      <p className="mt-1 truncate text-[9px] text-white/28">{agent.taskSummary ?? agent.currentTask}</p>
      <span
        data-connect-handle
        onPointerDown={(event) => {
          event.stopPropagation();
          setAgentAddMenu(null);
          setConnectPreview({ fromAgentId: agent.id, to: { x: agent.position.x + 102, y: agent.position.y + 112 } });
          (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          setConnectPreview({ fromAgentId: agent.id, to: canvasPointFromClient(event.clientX, event.clientY) });
        }}
        onPointerUp={(event) => {
          const target = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
          const targetId = target?.closest('[data-input-handle]')?.closest('[data-agent-id]')?.getAttribute('data-agent-id')
            ?? target?.closest('[data-agent-id]')?.getAttribute('data-agent-id');
          if (targetId) connectNodes(agent.id, targetId);
          setConnectPreview(null);
        }}
        className="absolute bottom-0 left-1/2 grid h-5 w-5 -translate-x-1/2 translate-y-1/2 place-items-center rounded-full border border-cyan-200/35 bg-cyan-300/20 text-[10px] text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.25)]"
        title="Drag to connect"
      >
        ⟶
      </span>
      <button
        data-add-agent-menu
        onClick={(event) => {
          event.stopPropagation();
          setAgentAddMenu({ x: event.clientX, y: event.clientY, parentId: agent.id });
        }}
        className="absolute bottom-[-34px] left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/[0.10] bg-[#0b101d]/95 px-3 py-1.5 text-[10px] font-extrabold text-white/62 shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition hover:border-violet-300/35 hover:bg-violet-500/20 hover:text-white"
      >
        + Add
      </button>
    </div>
  );

  const OrganizationCanvas = () => (
    <section className="relative h-full min-h-0 overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#09111f] shadow-[0_24px_80px_rgba(0,0,0,0.22)]"
      style={{
        backgroundImage: 'linear-gradient(rgba(124,92,252,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(124,92,252,0.08) 1px, transparent 1px), radial-gradient(circle at 50% 0%, rgba(124,92,252,0.18), transparent 55%)',
        backgroundSize: '28px 28px, 28px 28px, 100% 100%',
      }}>
      {/* Toolbar — top-right grouped pill, no overlap with nodes */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-end p-3">
        <div className="pointer-events-auto flex items-center gap-0.5 rounded-[12px] border border-white/[0.09] bg-[#07080f]/85 px-2 py-1.5 backdrop-blur-sm">
          <button onClick={() => setZoom(1)} title="Reset to 100%" className="rounded-[7px] px-2 py-1 text-[10px] font-bold tabular-nums text-white/55 transition hover:bg-white/[0.07] hover:text-white/85">{Math.round(zoom * 100)}%</button>
          <span className="mx-0.5 h-3.5 w-px shrink-0 bg-white/[0.10]" />
          <button onClick={() => setZoom((c) => clampZoom(c - 0.1))} title="Zoom out" className="rounded-[7px] px-2.5 py-1 text-[12px] font-bold text-white/55 transition hover:bg-white/[0.07] hover:text-white/85">−</button>
          <button onClick={() => setZoom((c) => clampZoom(c + 0.1))} title="Zoom in" className="rounded-[7px] px-2.5 py-1 text-[12px] font-bold text-white/55 transition hover:bg-white/[0.07] hover:text-white/85">+</button>
          <span className="mx-0.5 h-3.5 w-px shrink-0 bg-white/[0.10]" />
          <button onClick={resetView} title="Fit all nodes in view" className="rounded-[7px] px-2 py-1 text-[10px] font-bold text-white/55 transition hover:bg-white/[0.07] hover:text-white/85">Fit</button>
          <button onClick={() => setIsLocked((l) => !l)} title={isLocked ? 'Unlock panning' : 'Lock panning'} className={`rounded-[7px] px-2 py-1 text-[10px] font-bold transition ${isLocked ? 'bg-amber-400/12 text-amber-200 hover:bg-amber-400/20' : 'text-white/55 hover:bg-white/[0.07] hover:text-white/85'}`}>{isLocked ? 'Unlock' : 'Lock'}</button>
          <button onClick={autoLayoutGraph} title="Reset node layout" className="rounded-[7px] px-2 py-1 text-[10px] font-bold text-white/55 transition hover:bg-white/[0.07] hover:text-white/85">Layout</button>
          <span className="mx-0.5 h-3.5 w-px shrink-0 bg-white/[0.10]" />
          <button onClick={() => setIsLive((l) => !l)} title="Toggle live updates" className={`flex items-center gap-1.5 rounded-[7px] px-2 py-1 text-[10px] font-bold transition ${isLive ? 'text-emerald-200 hover:bg-emerald-400/10' : 'text-white/35 hover:bg-white/[0.07] hover:text-white/60'}`}>
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isLive ? 'animate-pulse bg-emerald-300' : 'bg-white/25'}`} />
            Live
          </button>
        </div>
      </div>
      <div
        className={`absolute inset-0 ${isLocked ? 'cursor-default' : isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerCancel={() => setIsPanning(false)}
        onWheel={handleCanvasWheel}
        onContextMenu={(event) => {
          event.preventDefault();
          setContextMenu({ x: event.clientX, y: event.clientY, kind: 'canvas', canvasPoint: canvasPointFromClient(event.clientX, event.clientY) });
        }}
      >
        <div
          ref={canvasStageRef}
          className="absolute left-1/2 top-1/2 h-[2000px] w-[3000px]"
          style={{
            transform: `translate(calc(-50% + ${canvasPosition.x}px), calc(-50% + ${canvasPosition.y}px)) scale(${zoom})`,
            transformOrigin: 'center',
          }}
        >
          {/* Department zones — sit behind connections and agent cards. */}
          {departments.map((dept) => {
            const tone = ENTERPRISE_DEPARTMENT_COLOR_MAP[dept.color];
            const active = selectedChannel.departmentId === dept.id;
            return (
              <button
                key={dept.id}
                onClick={(e) => { e.stopPropagation(); const ch = channels.find((c) => c.id === dept.channelId); if (ch) setSelectedChannelId(ch.id); }}
                style={{ left: dept.bounds.x, top: dept.bounds.y, width: dept.bounds.width, height: dept.bounds.height }}
                className={`absolute rounded-[20px] border-2 border-dashed text-left transition ${tone.bg} ${active ? `${tone.border} shadow-[0_0_24px_rgba(124,92,252,0.18)]` : 'border-white/[0.08] hover:border-white/15'}`}
                title={`${dept.name} · ${dept.agentIds.length} agent${dept.agentIds.length === 1 ? '' : 's'}`}>
                <span className={`absolute left-3 top-2 flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold ${tone.border} ${tone.bg} ${tone.text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                  {dept.name}
                </span>
              </button>
            );
          })}
          <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 3000 2000" fill="none">
            <defs>
              <linearGradient id="enterpriseFlowGradient" x1="0" x2="1">
                <stop offset="0%" stopColor="rgba(167,139,250,0.18)" />
                <stop offset="50%" stopColor="rgba(34,211,238,0.75)" />
                <stop offset="100%" stopColor="rgba(52,211,153,0.42)" />
              </linearGradient>
            </defs>
            {connections.map((connection) => {
              const from = agents.find((agent) => agent.id === connection.fromAgentId);
              const to = agents.find((agent) => agent.id === connection.toAgentId);
              if (!from || !to) return null;
              const sx = from.position.x + 102;
              const sy = from.position.y + 92;
              const tx = to.position.x + 102;
              const ty = to.position.y;
              const midY = sy + Math.max(34, (ty - sy) / 2);
              const d = `M ${sx} ${sy} V ${midY} H ${tx} V ${ty}`;
              const active = connection.status === 'active' || selectedConnectionId === connection.id;
              const stroke =
                connection.status === 'blocked' ? 'rgba(248,113,113,0.68)' :
                connection.status === 'completed' ? 'rgba(52,211,153,0.55)' :
                active ? 'url(#enterpriseFlowGradient)' :
                'rgba(167,139,250,0.28)';
              return (
                <g key={connection.id} className="cursor-pointer" onClick={(event) => { event.stopPropagation(); setSelectedConnectionId(connection.id); setSelectedAgentId(''); }} onContextMenu={(event) => { event.preventDefault(); event.stopPropagation(); setContextMenu({ x: event.clientX, y: event.clientY, kind: 'connection', connectionId: connection.id }); }}>
                  <path d={d} stroke="transparent" strokeWidth="14" strokeLinecap="round" fill="none" />
                  <path d={d} stroke={stroke} strokeWidth={active ? 3 : 2} strokeLinecap="round" strokeLinejoin="round" fill="none" strokeDasharray={connection.animated ? '8 10' : undefined}>
                    {connection.animated && <animate attributeName="stroke-dashoffset" from="18" to="0" dur="1.2s" repeatCount="indefinite" />}
                  </path>
                  {active && <circle r="4" fill="#67e8f9"><animateMotion dur="1.6s" repeatCount="indefinite" path={d} /></circle>}
                </g>
              );
            })}
            {connectPreview && (() => {
              const from = agents.find((agent) => agent.id === connectPreview.fromAgentId);
              if (!from) return null;
              const sx = from.position.x + 102;
              const sy = from.position.y + 92;
              const midY = sy + Math.max(28, (connectPreview.to.y - sy) / 2);
              return <path d={`M ${sx} ${sy} V ${midY} H ${connectPreview.to.x} V ${connectPreview.to.y}`} stroke="rgba(34,211,238,0.8)" strokeWidth="2" strokeDasharray="6 6" fill="none" />;
            })()}
          </svg>
          {agents.length === 0 && (
            <div className="absolute left-1/2 top-1/2 w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-[20px] border border-dashed border-white/[0.12] bg-black/20 p-5 text-center">
              <p className="font-heading text-base font-bold text-white/78">No agents yet</p>
              <p className="mt-2 text-sm text-white/38">Right-click the grid or click Add Agent to create one.</p>
            </div>
          )}
          {agents.map((agent) => (
            <div key={agent.id} data-agent-id={agent.id}>
              <OrgAgentNode agent={agent} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const DepartmentModal = () => {
    const mode = deptModal?.mode ?? 'create';
    const existing = mode === 'manage' && deptModal?.departmentId
      ? departments.find((d) => d.id === deptModal.departmentId)
      : undefined;
    const [name, setName] = React.useState(existing?.name ?? '');
    const [color, setColor] = React.useState<EnterpriseDepartmentColor>(existing?.color ?? 'purple');
    const [agentIds, setAgentIds] = React.useState<string[]>(existing?.agentIds ?? []);
    const [error, setError] = React.useState<string | null>(null);
    const close = () => setDeptModal(null);
    const submit = () => {
      const trimmed = name.trim();
      if (!trimmed) { setError('Department name is required.'); return; }
      const duplicate = departments.some((d) => d.name.toLowerCase() === trimmed.toLowerCase() && d.id !== existing?.id);
      if (duplicate) { setError('A department with that name already exists.'); return; }
      if (existing) {
        updateDepartment(existing.id, { name: trimmed, color });
        setDepartmentAgents(existing.id, agentIds);
      } else {
        createDepartment(trimmed, color, agentIds);
      }
      close();
    };
    return (
      <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={close}>
        <div className="w-full max-w-md rounded-[18px] border border-white/[0.10] bg-[#0a0d18] p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading text-lg font-bold text-white">{existing ? 'Manage department' : 'Create department'}</h3>
            <button onClick={close} className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 text-white/55 hover:text-white"><X size={14} /></button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-white/40">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Research, Content, Operations"
                className="w-full rounded-[10px] border border-white/[0.10] bg-[#0b0f1a] px-3 py-2 text-sm text-white outline-none focus:border-violet-400/50" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-white/40">Color</label>
              <div className="flex flex-wrap gap-1.5">
                {ENTERPRISE_DEPARTMENT_COLORS.map((c) => {
                  const tone = ENTERPRISE_DEPARTMENT_COLOR_MAP[c];
                  return (
                    <button key={c} onClick={() => setColor(c)} title={c}
                      className={`grid h-8 w-8 place-items-center rounded-[10px] border transition ${color === c ? `${tone.border} ring-2 ${tone.ring}` : 'border-white/[0.10]'}`}>
                      <span className={`h-3.5 w-3.5 rounded-full ${tone.dot}`} />
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-white/40">Agents</label>
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-[10px] border border-white/[0.08] bg-white/[0.02] p-2">
                {agents.map((a) => {
                  const checked = agentIds.includes(a.id);
                  return (
                    <label key={a.id} className="flex cursor-pointer items-center gap-2 rounded-[8px] px-2 py-1.5 hover:bg-white/[0.04]">
                      <input type="checkbox" checked={checked} onChange={(e) =>
                        setAgentIds((prev) => e.target.checked ? [...prev, a.id] : prev.filter((id) => id !== a.id))}
                        className="accent-violet-500" />
                      <span className="relative grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-md border border-white/[0.10] bg-[#f4f4f8]">
                        <img src={a.avatar} alt="" className="h-full w-full object-cover" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-xs text-white/75">{a.name}</span>
                      <span className="text-[10px] text-white/30">{a.dept}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            {error && <p className="text-xs font-semibold text-red-400">{error}</p>}
          </div>
          <div className="mt-5 flex gap-2">
            <button onClick={close} className="flex-1 rounded-[10px] border border-white/[0.12] px-3 py-2.5 text-sm font-semibold text-white/55 hover:text-white">Cancel</button>
            {existing && (
              <button onClick={() => autoFitDepartment(existing.id)} className="rounded-[10px] border border-white/[0.12] px-3 py-2.5 text-sm font-semibold text-white/55 hover:text-white" title="Auto-fit zone bounds to current member positions">Auto fit</button>
            )}
            <button onClick={submit} className="flex-1 rounded-[10px] bg-[#ffffff] px-3 py-2.5 text-sm font-bold text-[#070B14] hover:bg-[#f0f2ff]">{existing ? 'Save' : 'Create'}</button>
          </div>
        </div>
      </div>
    );
  };

  const AddAgentModal = () => {
    const editing = agentModal?.mode === 'edit' ? agentModal.agent : undefined;
    const [name, setName] = React.useState(editing?.name ?? '');
    const [role, setRole] = React.useState(editing?.role ?? 'Research Agent');
    const [dept, setDept] = React.useState(editing?.dept ?? 'Research');
    const [task, setTask] = React.useState(editing?.currentTask ?? editing?.taskSummary ?? '');
    const [addChannel, setAddChannel] = React.useState(true);
    const [connectSelected, setConnectSelected] = React.useState(Boolean(agentModal?.connectToSelected));
    const [error, setError] = React.useState('');
    if (!agentModal) return null;
    const save = () => {
      const cleanName = name.trim();
      const cleanRole = role.trim();
      if (!cleanName) return setError('Agent name is required.');
      if (!cleanRole) return setError('Role is required.');
      const duplicate = agents.some((agent) => agent.id !== editing?.id && agent.name.toLowerCase() === cleanName.toLowerCase());
      if (duplicate) return setError('An agent with this name already exists.');
      if (editing) {
        const agentSkills = skillsForCapabilities(inferCapabilitiesFromText(cleanName, cleanRole, dept, task));
        const updated: EnterpriseWorkspaceAgent = { ...editing, name: cleanName, role: cleanRole, dept: dept.trim() || 'General', currentTask: task.trim(), taskSummary: task.trim() || editing.taskSummary, code: enterpriseCodeForAgent({ ...editing, name: cleanName, role: cleanRole, dept }), agentSkills, activeModel: defaultActiveModel(agentSkills) };
        setAgents((prev) => prev.map((agent) => agent.id === editing.id ? updated : agent));
        setChannels((prev) => prev.map((channel) => channel.agentId === editing.id ? { ...channel, name: makeAgentChannelName(cleanName, channel.id) } : channel));
        setAgentModal(null);
        setEnterpriseModelPicker({ agentId: editing.id, skillId: agentSkills[0]?.id ?? 'skill-text_reasoning' });
        return;
      }
      const parentId = connectSelected ? selectedAgentId : undefined;
      const newAgent = createEnterpriseAgent({
        name: cleanName,
        role: cleanRole,
        dept: dept.trim() || 'General',
        position: agentModal.position ?? { x: 420, y: 260 },
        parentId,
        task: task.trim() || 'Define first responsibility',
      });
      setAgents((prev) => [...prev, newAgent]);
      if (addChannel) setChannels((prev) => [...prev, { id: `agent-${newAgent.id}`, name: makeAgentChannelName(cleanName, newAgent.id), type: 'agent', agentId: newAgent.id }]);
      if (parentId) addConnection(parentId, newAgent.id);
      setSelectedAgentId(newAgent.id);
      setSelectedConnectionId('');
      setAgentModal(null);
      setEnterpriseModelPicker({ agentId: newAgent.id, skillId: newAgent.agentSkills?.[0]?.id ?? 'skill-text_reasoning' });
    };
    return (
      <div className="fixed inset-0 z-[260] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-[24px] border border-white/[0.10] bg-[#0b101d] p-5 text-white shadow-[0_24px_90px_rgba(0,0,0,0.55)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-heading text-lg font-extrabold">{editing ? 'Edit agent' : 'Add agent'}</h3>
              <p className="mt-1 text-sm text-white/38">Create or update an AI role on this organization canvas.</p>
            </div>
            <button onClick={() => setAgentModal(null)} className="grid h-8 w-8 place-items-center rounded-[10px] text-white/45 hover:bg-white/[0.07]"><X size={15} /></button>
          </div>
          <div className="mt-4 space-y-3">
            <label className="block text-xs font-bold text-white/50">Agent name<input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-[12px] border border-white/[0.10] bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400/45" /></label>
            <label className="block text-xs font-bold text-white/50">Role<select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 w-full rounded-[12px] border border-white/[0.10] bg-[#101827] px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400/45">
              {['Project Manager', 'Research Agent', 'Analyst Agent', 'Writer Agent', 'Image Generation Agent', 'Video Generation Agent', 'Voice Agent', 'Quality Checker', 'Operations Agent', 'Strategy Agent', 'Custom Agent'].map((option) => <option key={option}>{option}</option>)}
            </select></label>
            <div className="rounded-[12px] border border-white/[0.08] bg-white/[0.03] px-3 py-2">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-white/35">Skill selection</p>
              <SkillModelPills skills={skillsForCapabilities(inferCapabilitiesFromText(name, role, dept, task))} compact />
            </div>
            <label className="block text-xs font-bold text-white/50">Department / type<input value={dept} onChange={(e) => setDept(e.target.value)} className="mt-1 w-full rounded-[12px] border border-white/[0.10] bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400/45" /></label>
            <label className="block text-xs font-bold text-white/50">Current task<textarea value={task} onChange={(e) => setTask(e.target.value)} rows={3} className="mt-1 w-full resize-none rounded-[12px] border border-white/[0.10] bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400/45" /></label>
            {!editing && (
              <div className="grid gap-2 text-xs font-semibold text-white/55">
                <label className="flex items-center gap-2"><input type="checkbox" checked={addChannel} onChange={(e) => setAddChannel(e.target.checked)} /> Add chat channel</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={connectSelected} onChange={(e) => setConnectSelected(e.target.checked)} /> Connect to selected agent</label>
              </div>
            )}
            {error && <p className="rounded-[10px] border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200">{error}</p>}
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setAgentModal(null)} className="rounded-[11px] border border-white/[0.10] px-4 py-2 text-xs font-bold text-white/55 hover:text-white">Cancel</button>
            <button onClick={save} className="rounded-[11px] bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500">{editing ? 'Save agent' : 'Add agent'}</button>
          </div>
        </div>
      </div>
    );
  };

  const EnterpriseContextMenu = () => {
    if (!contextMenu) return null;
    const itemClass = 'block w-full rounded-[9px] px-3 py-2 text-left text-xs font-semibold text-white/68 transition hover:bg-white/[0.07] hover:text-white';
    const dangerClass = 'block w-full rounded-[9px] px-3 py-2 text-left text-xs font-semibold text-red-200/80 transition hover:bg-red-500/[0.12] hover:text-red-100';
    const close = () => setContextMenu(null);
    const targetAgent = contextMenu.agentId ? agents.find((agent) => agent.id === contextMenu.agentId) : undefined;
    const targetConnection = contextMenu.connectionId ? connections.find((connection) => connection.id === contextMenu.connectionId) : undefined;
    return (
      <div className="fixed inset-0 z-[250]" onClick={close} onContextMenu={(event) => { event.preventDefault(); close(); }}>
        <div className="absolute w-52 rounded-[14px] border border-white/[0.10] bg-[#0b101d]/98 p-1.5 text-white shadow-[0_18px_60px_rgba(0,0,0,0.45)]" style={{ left: contextMenu.x, top: contextMenu.y }} onClick={(event) => event.stopPropagation()}>
          {contextMenu.kind === 'canvas' && (
            <>
              <button className={itemClass} onClick={() => { setAgentModal({ mode: 'add', position: contextMenu.canvasPoint }); close(); }}>Add Agent</button>
              <button className={itemClass} onClick={() => { autoLayoutGraph(); close(); }}>Auto tidy layout</button>
              <button className={itemClass} onClick={() => { resetView(); close(); }}>Reset View</button>
              <button className={itemClass} onClick={() => { setSelectedAgentId(''); setSelectedConnectionId(''); close(); }}>Clear Selection</button>
            </>
          )}
          {contextMenu.kind === 'agent' && targetAgent && (
            <>
              <button className={itemClass} onClick={() => { addChildNode(targetAgent.id); close(); }}>Add child agent</button>
              <button className={itemClass} onClick={() => { setAgentModal({ mode: 'edit', agent: targetAgent }); close(); }}>Edit agent</button>
              <button className={itemClass} onClick={() => { setConnectFromAgentId(targetAgent.id); close(); }}>Connect from this agent</button>
              <button className={itemClass} onClick={() => { duplicateNode(targetAgent.id); close(); }}>Duplicate agent</button>
              <button className={itemClass} onClick={() => {
                const channelId = channels.find((channel) => channel.agentId === targetAgent.id)?.id ?? `agent-${targetAgent.id}`;
                if (!channels.some((channel) => channel.id === channelId)) {
                  setChannels((prev) => [...prev, { id: channelId, name: makeAgentChannelName(targetAgent.name, targetAgent.id), type: 'agent', agentId: targetAgent.id }]);
                }
                setSelectedChannelId(channelId);
                setSelectedAgentId(targetAgent.id);
                close();
              }}>Open chat channel</button>
              <button className={itemClass} onClick={() => { highlightConnectedNodes(targetAgent.id); close(); }}>Set as active</button>
              <button className={itemClass} onClick={() => { highlightConnectedNodes(targetAgent.id); close(); }}>View details</button>
              <button className={dangerClass} onClick={() => { close(); removeNode(targetAgent.id); }}>Delete agent</button>
            </>
          )}
          {contextMenu.kind === 'connection' && targetConnection && (
            <>
              <button className={itemClass} onClick={() => { setConnections((prev) => prev.map((connection) => connection.id === targetConnection.id ? { ...connection, status: 'active', animated: true } : connection)); close(); }}>Mark active</button>
              <button className={itemClass} onClick={() => { setConnections((prev) => prev.map((connection) => connection.id === targetConnection.id ? { ...connection, status: 'completed' } : connection)); close(); }}>Mark completed</button>
              <button className={dangerClass} onClick={() => { setConnections((prev) => prev.filter((connection) => connection.id !== targetConnection.id)); setSelectedConnectionId(''); close(); }}>Delete connection</button>
            </>
          )}
        </div>
      </div>
    );
  };

  const AgentAddMenu = () => {
    if (!agentAddMenu) return null;
    const parent = agents.find((agent) => agent.id === agentAddMenu.parentId);
    if (!parent) return null;
    const itemClass = 'block w-full rounded-[9px] px-3 py-2 text-left text-xs font-semibold text-white/70 transition hover:bg-white/[0.07] hover:text-white';
    const close = () => setAgentAddMenu(null);
    return (
      <div className="fixed inset-0 z-[255]" onClick={close}>
        <div
          data-add-agent-menu
          className="absolute w-48 rounded-[14px] border border-white/[0.10] bg-[#0b101d]/98 p-1.5 text-white shadow-[0_18px_60px_rgba(0,0,0,0.45)]"
          style={{ left: agentAddMenu.x - 96, top: agentAddMenu.y + 8 }}
          onClick={(event) => event.stopPropagation()}
        >
          <button className={itemClass} onClick={() => { addChildNode(parent.id); close(); }}>Add Agent</button>
          <button className={itemClass} onClick={() => { addChildNode(parent.id, true); close(); }}>Add Connected Agent</button>
          <button className={itemClass} onClick={() => {
            setMessages((prev) => [...prev, {
              id: `note-${Date.now()}`,
              channelId: 'updates',
              fromAgentId: parent.id,
              timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
              content: `Note placeholder added under ${parent.name}. TODO: persist editable note cards on the canvas.`,
            }]);
            close();
          }}>Add Note</button>
        </div>
      </div>
    );
  };

  const channelSubtitle: Record<string, string> = {
    general: 'Team conversation & updates',
    task: 'Task coordination & handoffs',
    research: 'Research findings & sources',
    strategy: 'Strategy discussion',
    updates: 'Project status & updates',
    team: 'Direct messages',
  };

  const AgentChannelChat = () => {
    // Group channels for the left sidebar — Group Chats / Departments / Direct Agents.
    const groupChannels = channels.filter((c) => (c.type === 'system' || c.type === 'team') && !c.archived);
    const deptChannels = channels.filter((c) => c.type === 'department' && !c.archived);
    const agentChannels = channels.filter((c) => c.type === 'agent' && !c.archived);
    const selectedDept = selectedChannel.type === 'department'
      ? departments.find((d) => d.id === selectedChannel.departmentId)
      : undefined;
    const selectedDmAgent = selectedChannel.type === 'agent'
      ? agents.find((a) => a.id === selectedChannel.agentId)
      : undefined;
    const deptColorClass = selectedDept ? ENTERPRISE_DEPARTMENT_COLOR_MAP[selectedDept.color] : null;
    const headerTitle = selectedDept ? selectedDept.name
      : selectedDmAgent ? selectedDmAgent.name
      : selectedChannel.type === 'team' ? 'Team'
      : `# ${selectedChannel.name}`;
    const headerSubtitle = selectedDept ? `${selectedDept.agentIds.length} member${selectedDept.agentIds.length === 1 ? '' : 's'} · ${selectedDept.color}`
      : selectedDmAgent ? `${roleLabel(selectedDmAgent)} · ${statusLabel[selectedDmAgent.status]}`
      : (channelSubtitle[selectedChannel.id] ?? 'Team conversation & updates');
    const composerPlaceholder = selectedDept ? `Message #${selectedChannel.name}…`
      : selectedDmAgent ? `Message ${selectedDmAgent.name}…`
      : `Message ${selectedChannel.type === 'team' ? 'Team' : `#${selectedChannel.name}`}`;

    const sidebarRow = (key: string, active: boolean, onClick: () => void, content: React.ReactNode) => (
      <button key={key} onClick={onClick}
        className={`group flex w-full items-center gap-2 rounded-[10px] px-2.5 py-1.5 text-left transition ${
          active ? 'bg-violet-500/15 text-white' : 'text-white/55 hover:bg-white/[0.05] hover:text-white/85'}`}>
        {content}
      </button>
    );

    return (
      <section className="grid h-full min-h-0 select-none overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#0a101d]" style={{ gridTemplateColumns: '232px minmax(0, 1fr)' }}>
        {/* ── Left chat sidebar ── */}
        <aside className="flex min-h-0 flex-col overflow-y-auto border-r border-white/[0.07] bg-[#080c16] px-2.5 py-3">
          {/* Group Chats */}
          <p className="px-2 pt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">Group Chats</p>
          <div className="mt-1.5 space-y-0.5">
            {groupChannels.map((ch) => sidebarRow(ch.id, selectedChannelId === ch.id, () => setSelectedChannelId(ch.id),
              <>
                <span className="text-[11px] text-white/35">{ch.type === 'team' ? <Users size={11} /> : '#'}</span>
                <span className="truncate text-[13px] font-semibold">{ch.name}</span>
              </>
            ))}
          </div>

          {/* Departments */}
          <div className="mt-4 flex items-center justify-between px-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">Departments</p>
            <button onClick={() => setDeptModal({ mode: 'create' })} title="Create department"
              className="grid h-5 w-5 place-items-center rounded-md text-white/35 transition hover:bg-white/[0.06] hover:text-white">
              <Plus size={12} />
            </button>
          </div>
          <div className="mt-1.5 space-y-0.5">
            {deptChannels.length === 0 ? (
              <p className="px-2 py-1.5 text-[10px] leading-snug text-white/25">No departments yet. Tap + to group agents.</p>
            ) : deptChannels.map((ch) => {
              const dept = departments.find((d) => d.id === ch.departmentId);
              const tone = dept ? ENTERPRISE_DEPARTMENT_COLOR_MAP[dept.color] : null;
              return sidebarRow(ch.id, selectedChannelId === ch.id, () => setSelectedChannelId(ch.id),
                <>
                  <span className={`h-2 w-2 shrink-0 rounded-full ${tone?.dot ?? 'bg-white/40'}`} />
                  <span className="truncate text-[13px] font-semibold">{dept?.name ?? ch.name}</span>
                  {dept && <span className="ml-auto text-[10px] text-white/30">{dept.agentIds.length}</span>}
                </>
              );
            })}
          </div>

          {/* Direct Agents */}
          <p className="mt-4 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">Direct Agents</p>
          <div className="mt-1.5 space-y-0.5">
            {agentChannels.map((ch) => {
              const a = agents.find((ag) => ag.id === ch.agentId);
              if (!a) return null;
              return sidebarRow(ch.id, selectedChannelId === ch.id, () => { setSelectedChannelId(ch.id); setSelectedAgentId(a.id); },
                <>
                  <span className="relative grid h-6 w-6 shrink-0 place-items-center overflow-hidden rounded-md border border-white/[0.10] bg-[#f4f4f8]">
                    <img src={a.avatar} alt={a.name} draggable={false} className="h-full w-full object-cover" />
                    <span className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-[#080c16] ${statusDot[a.status]}`} />
                  </span>
                  <span className="truncate text-[12px] font-semibold">{a.name}</span>
                </>
              );
            })}
          </div>
        </aside>

        {/* ── Right conversation area ── */}
        <div className="flex min-h-0 flex-col">
          <header className={`flex shrink-0 items-center justify-between border-b border-white/[0.07] px-5 py-3.5 ${selectedDept ? deptColorClass?.bg : ''}`}>
            <div className="flex min-w-0 items-center gap-3">
              {selectedDept && deptColorClass && (
                <span className={`grid h-9 w-9 place-items-center rounded-[12px] ${deptColorClass.bg} ${deptColorClass.border} border`}>
                  <span className={`h-2.5 w-2.5 rounded-full ${deptColorClass.dot}`} />
                </span>
              )}
              {selectedDmAgent && <AgentAvatar agent={selectedDmAgent} size="sm" />}
              <div className="min-w-0">
                <h3 className="truncate font-heading text-base font-extrabold text-white">{headerTitle}</h3>
                <p className="truncate text-xs text-white/35">{headerSubtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedDept && (
                <>
                  <button onClick={() => setDeptModal({ mode: 'manage', departmentId: selectedDept.id })}
                    className="rounded-[10px] border border-white/[0.10] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/60 transition hover:text-white">Manage</button>
                  <button onClick={() => { if (confirm(`Delete department "${selectedDept.name}"?`)) deleteDepartment(selectedDept.id); }}
                    className="grid h-9 w-9 place-items-center rounded-[10px] border border-red-400/25 bg-red-500/[0.08] text-red-300 transition hover:bg-red-500/[0.16]" title="Delete department">
                    <X size={14} />
                  </button>
                </>
              )}
              <button className="grid h-9 w-9 place-items-center rounded-[10px] border border-white/[0.08] bg-white/[0.04] text-white/40"><LinkIcon size={14} /></button>
            </div>
          </header>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
            {visibleMessages.length === 0 ? (
              <p className="py-10 text-center text-xs text-white/30">No messages in this channel yet.</p>
            ) : visibleMessages.map((message) => {
              const agent = agents.find((item) => item.id === message.fromAgentId) ?? agents[0];
              return (
                <div key={message.id} className="flex gap-3">
                  <button onClick={() => setSelectedAgentId(agent.id)} className="shrink-0"><AgentAvatar agent={agent} /></button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSelectedAgentId(agent.id)} className="text-sm font-bold text-white/88 hover:text-violet-200">{agent.name}</button>
                      <span className="text-[10px] text-white/24">{message.timestamp}</span>
                      <span className={`h-1.5 w-1.5 rounded-full ${statusDot[agent.status]}`} />
                    </div>
                    <p className="mt-1 max-w-3xl text-sm leading-relaxed text-white/56">{message.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="shrink-0 border-t border-white/[0.07] p-4">
            <div className="flex items-center gap-2 rounded-[16px] border border-white/[0.08] bg-white/[0.035] px-3 py-2">
              <button className="grid h-8 w-8 place-items-center rounded-[10px] text-white/35 transition hover:bg-white/[0.07] hover:text-white/70"><Plus size={16} /></button>
              <input className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/28" placeholder={composerPlaceholder} />
              <button className="grid h-8 w-8 place-items-center rounded-[10px] text-white/35 transition hover:bg-white/[0.07] hover:text-white/70">@</button>
              <button className="grid h-8 w-8 place-items-center rounded-[10px] text-white/35 transition hover:bg-white/[0.07] hover:text-white/70">☺</button>
              <button className="grid h-8 w-8 place-items-center rounded-[10px] bg-violet-600 text-white transition hover:bg-violet-500"><ArrowRight size={15} /></button>
            </div>
          </div>
        </div>
      </section>
    );
  };

  const AgentInspectorPanel = () => selectedConnection ? (
    <aside className="flex h-full min-w-0 flex-col overflow-y-auto border-l border-white/[0.07] bg-[#0a101d] p-4">
      <div className="rounded-[22px] border border-cyan-300/20 bg-cyan-400/[0.05] p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-200/60">Selected connection</p>
        <h3 className="mt-2 font-heading text-lg font-extrabold text-white/90">{selectedConnection.label ?? 'Agent handoff'}</h3>
        <p className="mt-1 text-sm text-white/45">{agentName(selectedConnection.fromAgentId)} → {agentName(selectedConnection.toAgentId)}</p>
      </div>
      <div className="mt-3 rounded-[20px] border border-white/[0.08] bg-white/[0.03] p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">Connection details</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <span className="text-white/32">Type</span><span className="capitalize text-white/70">{selectedConnection.type.replace(/_/g, ' ')}</span>
          <span className="text-white/32">Status</span><span className="capitalize text-white/70">{selectedConnection.status}</span>
          <span className="text-white/32">Animated</span><span className="text-white/70">{selectedConnection.animated ? 'On' : 'Off'}</span>
          <span className="text-white/32">Last handoff</span><span className="text-white/70">{selectedConnection.lastHandoff ?? 'None yet'}</span>
        </div>
        <label className="mt-4 flex items-center justify-between rounded-[12px] border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white/55">
          Animated flow
          <input type="checkbox" checked={Boolean(selectedConnection.animated)} onChange={(event) => setConnections((prev) => prev.map((connection) => connection.id === selectedConnection.id ? { ...connection, animated: event.target.checked } : connection))} />
        </label>
        <button onClick={() => { setConnections((prev) => prev.filter((connection) => connection.id !== selectedConnection.id)); setSelectedConnectionId(''); }} className="mt-4 w-full rounded-[12px] border border-red-400/20 bg-red-500/[0.08] px-3 py-2 text-xs font-bold text-red-200 hover:bg-red-500/[0.12]">Delete connection</button>
      </div>
    </aside>
  ) : selectedAgent ? (
    <aside className="flex h-full min-w-0 flex-col overflow-y-auto border-l border-white/[0.07] bg-[#0a101d] p-4">
      <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.035] p-4">
        <div className="flex items-start gap-3">
          <AgentAvatar agent={selectedAgent} size="xl" selected />
          <div className="min-w-0 flex-1">
            <h3 className="font-heading text-lg font-extrabold text-white/90">{selectedAgent.name}</h3>
            <p className="mt-0.5 text-sm text-violet-200/62">{roleLabel(selectedAgent)}</p>
            <p className="mt-1 text-xs capitalize text-emerald-200/55">{statusLabel[selectedAgent.status]}</p>
          </div>
          <div className="flex gap-1">
            {[MessageSquare, Eye].map((Icon, index) => <button key={index} className="grid h-8 w-8 place-items-center rounded-[10px] border border-white/[0.08] bg-white/[0.04] text-white/35"><Icon size={13} /></button>)}
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-[20px] border border-white/[0.08] bg-white/[0.03] p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">Current task</p>
        <h4 className="mt-2 text-sm font-bold text-white/84">{selectedAgent.currentTask ?? 'Define operating goal'}</h4>
        <p className="mt-2 text-xs leading-relaxed text-white/42">Define what this AI organization needs to produce first.</p>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.08]"><div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-cyan-300" style={{ width: `${selectedAgent.progress}%` }} /></div>
          <span className="text-xs font-bold text-white/45">{selectedAgent.progress}%</span>
        </div>
      </div>

      <div className="mt-3 rounded-[20px] border border-white/[0.08] bg-white/[0.03] p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">Thinking now</p>
        <p className="mt-2 text-sm leading-relaxed text-white/56">{selectedAgent.name === 'AI Ant Director' ? 'Clarifying the organization’s primary objective to align all agents and resources.' : selectedAgent.thoughtsSummary}</p>
        <div className="mt-3 space-y-2">
          {thinkingBullets.map((item) => (
            <div key={item} className="flex gap-2 text-xs leading-relaxed text-white/45">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-300/70" />
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 rounded-[20px] border border-white/[0.08] bg-white/[0.03] p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">Tools in use</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(selectedAgent.tools.length ? selectedAgent.tools : ['Knowledge Base', 'Web Search', 'Memory', 'Data Analyzer']).map((tool) => (
            <span key={tool} className="rounded-full border border-white/[0.07] bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-white/48">{tool}</span>
          ))}
        </div>
      </div>

      <div className="mt-3 rounded-[20px] border border-white/[0.08] bg-white/[0.03] p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">Skills & Models</p>
          <span className="rounded-full border border-emerald-300/18 bg-emerald-400/[0.08] px-2 py-0.5 text-[9px] font-bold text-emerald-100">Auto routing</span>
        </div>
        <div className="mt-3 space-y-2">
          <ModelRoutingSummary
            skills={selectedAgent.agentSkills ?? skillsForCapabilities(inferCapabilitiesFromText(selectedAgent.name, selectedAgent.role, selectedAgent.dept, selectedAgent.tools).slice(0, 3))}
            activeModel={selectedAgent.activeModel}
            onChange={(skill) => setEnterpriseModelPicker({ agentId: selectedAgent.id, skillId: skill.id })}
          />
        </div>
        <button onClick={() => {
          const skills = selectedAgent.agentSkills ?? skillsForCapabilities(inferCapabilitiesFromText(selectedAgent.name, selectedAgent.role, selectedAgent.dept, selectedAgent.tools));
          setEnterpriseModelPicker({ agentId: selectedAgent.id, skillId: skills[0]?.id ?? 'skill-text_reasoning' });
        }} className="mt-3 rounded-[12px] border border-white/[0.09] px-3 py-2 text-xs font-semibold text-white/45">Change model</button>
      </div>

      <div className="mt-3 rounded-[20px] border border-white/[0.08] bg-white/[0.03] p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">Output so far</p>
        <p className="mt-2 text-sm leading-relaxed text-white/55">{selectedAgent.name === 'AI Ant Director' ? 'Operating goal defined and shared with Project Manager.' : selectedAgent.output}</p>
        <button className="mt-4 rounded-[12px] bg-[#ffffff] px-3 py-2 text-xs font-bold text-[#070B14] hover:bg-[#f0f2ff]">View output</button>
      </div>
    </aside>
  ) : null;

  return (
    <div className="h-full min-w-0 overflow-hidden bg-[#050912] text-white">
      <div
        className="grid h-full min-w-0 grid-cols-[320px_minmax(0,1fr)_340px] overflow-hidden"
        style={{ gridTemplateRows: `92px 1fr 8px ${chatPanelHeight}px`, minWidth: 0, minHeight: 0 }}
      >
        {/* Agents panel — col 1, rows 1–2 */}
        <div className="col-start-1 row-start-1 row-span-2 min-h-0 min-w-0 overflow-hidden">
          <AgentListPanel />
        </div>
        {/* Project header — col 2, row 1 (compact) */}
        <header className="col-start-2 row-start-1 flex min-h-0 min-w-0 items-center justify-between border-b border-l border-white/[0.07] bg-[#07070f]/95 px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <button onClick={onBack} className="rounded-[9px] border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[11px] font-semibold text-white/42 transition hover:text-white">Back</button>
              <p className="select-none text-[10px] font-bold uppercase tracking-[0.18em] text-violet-300/55">One-man Enterprise Workspace</p>
            </div>
            <h1 className="mt-1 truncate font-heading text-xl font-extrabold tracking-tight text-white">{workspaceTitle}</h1>
            <p className="mt-0.5 truncate text-xs text-white/38">{workspaceSubtitle}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-2.5 py-1 text-[11px] font-bold text-emerald-300">{project.status}</span>
            <span className="rounded-full border border-violet-400/20 bg-violet-400/[0.08] px-2.5 py-1 text-[11px] font-bold text-violet-200">{agents.length} agents</span>
            <button className="rounded-[11px] bg-[#ffffff] px-3.5 py-2 text-xs font-bold text-[#070B14] shadow-[0_8px_24px_rgba(255,255,255,0.10)] transition hover:bg-violet-100">Share report</button>
          </div>
        </header>
        {/* Org canvas — col 2, row 2 */}
        <main className="col-start-2 row-start-2 min-h-0 min-w-0 overflow-hidden border-l border-white/[0.07] bg-[#070B14] p-3">
          <OrganizationCanvas />
        </main>
        {/* Drag divider — cols 1–2, row 3 */}
        <div
          className="col-start-1 col-end-3 row-start-3 flex min-h-0 min-w-0 cursor-row-resize select-none items-center justify-center border-t border-white/[0.07] bg-[#070B14] transition-colors hover:bg-violet-500/[0.08]"
          onPointerDown={onDividerDown}
          onPointerMove={onDividerMove}
          onPointerUp={onDividerUp}
        >
          <span className="h-[3px] w-10 rounded-full bg-white/[0.14]" />
        </div>
        {/* Chat panel — cols 1–2, row 4 */}
        <div className="col-start-1 col-end-3 row-start-4 min-h-0 min-w-0 overflow-hidden bg-[#070B14] px-3 pb-3">
          <AgentChannelChat />
        </div>
        {/* Right inspector — col 3, rows 1–4 */}
        <div className="col-start-3 row-span-4 min-h-0 min-w-0 overflow-hidden">
          <AgentInspectorPanel />
        </div>
      </div>
      {contextMenu && <EnterpriseContextMenu />}
      {agentAddMenu && <AgentAddMenu />}
      {agentModal && <AddAgentModal />}
      {deptModal && <DepartmentModal />}
      {enterpriseModelPicker && (() => {
        const target = agents.find((agent) => agent.id === enterpriseModelPicker.agentId);
        const skills = target ? target.agentSkills ?? skillsForCapabilities(inferCapabilitiesFromText(target.name, target.role, target.dept, target.tools)) : [];
        const skill = skills.find((item) => item.id === enterpriseModelPicker.skillId) ?? skills[0];
        return target && skill ? (
          <ModelPickerModal
            title={`${target.name} model`}
            skill={skill}
            activeModel={target.activeModel}
            onClose={() => setEnterpriseModelPicker(null)}
            onSave={(nextSkill, activeModel) => {
              setAgents((prev) => prev.map((agent) => {
                if (agent.id !== target.id) return agent;
                const currentSkills = skills.length ? skills : [nextSkill];
                return { ...agent, agentSkills: currentSkills.map((item) => item.id === nextSkill.id ? nextSkill : item), activeModel };
              }));
              setEnterpriseModelPicker(null);
            }}
          />
        ) : null;
      })()}
    </div>
  );
}
