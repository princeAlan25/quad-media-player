import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import type { Results } from '@mediapipe/hands';

export type GestureType = 
  | 'open_palm'
  | 'fist'
  | 'pointing_up'
  | 'thumbs_up'
  | 'thumbs_down'
  | 'ok_sign'
  | 'peace_sign'
  | 'ily_sign'
  | 'pointing_right'
  | 'pointing_left'
  | 'none';

interface GestureAction {
  gesture: GestureType;
  action: () => void;
  cooldown?: number;
}

interface UseHandGestureOptions {
  videoElement?: HTMLVideoElement | null;
  onGesture?: (gesture: GestureType) => void;
  enabled?: boolean;
}

interface UseHandGestureReturn {
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

export const useHandGesture = (options: UseHandGestureOptions = {}): UseHandGestureReturn => {
  const { videoElement, onGesture, enabled = true } = options;
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [currentGesture, setCurrentGesture] = useState<GestureType>('none');
  const [handResults, setHandResults] = useState<Results | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handsRef = useRef<Hands | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const lastGestureTimeRef = useRef<number>(0);
  const gestureActionsRef = useRef<GestureAction[]>([]);

  // Detect gesture from hand landmarks
  const detectGesture = useCallback((landmarks: any[]): GestureType => {
    if (!landmarks || landmarks.length < 21) return 'none';

    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];
    
    const thumbIP = landmarks[2];
    const indexMCP = landmarks[5];
    const middleMCP = landmarks[9];
    const ringMCP = landmarks[13];
    const pinkyMCP = landmarks[17];

    // Calculate finger states (extended = true, folded = false)
    const thumbExtended = Math.abs(thumbTip.x - thumbIP.x) > 0.1 || thumbTip.x > indexMCP.x + 0.1;
    const indexExtended = indexTip.y < indexMCP.y - 0.05;
    const middleExtended = middleTip.y < middleMCP.y - 0.05;
    const ringExtended = ringTip.y < ringMCP.y - 0.05;
    const pinkyExtended = pinkyTip.y < pinkyMCP.y - 0.05;

    const extendedCount = [thumbExtended, indexExtended, middleExtended, ringExtended, pinkyExtended].filter(Boolean).length;

    // Thumbs Up
    if (thumbExtended && !indexExtended && !middleExtended && !ringExtended && !pinkyExtended && thumbTip.y < indexMCP.y) {
      return 'thumbs_up';
    }

    // Thumbs Down
    if (thumbExtended && !indexExtended && !middleExtended && !ringExtended && !pinkyExtended && thumbTip.y > indexMCP.y) {
      return 'thumbs_down';
    }

    // Peace Sign (two fingers up)
    if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
      return 'peace_sign';
    }

    // ILY Sign (thumb and pinky extended)
    if (thumbExtended && !indexExtended && !middleExtended && !ringExtended && pinkyExtended) {
      return 'ily_sign';
    }

    // OK Sign (thumb and index touching, other fingers extended)
    const thumbIndexDistance = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) + Math.pow(thumbTip.y - indexTip.y, 2)
    );
    if (thumbIndexDistance < 0.05 && extendedCount >= 3) {
      return 'ok_sign';
    }

    // Pointing Right (index pointing right)
    if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended && indexTip.x > indexMCP.x + 0.1) {
      return 'pointing_right';
    }

    // Pointing Left (index pointing left)
    if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended && indexTip.x < indexMCP.x - 0.1) {
      return 'pointing_left';
    }

    // Pointing Up
    if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended && indexTip.y < indexMCP.y - 0.1) {
      return 'pointing_up';
    }

    // Fist (all fingers folded)
    if (extendedCount <= 1) {
      return 'fist';
    }

    // Open Palm (all fingers extended)
    if (extendedCount === 5) {
      return 'open_palm';
    }

    return 'none';
  }, []);

  // Process hand detection results
  const onResults = useCallback((results: Results) => {
    setHandResults(results);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      const gesture = detectGesture(landmarks);
      
      if (gesture !== 'none') {
        const now = Date.now();
        if (now - lastGestureTimeRef.current > 800) { // Gesture cooldown
          setCurrentGesture(gesture);
          onGesture?.(gesture);
          
          // Execute registered actions
          const action = gestureActionsRef.current.find(a => a.gesture === gesture);
          if (action) {
            if (!action.cooldown || now - lastGestureTimeRef.current > action.cooldown) {
              action.action();
              lastGestureTimeRef.current = now;
            }
          }
        }
      }
    } else {
      setCurrentGesture('none');
    }
  }, [detectGesture, onGesture]);

  // Initialize MediaPipe Hands
  const initializeHands = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5,
      });

      hands.onResults(onResults);
      handsRef.current = hands;
      
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize hand tracking');
      setIsLoading(false);
    }
  }, [onResults]);

  // Start camera and tracking
  const startTracking = useCallback(async () => {
    if (!videoElement) {
      setError('Video element not available');
      return;
    }

    if (!handsRef.current) {
      await initializeHands();
    }

    if (handsRef.current && videoElement) {
      try {
        const camera = new Camera(videoElement, {
          onFrame: async () => {
            if (handsRef.current && videoElement) {
              await handsRef.current.send({ image: videoElement });
            }
          },
          width: 640,
          height: 480,
        });
        
        await camera.start();
        cameraRef.current = camera;
        setIsTracking(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start camera');
      }
    }
  }, [videoElement, initializeHands]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    setIsTracking(false);
    setCurrentGesture('none');
  }, []);

  // Register gesture action
  const registerAction = useCallback((action: GestureAction) => {
    gestureActionsRef.current = [
      ...gestureActionsRef.current.filter(a => a.gesture !== action.gesture),
      action,
    ];
  }, []);

  // Unregister gesture action
  const unregisterAction = useCallback((gesture: GestureType) => {
    gestureActionsRef.current = gestureActionsRef.current.filter(a => a.gesture !== gesture);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
      if (handsRef.current) {
        handsRef.current.close();
        handsRef.current = null;
      }
    };
  }, [stopTracking]);

  // Initialize on mount
  useEffect(() => {
    if (enabled) {
      initializeHands();
    }
  }, [enabled, initializeHands]);

  const value = useMemo<UseHandGestureReturn>(() => ({
    isLoading,
    isTracking,
    currentGesture,
    handResults,
    error,
    startTracking,
    stopTracking,
    gestureActions: gestureActionsRef.current,
    registerAction,
    unregisterAction,
  }), [isLoading, isTracking, currentGesture, handResults, error, startTracking, stopTracking, registerAction, unregisterAction]);

  return value;
};

