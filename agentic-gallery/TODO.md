# Agentic Gallery - Implementation TODO

## Phase 1: Audio Player Improvements
- [ ] 1.1 Remove LLM integration (PromptInterface, AITaskResultSpace, LLM components)
- [ ] 1.2 Add file upload component for MP3 files
- [ ] 1.3 Consolidate and fix audio contexts
- [ ] 1.4 Improve audio controls (play, pause, next, prev, shuffle, repeat)
- [ ] 1.5 Add progress bar with seek functionality
- [ ] 1.6 Add volume control
- [ ] 1.7 Improve UI while keeping glassmorphism design

## Phase 2: Video Player with Hand Gesture Control
- [ ] 2.1 Create VideoPage with full video player UI
- [ ] 2.2 Integrate TensorFlow.js + MediaPipe for hand tracking
- [ ] 2.3 Implement gesture recognition system
- [ ] 2.4 Connect gestures to video controls
- [ ] 2.5 Add gesture visualization overlay

## Phase 3: Image Gallery with Hand Gesture Control
- [ ] 3.1 Create ImagePage with image gallery UI
- [ ] 3.2 Integrate same gesture controls as video
- [ ] 3.3 Add image selection functionality
- [ ] 3.4 Add zoom controls with gestures

## Phase 4: Architecture Improvements
- [ ] 4.1 Create MediaContext for shared media state
- [ ] 4.2 Create custom hooks (useAudioPlayer, useVideoPlayer, useHandGesture)
- [ ] 4.3 Clean up unnecessary files
- [ ] 4.4 Apply React optimization patterns

## Phase 5: Dependencies
- [ ] 5.1 Install @mediapipe/hands
- [ ] 5.2 Install @tensorflow/tfjs
- [ ] 5.3 Install @tensorflow-models/hand-detection

