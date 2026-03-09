import type { Results } from '@mediapipe/hands';
import type { GestureType } from '../Types/GestureType';

export interface GestureAction {
  gesture: GestureType;
  action: () => void;
  cooldown?: number;
}

export interface UseHandGestureOptions {
  videoElement?: HTMLVideoElement | null;
  onGesture?: (gesture: GestureType) => void;
  enabled?: boolean;
}

export interface UseHandGestureReturn {
  isLoading: boolean;
  isTracking: boolean;
  currentGesture: GestureType;
  handResults: Results | null;
  error: string | null;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  gestureActions: GestureAction[];
  registerAction: (action: GestureAction) => void;
  unregisterAction: (gesture: GestureType) => void;
}

