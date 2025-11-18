// Exercise-specific analyzers with state machines and form feedback
import { poseProcessor } from "./PoseProcessor";

// Base class for exercise analyzers
class BaseExerciseAnalyzer {
  constructor(exerciseType) {
    this.exerciseType = exerciseType;
    this.state = "Top"; // Initial state
    this.repCount = 0;
    this.formIssues = [];
    this.formScore = 1.0;
    this.stateStartTime = Date.now();
    this.minTransitionTime = 300; // Minimum time between state changes (ms)
  }

  reset() {
    this.state = "Top";
    this.repCount = 0;
    this.formIssues = [];
    this.formScore = 1.0;
    this.stateStartTime = Date.now();
    poseProcessor.reset();
  }

  // Abstract method to be implemented by subclasses
  analyze(keypoints) {
    throw new Error("analyze method must be implemented by subclass");
  }

  // Check if enough time has passed for state transition
  canTransition() {
    return Date.now() - this.stateStartTime >= this.minTransitionTime;
  }

  // Change state and update timing
  setState(newState) {
    if (this.state !== newState) {
      this.state = newState;
      this.stateStartTime = Date.now();
    }
  }

  getResults() {
    return {
      repCount: this.repCount,
      formScore: this.formScore,
      formIssues: [...this.formIssues],
      state: this.state,
    };
  }
}

// Push-ups analyzer
export class PushupAnalyzer extends BaseExerciseAnalyzer {
  constructor() {
    super("pushups");
    this.bottomThreshold = 70; // Degrees
    this.topThreshold = 150; // Degrees
    this.deepThreshold = 60; // For depth feedback
    this.fullExtensionThreshold = 160;
  }

  analyze(keypoints) {
    const smoothedKeypoints = poseProcessor.smoothKeypoints(keypoints);

    // Get relevant keypoints
    const leftShoulder = poseProcessor.getKeypoint(
      smoothedKeypoints,
      "left_shoulder",
    );
    const leftElbow = poseProcessor.getKeypoint(
      smoothedKeypoints,
      "left_elbow",
    );
    const leftWrist = poseProcessor.getKeypoint(
      smoothedKeypoints,
      "left_wrist",
    );
    const rightShoulder = poseProcessor.getKeypoint(
      smoothedKeypoints,
      "right_shoulder",
    );
    const rightElbow = poseProcessor.getKeypoint(
      smoothedKeypoints,
      "right_elbow",
    );
    const rightWrist = poseProcessor.getKeypoint(
      smoothedKeypoints,
      "right_wrist",
    );
    const leftHip = poseProcessor.getKeypoint(smoothedKeypoints, "left_hip");
    const leftAnkle = poseProcessor.getKeypoint(
      smoothedKeypoints,
      "left_ankle",
    );

    this.formIssues = [];

    if (!leftShoulder || !leftElbow || !leftWrist) {
      this.formIssues.push("Position yourself in side view");
      return this.getResults();
    }

    // Calculate elbow angle
    const elbowAngle = poseProcessor.computeJointAngle(
      leftShoulder,
      leftElbow,
      leftWrist,
    );

    // Check body alignment (hips in line with shoulders and ankles)
    if (leftHip && leftAnkle) {
      const hipDistance = poseProcessor.projectPointToLineDistance(
        leftHip,
        leftShoulder,
        leftAnkle,
      );
      if (hipDistance > 0.05) {
        // Threshold for hip alignment
        if (leftHip.y > leftShoulder.y + 0.05) {
          this.formIssues.push("Raise your hips slightly");
        } else if (leftHip.y < leftShoulder.y - 0.05) {
          this.formIssues.push("Lower your hips slightly");
        }
      }
    }

    // Check hand symmetry
    if (rightWrist && rightShoulder) {
      const leftHandOffset = Math.abs(leftWrist.x - leftShoulder.x);
      const rightHandOffset = Math.abs(rightWrist.x - rightShoulder.x);
      if (Math.abs(leftHandOffset - rightHandOffset) > 0.1) {
        this.formIssues.push("Align your hands evenly");
      }
    }

    // State machine logic
    switch (this.state) {
      case "Top":
        if (elbowAngle < this.bottomThreshold && this.canTransition()) {
          this.setState("GoingDown");
        }
        // Check for incomplete lockout
        if (elbowAngle < this.fullExtensionThreshold) {
          this.formIssues.push("Straighten your arms at the top");
        }
        break;

      case "GoingDown":
        if (elbowAngle < this.bottomThreshold) {
          this.setState("Bottom");
        } else if (elbowAngle > this.topThreshold) {
          this.setState("Top"); // Returned without reaching bottom
        }
        break;

      case "Bottom":
        if (elbowAngle > this.topThreshold && this.canTransition()) {
          this.repCount++;
          this.setState("GoingUp");
        }
        // Check depth
        if (elbowAngle > this.deepThreshold) {
          this.formIssues.push("Go a bit deeper");
        }
        break;

      case "GoingUp":
        if (elbowAngle > this.topThreshold) {
          this.setState("Top");
        }
        break;
    }

    // Calculate form score based on issues
    this.formScore = Math.max(0.3, 1.0 - this.formIssues.length * 0.2);

    return this.getResults();
  }
}

