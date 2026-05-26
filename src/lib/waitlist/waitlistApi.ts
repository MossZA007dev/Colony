export type WaitlistSignupRequest = {
  name: string;
  email: string;
  role: string;
  task: string;
  willingToTest: boolean;
};

export type WaitlistSignupResponse = {
  id: string;
  email: string;
  count: number;
  alreadyJoined: boolean;
};

function getApiBase(): string {
  const configured = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return (configured || (import.meta.env.DEV ? 'http://localhost:8000' : '')).replace(/\/$/, '');
}

async function readError(response: Response): Promise<string> {
  const fallback = `Waitlist API error ${response.status}`;
  const text = await response.text().catch(() => '');
  if (!text) return fallback;
  try {
    const parsed = JSON.parse(text) as { detail?: string };
    return parsed.detail || fallback;
  } catch {
    return text;
  }
}

export async function fetchWaitlistCount(): Promise<number> {
  const apiBase = getApiBase();

  const response = await fetch(`${apiBase}/api/waitlist/count`);
  if (!response.ok) throw new Error(await readError(response));
  const data = (await response.json()) as { count?: unknown };
  if (typeof data.count !== 'number') throw new Error('Waitlist count response is invalid.');
  return data.count;
}

export async function submitWaitlistSignup(payload: WaitlistSignupRequest): Promise<WaitlistSignupResponse> {
  const apiBase = getApiBase();

  const response = await fetch(`${apiBase}/api/waitlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      role: payload.role,
      task: payload.task,
      willing_to_test: payload.willingToTest,
    }),
  });
  if (!response.ok) throw new Error(await readError(response));

  const data = (await response.json()) as {
    id: string;
    email: string;
    count: number;
    already_joined?: boolean;
  };
  return {
    id: data.id,
    email: data.email,
    count: data.count,
    alreadyJoined: Boolean(data.already_joined),
  };
}
