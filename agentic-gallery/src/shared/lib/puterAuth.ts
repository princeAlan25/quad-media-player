export type PuterSessionPhase = 'idle' | 'connecting' | 'ready' | 'error';

export interface PuterSessionSnapshot {
  phase: PuterSessionPhase;
  message: string;
}

const listeners = new Set<(snapshot: PuterSessionSnapshot) => void>();

const puterModel = (import.meta.env.VITE_PUTER_MODEL as string | undefined)?.trim() || 'gpt-5-nano';
const allowTempUserCreation = String(import.meta.env.VITE_PUTER_ALLOW_TEMP_USER ?? 'true').toLowerCase() !== 'false';

let snapshot: PuterSessionSnapshot = {
  phase: 'idle',
  message: 'Puter is not signed in yet.',
};

let sessionPromise: Promise<void> | null = null;

function updateSnapshot(nextSnapshot: PuterSessionSnapshot): void {
  snapshot = nextSnapshot;
  listeners.forEach(listener => listener(snapshot));
}

function createUnavailableError(): Error {
  return new Error('Puter.js did not load. Check your network and reload the page.');
}

function isSignedIn(): boolean {
  return window.puter?.auth?.isSignedIn?.() === true;
}

export function getPuterModel(): string {
  return puterModel;
}

export function readPuterSessionSnapshot(): PuterSessionSnapshot {
  return snapshot;
}

export function subscribeToPuterSessionUpdates(listener: (snapshot: PuterSessionSnapshot) => void): () => void {
  listeners.add(listener);
  listener(snapshot);
  return () => {
    listeners.delete(listener);
  };
}

export function refreshPuterSessionSnapshot(): PuterSessionSnapshot {
  if (!window.puter) {
    const nextSnapshot = {
      phase: 'error' as const,
      message: createUnavailableError().message,
    };
    updateSnapshot(nextSnapshot);
    return nextSnapshot;
  }

  const nextSnapshot = isSignedIn()
    ? {
        phase: 'ready' as const,
        message: 'Puter is already signed in for this browser session.',
      }
    : {
        phase: 'idle' as const,
        message: 'Sign in to Puter once, then the session will be reused.',
      };

  updateSnapshot(nextSnapshot);
  return nextSnapshot;
}

export async function ensurePuterSignIn(): Promise<void> {
  if (!window.puter) {
    const error = createUnavailableError();
    updateSnapshot({
      phase: 'error',
      message: error.message,
    });
    throw error;
  }

  if (isSignedIn()) {
    updateSnapshot({
      phase: 'ready',
      message: 'Puter is already signed in for this browser session.',
    });
    return;
  }

  if (sessionPromise) {
    return sessionPromise;
  }

  updateSnapshot({
    phase: 'connecting',
    message: 'Opening Puter sign-in...',
  });

  sessionPromise = window.puter.auth.signIn({ attempt_temp_user_creation: allowTempUserCreation })
    .then(() => {
      sessionPromise = null;
      updateSnapshot({
        phase: 'ready',
        message: 'Puter connected. This sign-in is reused until the browser session ends.',
      });
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to connect Puter.';
      updateSnapshot({
        phase: 'error',
        message,
      });
      sessionPromise = null;
      throw error;
    });

  return sessionPromise;
}

export async function retryPuterSignIn(): Promise<void> {
  sessionPromise = null;
  updateSnapshot({
    phase: 'idle',
    message: 'Retrying Puter sign-in...',
  });
  return ensurePuterSignIn();
}