// Squats analyzer
export class SquatAnalyzer extends BaseExerciseAnalyzer {
  constructor() {
    super("squats");
    this.bottomThreshold = 80; // Knee angle degrees
    this.topThreshold = 160;
    this.depthThreshold = 70;
  }

  analyze(keypoints) {
    const smoothedKeypoints = poseProcessor.smoothKeypoints(keypoints);

    const leftHip = poseProcessor.getKeypoint(smoothedKeypoints, "left_hip");
    const leftKnee = poseProcessor.getKeypoint(smoothedKeypoints, "left_knee");
    const leftAnkle = poseProcessor.getKeypoint(
      smoothedKeypoints,
      "left_ankle",
    );
    const leftShoulder = poseProcessor.getKeypoint(
      smoothedKeypoints,
      "left_shoulder",
    );
    const rightKnee = poseProcessor.getKeypoint(
      smoothedKeypoints,
      "right_knee",
    );
    const rightAnkle = poseProcessor.getKeypoint(
      smoothedKeypoints,
      "right_ankle",
    );

    this.formIssues = [];

    if (!leftHip || !leftKnee || !leftAnkle) {
      this.formIssues.push("Position yourself in side view");
      return this.getResults();
    }

    // Calculate knee angle
    const kneeAngle = poseProcessor.computeJointAngle(
      leftHip,
      leftKnee,
      leftAnkle,
    );

    // Check squat depth (hip below knee level)
    if (this.state === "Bottom" && leftHip.y < leftKnee.y + 0.02) {
      this.formIssues.push("Go a bit deeper into the squat");
    }

    // Check knee tracking (knees shouldn't cave inward)
    if (rightKnee && rightAnkle) {
      const leftKneeAnkleDistance = Math.abs(leftKnee.x - leftAnkle.x);
      const rightKneeAnkleDistance = Math.abs(rightKnee.x - rightAnkle.x);

      if (leftKneeAnkleDistance < 0.02 || rightKneeAnkleDistance < 0.02) {
        this.formIssues.push("Push your knees slightly outward");
      }
    }

    // Check back posture
    if (leftShoulder) {
      const torsoAngle =
        (Math.atan2(leftHip.y - leftShoulder.y, leftHip.x - leftShoulder.x) *
          180) /
        Math.PI;

      if (Math.abs(torsoAngle) > 30) {
        // Too much forward lean
        this.formIssues.push("Keep your chest up and back straighter");
      }
    }

    // State machine logic
    switch (this.state) {
      case "Top":
        if (kneeAngle < this.bottomThreshold && this.canTransition()) {
          this.setState("GoingDown");
        }
        break;

      case "GoingDown":
        if (kneeAngle < this.bottomThreshold) {
          this.setState("Bottom");
        } else if (kneeAngle > this.topThreshold) {
          this.setState("Top");
        }
        break;

      case "Bottom":
        if (kneeAngle > this.topThreshold && this.canTransition()) {
          this.repCount++;
          this.setState("GoingUp");
        }
        break;

      case "GoingUp":
        if (kneeAngle > this.topThreshold) {
          this.setState("Top");
        }
        break;
    }

    this.formScore = Math.max(0.3, 1.0 - this.formIssues.length * 0.2);
    return this.getResults();
  }
}

// Plank analyzer (time-based)
export class PlankAnalyzer extends BaseExerciseAnalyzer {
  constructor() {
    super("plank");
    this.state = "Hold";
    this.isInPosition = false;
    this.timeInGoodForm = 0;
    this.totalTime = 0;
    this.lastFrameTime = Date.now();
  }

