import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Alert,
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { useLocalSearchParams, router } from 'expo-router';
import {
  X,
  RotateCcw,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Camera as CameraIcon,
} from 'lucide-react-native';
import { Canvas, Circle, Line, vec } from '@shopify/react-native-skia';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/utils/theme';
import { EXERCISE_TYPES } from '@/types/index';
import { createAnalyzer } from '@/services/pose/ExerciseAnalyzers';
import { feedbackManager } from '@/services/FeedbackManager';
import { audioManager } from '@/services/AudioManager';
// import { poseDetectionService } from '@/services/PoseDetectionService';
import { sessionStorage } from '@/services/storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function WorkoutScreen() {
  const { exerciseId } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { colors, typography, spacing } = useAppTheme();

  // Camera refs
  const cameraRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Exercise state
  const [exercise, setExercise] = useState(null);
  const [analyzer, setAnalyzer] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Camera state
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraType, setCameraType] = useState(CameraType.front);
  const [isModelLoading, setIsModelLoading] = useState(true);

  // Pose state
  const [currentPose, setCurrentPose] = useState(null);
  const [feedback, setFeedback] = useState({ message: '', type: 'info' });

  // Workout metrics
  const [repCount, setRepCount] = useState(0);
  const [lastRepCount, setLastRepCount] = useState(0);
  const [formScore, setFormScore] = useState(1.0);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [lastErrorTime, setLastErrorTime] = useState(0);

  // Target reps
  const [targetReps, setTargetReps] = useState(10);

  // Initialize
  useEffect(() => {
    initializeWorkout();

    return () => {
      cleanup();
    };
  }, []);

  // Timer for time-based exercises
  useEffect(() => {
    let interval;
    if (isActive && !isPaused && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, isPaused, startTime]);

  // Check for completion
  useEffect(() => {
    if (repCount > 0 && repCount >= targetReps && isActive) {
      handleWorkoutComplete();
    }
  }, [repCount, targetReps]);

  const initializeWorkout = async () => {
    try {
      // Find exercise
      const foundExercise = EXERCISE_TYPES.find((ex) => ex.id === exerciseId);
      if (!foundExercise) {
        Alert.alert('Error', 'Exercise not found');
        router.back();
        return;
      }
      setExercise(foundExercise);

      // Request camera permission
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera permission is required for pose detection'
        );
        return;
      }

      // Initialize audio
      await audioManager.initialize();

      // Initialize pose detection (commented out due to TensorFlow dependency issues)
      // await poseDetectionService.initialize();
      setIsModelLoading(false);

      // Create exercise analyzer
      const newAnalyzer = createAnalyzer(foundExercise.id);
      setAnalyzer(newAnalyzer);
    } catch (error) {
      console.error('Failed to initialize workout:', error);
      Alert.alert('Initialization Error', error.message);
      setIsModelLoading(false);
    }
  };

  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsActive(false);
  };

  const startWorkout = () => {
    if (!analyzer) return;

    setIsActive(true);
    setIsPaused(false);
    setStartTime(Date.now());
    analyzer.reset();
    feedbackManager.reset();
    setRepCount(0);
    setLastRepCount(0);
    setFormScore(1.0);
    setElapsedTime(0);

    audioManager.playStartSound();
    startPoseDetection();
  };

  const pauseWorkout = () => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      audioManager.playLightHaptic();
    }
  };

  const stopWorkout = async () => {
    setIsActive(false);
    setIsPaused(false);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Save session if there were any reps
    if (repCount > 0) {
      await saveSession();
    }

    router.back();
  };

  const handleWorkoutComplete = async () => {
    setIsPaused(true);
    await audioManager.playCompleteSound();

    Alert.alert(
      'Workout Complete! 🎉',
      `Great job! You completed ${repCount} reps with ${Math.round(formScore * 100)}% form score.`,
      [
        {
          text: 'Continue',
          onPress: () => {
            setTargetReps(targetReps + 10);
            setIsPaused(false);
          },
        },
        {
          text: 'Finish',
          onPress: stopWorkout,
        },
      ]
    );
  };

  const startPoseDetection = () => {
    const detectFrame = async () => {
      if (!isActive || isPaused || !cameraRef.current) {
        animationFrameRef.current = requestAnimationFrame(detectFrame);
        return;
      }

      try {
        // Capture frame from camera
        // Note: This is a simplified version. You may need to use
        // expo-camera's onCameraReady and takePictureAsync or use
        // TensorFlow camera stream

        // For now, we'll use a mock detection loop
        // In production, you'd capture actual camera frames

        // Simulate pose detection (replace with actual camera frame processing)
        // const imageData = await captureFrame();
        // const poseData = await poseDetectionService.detectPose(imageData, SCREEN_WIDTH, SCREEN_HEIGHT);

        // For demo purposes, generate mock pose data
        // Remove this and uncomment above in production
        const mockPoseData = generateMockPoseData();

        if (mockPoseData && analyzer) {
          setCurrentPose(mockPoseData);

          // Analyze pose
          const results = analyzer.analyze(mockPoseData.keypoints);

          // Update metrics
          if (results.repCount > lastRepCount) {
            setRepCount(results.repCount);
            setLastRepCount(results.repCount);
            await audioManager.playRepSound();
          }

          setFormScore(results.formScore);

          // Process feedback
          const feedbackData = feedbackManager.processFeedback(
            results.formIssues,
            results.formScore,
            results.state
          );

          setFeedback(feedbackData);

          // Play error sound if form is bad and enough time has passed
          if (
            feedbackData.type === 'error' &&
            Date.now() - lastErrorTime > 2000
          ) {
            await audioManager.playErrorSound();
            setLastErrorTime(Date.now());
          }
        }
      } catch (error) {
        console.error('Error in pose detection loop:', error);
      }

      animationFrameRef.current = requestAnimationFrame(detectFrame);
    };

    detectFrame();
  };

  const toggleCamera = () => {
    setCameraType((current) =>
      current === CameraType.back ? CameraType.front : CameraType.back
    );
    audioManager.playLightHaptic();
  };

  const saveSession = async () => {
    try {
      const session = {
        id: `session_${Date.now()}`,
        exerciseTypeId: exerciseId,
        startTime: new Date(startTime),
        endTime: new Date(),
        totalReps: repCount,
        totalDuration: elapsedTime,
        averageFormScore: formScore,
        issuesSummary: [],
      };

      await sessionStorage.addSession(session);
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };

  // Generate mock pose data for testing
  // Remove this in production and use actual pose detection
  const generateMockPoseData = () => {
    const time = Date.now() / 1000;
    const cycle = Math.sin(time * 0.5) * 0.5 + 0.5; // 0 to 1 oscillating

    return {
      keypoints: [
        { name: 'nose', x: 0.5, y: 0.1, confidence: 0.9 },
        { name: 'left_eye', x: 0.48, y: 0.08, confidence: 0.9 },
        { name: 'right_eye', x: 0.52, y: 0.08, confidence: 0.9 },
        { name: 'left_ear', x: 0.45, y: 0.09, confidence: 0.85 },
        { name: 'right_ear', x: 0.55, y: 0.09, confidence: 0.85 },
        { name: 'left_shoulder', x: 0.4, y: 0.25, confidence: 0.95 },
        { name: 'right_shoulder', x: 0.6, y: 0.25, confidence: 0.95 },
        { name: 'left_elbow', x: 0.35, y: 0.4 + cycle * 0.1, confidence: 0.9 },
        { name: 'right_elbow', x: 0.65, y: 0.4 + cycle * 0.1, confidence: 0.9 },
        { name: 'left_wrist', x: 0.3, y: 0.5 + cycle * 0.15, confidence: 0.85 },
        { name: 'right_wrist', x: 0.7, y: 0.5 + cycle * 0.15, confidence: 0.85 },
        { name: 'left_hip', x: 0.42, y: 0.55, confidence: 0.95 },
        { name: 'right_hip', x: 0.58, y: 0.55, confidence: 0.95 },
        { name: 'left_knee', x: 0.4, y: 0.75 - cycle * 0.1, confidence: 0.9 },
        { name: 'right_knee', x: 0.6, y: 0.75 - cycle * 0.1, confidence: 0.9 },
        { name: 'left_ankle', x: 0.38, y: 0.95, confidence: 0.85 },
        { name: 'right_ankle', x: 0.62, y: 0.95, confidence: 0.85 },
      ],
      confidence: 0.9,
    };
  };

  // Render loading state
  if (hasPermission === null || isModelLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.secondary }]}>
          {hasPermission === null
            ? 'Requesting camera permission...'
            : 'Loading pose detection model...'}
        </Text>
      </View>
    );
  }

  // Render permission denied
  if (hasPermission === false) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AlertCircle size={64} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.primary }]}>
          Camera permission denied
        </Text>
        <Text style={[styles.errorSubtext, { color: colors.secondary }]}>
          Please enable camera access in settings to use this feature.
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.accent }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.buttonText, { color: colors.background }]}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={cameraType}
        ratio="16:9"
      >
        {/* Pose Overlay */}
        {currentPose && isActive && !isPaused && (
          <PoseOverlay pose={currentPose} colors={colors} />
        )}

        {/* Top Controls */}
        <View
          style={[
            styles.topControls,
            { paddingTop: insets.top + spacing.md },
          ]}
        >
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: colors.surface }]}
            onPress={stopWorkout}
          >
            <X size={24} color={colors.primary} />
          </TouchableOpacity>

          <View style={[styles.exerciseInfo, { backgroundColor: colors.surface }]}>
            <Text style={[styles.exerciseName, { color: colors.primary }]}>
              {exercise?.name}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: colors.surface }]}
            onPress={toggleCamera}
          >
            <RotateCcw size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Metrics Display */}
        <View style={styles.metricsContainer}>
          <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.metricValue, { color: colors.accent }]}>
              {repCount}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.secondary }]}>
              Reps
            </Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.metricValue, { color: colors.accent }]}>
              {Math.round(formScore * 100)}%
            </Text>
            <Text style={[styles.metricLabel, { color: colors.secondary }]}>
              Form
            </Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.metricValue, { color: colors.accent }]}>
              {targetReps}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.secondary }]}>
              Target
            </Text>
          </View>
        </View>

        {/* Feedback Display */}
        {feedback.message && isActive && !isPaused && (
          <View style={styles.feedbackContainer}>
            <View
              style={[
                styles.feedbackCard,
                {
                  backgroundColor:
                    feedback.type === 'error'
                      ? colors.errorBg
                      : feedback.type === 'success'
                      ? colors.successBg
                      : colors.warningBg,
                },
              ]}
            >
              <Text
                style={[
                  styles.feedbackText,
                  {
                    color:
                      feedback.type === 'error'
                        ? colors.error
                        : feedback.type === 'success'
                        ? colors.success
                        : colors.warning,
                  },
                ]}
              >
                {feedback.message}
              </Text>
            </View>
          </View>
        )}

        {/* Bottom Controls */}
        <View
          style={[
            styles.bottomControls,
            { paddingBottom: insets.bottom + spacing.lg },
          ]}
        >
          {!isActive ? (
            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: colors.accent }]}
              onPress={startWorkout}
            >
              <Play size={32} color={colors.background} fill={colors.background} />
              <Text style={[styles.startButtonText, { color: colors.background }]}>
                Start Workout
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.pauseButton,
                { backgroundColor: isPaused ? colors.accent : colors.warning },
              ]}
              onPress={pauseWorkout}
            >
              {isPaused ? (
                <>
                  <Play size={28} color={colors.background} fill={colors.background} />
                  <Text style={[styles.pauseButtonText, { color: colors.background }]}>
                    Resume
                  </Text>
                </>
              ) : (
                <>
                  <Pause size={28} color={colors.background} fill={colors.background} />
                  <Text style={[styles.pauseButtonText, { color: colors.background }]}>
                    Pause
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Paused Overlay */}
        {isPaused && (
          <View style={styles.pausedOverlay}>
            <Text style={[styles.pausedText, { color: colors.background }]}>
              PAUSED
            </Text>
          </View>
        )}
      </Camera>
    </View>
  );
}

