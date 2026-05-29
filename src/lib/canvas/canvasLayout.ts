// Workflow canvas layout constants and small math helpers.
// Extracted from src/App.tsx as part of Phase 2 of the file split refactor.
// Behavior is byte-for-byte identical.

import type { CanvasAgent, CanvasAgentType } from '../types/workflowTypes';

// ── Board / sizing constants ─────────────────────────────────────────────────

export const BOARD_SIZE = { width: 4000, height: 3000 };
export const SOURCE_AGENT_TYPES: CanvasAgentType[] = ['ant'];
export const AGENT_BODY = { width: 100, height: 100 };
export const AGENT_CARD = { width: 140, height: 148 };
export const AGENT_GAP_X = 200;
export const AGENT_START_X = 100;
export const AGENT_START_Y = 300;
export const AGENT_GRID_GAP_X = 72;
export const AGENT_GRID_GAP_Y = 92;
export const CHAT_WINDOW_DEFAULT_SIZE = { width: 760, height: 440 };
export const CHAT_WINDOW_MIN_SIZE = { width: 480, height: 320 };
export const CHAT_WINDOW_MARGIN = 24;
export const CHAT_WINDOW_HEADER_OFFSET = 72;

// ── Math helpers ─────────────────────────────────────────────────────────────

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function drawPixelRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export function connectionPath(from: CanvasAgent, to: CanvasAgent) {
  const fx = from.x + AGENT_BODY.width;
  const fy = from.y + AGENT_BODY.height / 2;
  const tx = to.x;
  const ty = to.y + AGENT_BODY.height / 2;
  const dist = Math.abs(tx - fx);
  const cp1x = fx + dist * 0.5;
  const cp2x = tx - dist * 0.5;
  return `M${fx},${fy} C${cp1x},${fy} ${cp2x},${ty} ${tx},${ty}`;
}

export function getNextAgentPosition(currentAgents: CanvasAgent[]) {
  for (let index = 0; index < currentAgents.length + 18; index += 1) {
    const col = index % 4;
    const row = Math.floor(index / 4);
    const x = AGENT_START_X + col * (AGENT_CARD.width + AGENT_GRID_GAP_X);
    const y = AGENT_START_Y + row * (AGENT_CARD.height + AGENT_GRID_GAP_Y);
    const overlaps = currentAgents.some((agent) => Math.abs(agent.x - x) < AGENT_CARD.width * 0.75 && Math.abs(agent.y - y) < AGENT_CARD.height * 0.75);
    if (!overlaps) {
      return { x, y };
    }
  }

  return {
    x: AGENT_START_X,
    y: AGENT_START_Y + Math.ceil(currentAgents.length / 4) * (AGENT_CARD.height + AGENT_GRID_GAP_Y),
  };
}