  analyze(keypoints) {
    const smoothedKeypoints = poseProcessor.smoothKeypoints(keypoints);
    const alignmentScore =
      poseProcessor.calculateBodyAlignment(smoothedKeypoints);

    this.formIssues = [];
    const now = Date.now();
    const deltaTime = now - this.lastFrameTime;
    this.lastFrameTime = now;

    // Check if user is in plank position
    const leftShoulder = poseProcessor.getKeypoint(
      smoothedKeypoints,
      "left_shoulder",
    );
    const leftHip = poseProcessor.getKeypoint(smoothedKeypoints, "left_hip");
    const leftAnkle = poseProcessor.getKeypoint(
      smoothedKeypoints,
      "left_ankle",
    );

    if (!leftShoulder || !leftHip || !leftAnkle) {
      this.formIssues.push("Get into plank position");
      this.isInPosition = false;
      return this.getResults();
    }

    // Check body alignment
    const hipDistance = poseProcessor.projectPointToLineDistance(
      leftHip,
      leftShoulder,
      leftAnkle,
    );

    if (hipDistance > 0.08) {
      if (leftHip.y > leftShoulder.y) {
        this.formIssues.push("Raise your hips a little");
      } else {
        this.formIssues.push("Lower your hips to form a straight line");
      }
      this.isInPosition = false;
    } else {
      this.isInPosition = true;
    }

    // Track time
    this.totalTime += deltaTime;

    if (this.isInPosition && this.formIssues.length === 0) {
      this.timeInGoodForm += deltaTime;
    }

    // Calculate form score as percentage of time in good form
    this.formScore =
      this.totalTime > 0 ? this.timeInGoodForm / this.totalTime : 0;

    return {
      ...this.getResults(),
      totalTime: Math.floor(this.totalTime / 1000), // Convert to seconds
      timeInGoodForm: Math.floor(this.timeInGoodForm / 1000),
      isInPosition: this.isInPosition,
    };
  }

  reset() {
    super.reset();
    this.isInPosition = false;
    this.timeInGoodForm = 0;
    this.totalTime = 0;
    this.lastFrameTime = Date.now();
  }
}

// Lunge analyzer
export class LungeAnalyzer extends BaseExerciseAnalyzer {
  constructor() {
    super("lunges");
    this.bottomThreshold = 80; // Front knee angle
    this.topThreshold = 160;
  }

  analyze(keypoints) {
    const smoothedKeypoints = poseProcessor.smoothKeypoints(keypoints);

    // For lunges, we analyze the front leg (assume left leg forward)
    const leftHip = poseProcessor.getKeypoint(smoothedKeypoints, "left_hip");
    const leftKnee = poseProcessor.getKeypoint(smoothedKeypoints, "left_knee");
    const leftAnkle = poseProcessor.getKeypoint(
      smoothedKeypoints,
      "left_ankle",
    );

    this.formIssues = [];

    if (!leftHip || !leftKnee || !leftAnkle) {
      this.formIssues.push("Position yourself in side view");
      return this.getResults();
    }

    // Calculate front knee angle
    const frontKneeAngle = poseProcessor.computeJointAngle(
      leftHip,
      leftKnee,
      leftAnkle,
    );

    // Check knee tracking (knee shouldn't go too far forward)
    if (leftKnee.x > leftAnkle.x + 0.05) {
      this.formIssues.push("Keep your knee over your ankle");
    }

    // Check depth
    if (this.state === "Bottom" && frontKneeAngle > 80) {
      this.formIssues.push("Lower down deeper into the lunge");
    }

    // State machine (similar to squats)
    switch (this.state) {
      case "Top":
        if (frontKneeAngle < this.bottomThreshold && this.canTransition()) {
          this.setState("GoingDown");
        }
        break;

      case "GoingDown":
        if (frontKneeAngle < this.bottomThreshold) {
          this.setState("Bottom");
        }
        break;

      case "Bottom":
        if (frontKneeAngle > this.topThreshold && this.canTransition()) {
          this.repCount++;
          this.setState("GoingUp");
        }
        break;

      case "GoingUp":
        if (frontKneeAngle > this.topThreshold) {
          this.setState("Top");
        }
        break;
    }

    this.formScore = Math.max(0.3, 1.0 - this.formIssues.length * 0.2);
    return this.getResults();
  }
}

// Factory function to create analyzer for exercise type
export function createAnalyzer(exerciseTypeId) {
  switch (exerciseTypeId) {
    case "pushups":
      return new PushupAnalyzer();
    case "squats":
      return new SquatAnalyzer();
    case "plank":
      return new PlankAnalyzer();
    case "lunges":
      return new LungeAnalyzer();
    default:
      throw new Error(`Unknown exercise type: ${exerciseTypeId}`);
  }
}