// Pose Visualization Overlay Component
function PoseOverlay({ pose, colors }) {
  if (!pose || !pose.keypoints) return null;

  const connections = [
    // Head
    ['nose', 'left_eye'],
    ['nose', 'right_eye'],
    ['left_eye', 'left_ear'],
    ['right_eye', 'right_ear'],
    // Torso
    ['left_shoulder', 'right_shoulder'],
    ['left_shoulder', 'left_hip'],
    ['right_shoulder', 'right_hip'],
    ['left_hip', 'right_hip'],
    // Arms
    ['left_shoulder', 'left_elbow'],
    ['left_elbow', 'left_wrist'],
    ['right_shoulder', 'right_elbow'],
    ['right_elbow', 'right_wrist'],
    // Legs
    ['left_hip', 'left_knee'],
    ['left_knee', 'left_ankle'],
    ['right_hip', 'right_knee'],
    ['right_knee', 'right_ankle'],
  ];

  const getKeypoint = (name) =>
    pose.keypoints.find((kp) => kp.name === name);

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Draw connections */}
      {connections.map(([start, end], index) => {
        const startKp = getKeypoint(start);
        const endKp = getKeypoint(end);

        if (
          !startKp ||
          !endKp ||
          startKp.confidence < 0.3 ||
          endKp.confidence < 0.3
        ) {
          return null;
        }

        return (
          <Line
            key={`line-${index}`}
            p1={vec(startKp.x * SCREEN_WIDTH, startKp.y * SCREEN_HEIGHT)}
            p2={vec(endKp.x * SCREEN_WIDTH, endKp.y * SCREEN_HEIGHT)}
            color={colors.accent}
            style="stroke"
            strokeWidth={3}
          />
        );
      })}

      {/* Draw keypoints */}
      {pose.keypoints.map((kp, index) => {
        if (kp.confidence < 0.3) return null;

        return (
          <Circle
            key={`point-${index}`}
            cx={kp.x * SCREEN_WIDTH}
            cy={kp.y * SCREEN_HEIGHT}
            r={6}
            color={colors.success}
          />
        );
      })}
    </Canvas>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  button: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.95,
  },
  exerciseInfo: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    opacity: 0.95,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  metricCard: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    opacity: 0.95,
    minWidth: 80,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  metricLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  feedbackContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: '50%',
    alignItems: 'center',
  },
  feedbackCard: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    opacity: 0.95,
  },
  feedbackText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 32,
    gap: 12,
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: '700',
  },
  pauseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
    gap: 10,
  },
  pauseButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  pausedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pausedText: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 8,
  },
});
