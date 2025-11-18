// Data models for FormCoach app

// ExerciseType interface
// {
//   id: string,
//   name: string,
//   description: string,
//   icon: string, // Icon name from lucide-react-native
//   supportedMetrics: string[], // e.g., ["reps", "time", "avgDepthScore"]
//   category: 'strength' | 'flexibility' | 'cardio',
//   difficulty: 'beginner' | 'intermediate' | 'advanced'
// }

// ExerciseSession interface
// {
//   id: string,
//   exerciseTypeId: string,
//   startTime: Date,
//   endTime: Date,
//   totalReps: number, // 0 for time-based exercises like plank
//   totalDuration: number, // in seconds
//   averageFormScore: number, // 0-1 range
//   issuesSummary: string[], // Most common form issues
//   rawMetrics?: string // JSON blob for future analysis
// }

// RepEvent interface
// {
//   index: number,
//   timestamp: Date,
//   depthScore: number, // 0-1 range
//   formIssues: string[]
// }

// PoseFrame interface
// {
//   timestamp: Date,
//   keypoints: Keypoint[],
//   confidence: number
// }

// Keypoint interface
// {
//   x: number, // normalized coordinates (0-1)
//   y: number, // normalized coordinates (0-1)
//   confidence: number, // 0-1 range
//   name: KeypointName
// }

// KeypointName options:
// 'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
// 'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
// 'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
// 'left_knee', 'right_knee', 'left_ankle', 'right_ankle'

// Exercise state machine states: 'Top', 'GoingDown', 'Bottom', 'GoingUp', 'Hold'

// Form feedback priorities (higher number = higher priority)
// FormFeedback interface
// {
//   message: string,
//   priority: number,
//   type: 'error' | 'warning' | 'success'
// }

export const EXERCISE_TYPES = [
  {
    id: "pushups",
    name: "Push-ups",
    description: "Build upper body strength with proper push-up form",
    icon: "Dumbbell",
    supportedMetrics: ["reps", "avgDepthScore"],
    category: "strength",
    difficulty: "beginner",
  },
  {
    id: "squats",
    name: "Squats",
    description: "Strengthen your legs and glutes with perfect squat form",
    icon: "Activity",
    supportedMetrics: ["reps", "avgDepthScore"],
    category: "strength",
    difficulty: "beginner",
  },
  {
    id: "plank",
    name: "Plank",
    description: "Core stability exercise with focus on proper alignment",
    icon: "Timer",
    supportedMetrics: ["time", "avgFormScore"],
    category: "strength",
    difficulty: "beginner",
  },
  {
    id: "lunges",
    name: "Lunges",
    description: "Unilateral leg strength with balance and coordination",
    icon: "Zap",
    supportedMetrics: ["reps", "avgDepthScore"],
    category: "strength",
    difficulty: "intermediate",
  },
];

export const DEFAULT_SETTINGS = {
  soundEnabled: true,
  vibrationEnabled: true,
  units: "metric",
  cameraPermissionGranted: false,
  onboardingCompleted: false,
};
