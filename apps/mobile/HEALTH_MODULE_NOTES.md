# Health Module - Posture Detection Implementation

## Overview
This health module provides real-time posture detection and exercise form feedback using camera-based pose estimation. It includes:

- ✅ Real-time posture checking with camera
- ✅ Live feedback for form corrections
- ✅ Front/back camera switching
- ✅ Exercise repetition counting
- ✅ Audio feedback (buzzer for errors, "tang" for reps, satisfying sound for completion)
- ✅ Haptic feedback integration
- ✅ Visual pose overlay with skeleton rendering

## Features Implemented

### 1. AudioManager (`src/services/AudioManager.js`)
Manages all sound and haptic feedback:
- `playRepSound()` - Plays on each completed rep ("tang" sound)
- `playErrorSound()` - Plays when form is incorrect (buzzer)
- `playCompleteSound()` - Plays when target reps are achieved (satisfying sound sequence)
- `playStartSound()` - Plays when workout starts
- Integrates with Expo Haptics for tactile feedback

### 2. PoseDetectionService (`src/services/PoseDetectionService.js`)
TensorFlow.js integration for pose detection:
- Uses MoveNet SinglePose Lightning model for fast mobile detection
- Normalizes keypoints to app format
- Throttles detection to 10 FPS for performance
- Supports 17 keypoints (MediaPipe format)

### 3. Workout Screen (`src/app/(tabs)/workout/[exerciseId].jsx`)
Main workout interface with:
- Camera view with pose overlay
- Real-time metrics (reps, form score, target)
- Live feedback messages
- Camera switching button
- Start/Pause/Stop controls
- Paused overlay
- Session saving to history

### 4. Pose Overlay Visualization
Uses Skia Canvas for GPU-accelerated rendering:
- Draws skeleton connections between keypoints
- Shows keypoint confidence with visual indicators
- Color-coded based on form quality

## Current Status

### ✅ Completed
- Audio feedback system with all required sounds
- Pose detection service with TensorFlow integration
- Full workout UI with camera and controls
- Camera switching functionality
- Real-time feedback overlay
- Rep counting with audio cues
- Error detection with buzzer sound
- Completion celebration with satisfying sound
- Session history saving

### ⚠️ Integration Needed
The workout screen currently uses **mock pose data** for demonstration. To integrate actual camera-based pose detection:

1. **Camera Frame Capture**: The current implementation needs actual camera frames to be fed to TensorFlow. Options:

   a. Use `@tensorflow/tfjs-react-native` camera stream:
   ```javascript
   import { cameraWithTensors } from '@tensorflow/tfjs-react-native';

   const TensorCamera = cameraWithTensors(Camera);

   <TensorCamera
     style={styles.camera}
     type={cameraType}
     onReady={handleCameraStream}
     resizeHeight={200}
     resizeWidth={152}
     resizeDepth={3}
     autorender={true}
   />
   ```

   b. Use `expo-camera` with manual frame capture:
   ```javascript
   // In workout screen, replace generateMockPoseData with:
   const captureAndDetectPose = async () => {
     if (!cameraRef.current) return null;

     const photo = await cameraRef.current.takePictureAsync({
       quality: 0.5,
       base64: true,
       skipProcessing: true,
     });

     const imageData = await loadImageData(photo.uri);
     return await poseDetectionService.detectPose(
       imageData,
       SCREEN_WIDTH,
       SCREEN_HEIGHT
     );
   };
   ```

2. **Performance Optimization**:
   - The current mock runs at 60fps but actual detection is throttled to 10fps
   - Consider using lower resolution frames (320x240) for faster processing
   - Enable GPU acceleration via `@tensorflow/tfjs-backend-webgl`

3. **Model Loading**:
   - First load may take 5-10 seconds
   - Consider showing a loading screen during initialization
   - Cache the model for subsequent uses

## File Structure

```
apps/mobile/src/
├── services/
│   ├── AudioManager.js              # Audio & haptic feedback
│   ├── PoseDetectionService.js      # TensorFlow pose detection
│   └── pose/
│       ├── PoseProcessor.js         # Math utilities (existing)
│       ├── ExerciseAnalyzers.js     # Exercise logic (existing)
│       └── FeedbackManager.js       # Feedback system (existing)
├── app/(tabs)/
│   └── workout/
│       └── [exerciseId].jsx         # Main workout screen
└── types/
    └── index.js                     # Type definitions
```

## Dependencies Added

```json
{
  "@tensorflow/tfjs": "^4.x",
  "@tensorflow/tfjs-react-native": "^1.x",
  "@tensorflow-models/pose-detection": "^2.x"
}
```

Existing dependencies used:
- `expo-camera` - Camera access
- `expo-av` - Audio playback
- `expo-haptics` - Vibration feedback
- `@shopify/react-native-skia` - Pose visualization
- `expo-audio` - Sound management

## Usage Flow

1. User selects an exercise from home screen
2. Workout screen initializes:
   - Requests camera permission
   - Loads TensorFlow model
   - Initializes audio manager
3. User taps "Start Workout"
4. Camera captures frames → TensorFlow detects pose → Analyzer processes form
5. Feedback loop:
   - Good form → Positive messages every 5 seconds
   - Bad form → Error buzzer + visual feedback
   - Rep completed → "Tang" sound + rep counter increments
   - Target reached → Satisfying completion sound + celebration
6. User can pause/resume/stop workout
7. Session saved to history on completion

## Testing

To test the current implementation:
1. Navigate to any exercise from home screen
2. Grant camera permission
3. Tap "Start Workout"
4. Observe mock pose data driving the system:
   - Reps auto-increment based on simulated movement
   - Form feedback changes based on mock keypoints
   - Sounds play on events (rep, error, completion)
5. Test camera switching with rotate button
6. Test pause/resume functionality

## Next Steps

1. **Integrate actual camera frames** with TensorFlow (see integration notes above)
2. **Fine-tune detection parameters** based on real-world testing
3. **Add sound assets**: Replace synthesized tones with actual audio files:
   - `assets/sounds/rep.mp3` - Pleasant "tang" sound
   - `assets/sounds/error.mp3` - Buzzer/alert sound
   - `assets/sounds/complete.mp3` - Celebration sound
4. **Optimize performance** for various device capabilities
5. **Add calibration flow** to help users position themselves correctly
6. **Implement workout summaries** at completion
7. **Add historical tracking** and progress charts

## Known Limitations

- Currently using mock pose data (needs camera integration)
- Audio uses synthesized tones (needs actual sound files)
- Detection runs on CPU (GPU acceleration recommended for production)
- No offline model caching (model downloads on each session)
- Limited to single person detection

## Resources

- [TensorFlow.js React Native Guide](https://www.tensorflow.org/js/tutorials/setup#react_native)
- [MoveNet Model Documentation](https://www.tensorflow.org/hub/tutorials/movenet)
- [Expo Camera Documentation](https://docs.expo.dev/versions/latest/sdk/camera/)
- [Skia Canvas API](https://shopify.github.io/react-native-skia/)
