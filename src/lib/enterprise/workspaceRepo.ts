/**
 * Workspace repository — offline-first persistence for Enterprise workspaces.
 *
 * Strategy:
 *  - Reads: localStorage first (instant, sync), then Firestore in background.
 *           If Firestore has newer data → emits update via subscriber.
 *  - Writes: localStorage always (instant), Firestore async (debounced ~800ms).
 *  - Anonymous users: localStorage only (Firestore needs auth UID).
 *
 * Firestore path: users/{uid}/enterprise_workspaces/{workspaceId}
 */
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseAuth, firestore } from '../firebase/client';

const STORAGE_PREFIX = 'colony.one_man_enterprise.workspace';
const SAVE_DEBOUNCE_MS = 800;

export type WorkspaceState = {
  agents?: unknown[];
  connections?: unknown[];
  channels?: unknown[];
  messages?: unknown[];
  departments?: unknown[];
};

type StoredEnvelope = {
  state: WorkspaceState;
  updatedAt: number; // ms epoch — client clock; Firestore also has serverTimestamp
  version: 1;
};

function storageKey(workspaceId: string): string {
  return `${STORAGE_PREFIX}.${workspaceId}.v1`;
}

function loadLocal(workspaceId: string): StoredEnvelope | null {
  try {
    const raw = localStorage.getItem(storageKey(workspaceId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredEnvelope | WorkspaceState;
    // Backward compat: old format stored bare state, not envelope.
    if (parsed && typeof parsed === 'object' && 'state' in parsed && 'updatedAt' in parsed) {
      return parsed as StoredEnvelope;
    }
    return { state: parsed as WorkspaceState, updatedAt: 0, version: 1 };
  } catch {
    return null;
  }
}

function saveLocal(workspaceId: string, envelope: StoredEnvelope): void {
  try {
    localStorage.setItem(storageKey(workspaceId), JSON.stringify(envelope));
  } catch {
    /* quota exceeded or storage disabled — ignore */
  }
}

async function loadRemote(workspaceId: string): Promise<StoredEnvelope | null> {
  const uid = firebaseAuth.currentUser?.uid;
  if (!uid) return null;
  try {
    const ref = doc(firestore, 'users', uid, 'enterprise_workspaces', workspaceId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data() as { state?: WorkspaceState; updatedAtMs?: number };
    if (!data.state) return null;
    return { state: data.state, updatedAt: data.updatedAtMs ?? 0, version: 1 };
  } catch (err) {
    console.warn('[workspaceRepo] Firestore load failed, using local only:', err);
    return null;
  }
}

async function saveRemote(workspaceId: string, envelope: StoredEnvelope): Promise<void> {
  const uid = firebaseAuth.currentUser?.uid;
  if (!uid) return;
  try {
    const ref = doc(firestore, 'users', uid, 'enterprise_workspaces', workspaceId);
    await setDoc(
      ref,
      {
        state: envelope.state,
        updatedAtMs: envelope.updatedAt,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (err) {
    console.warn('[workspaceRepo] Firestore save failed, kept local copy:', err);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Sync read — returns immediately from localStorage. Returns null if no local copy.
 * Use this for initial render. Pair with `subscribeRemote()` to upgrade to Firestore copy.
 */
export function loadWorkspaceLocal(workspaceId: string): WorkspaceState | null {
  return loadLocal(workspaceId)?.state ?? null;
}

/**
 * Async refresh from Firestore. If remote has newer data than local, returns it.
 * Otherwise returns null.
 */
export async function refreshFromRemote(workspaceId: string): Promise<WorkspaceState | null> {
  const [local, remote] = await Promise.all([
    Promise.resolve(loadLocal(workspaceId)),
    loadRemote(workspaceId),
  ]);
  if (!remote) return null;
  if (!local || remote.updatedAt > local.updatedAt) {
    saveLocal(workspaceId, remote); // pull remote into local cache
    return remote.state;
  }
  return null;
}

const pendingSaves = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Save workspace state. Writes to localStorage immediately and to Firestore (debounced).
 */
export function saveWorkspace(workspaceId: string, state: WorkspaceState): void {
  const envelope: StoredEnvelope = { state, updatedAt: Date.now(), version: 1 };
  saveLocal(workspaceId, envelope);

  // Debounce remote writes to avoid spamming Firestore on every state tick.
  const existing = pendingSaves.get(workspaceId);
  if (existing) clearTimeout(existing);
  const timer = setTimeout(() => {
    pendingSaves.delete(workspaceId);
    void saveRemote(workspaceId, envelope);
  }, SAVE_DEBOUNCE_MS);
  pendingSaves.set(workspaceId, timer);
}

/** Force-flush any pending Firestore write immediately (e.g. on unmount). */
export async function flushPendingSaves(workspaceId: string): Promise<void> {
  const existing = pendingSaves.get(workspaceId);
  if (!existing) return;
  clearTimeout(existing);
  pendingSaves.delete(workspaceId);
  const envelope = loadLocal(workspaceId);
  if (envelope) await saveRemote(workspaceId, envelope);
}
