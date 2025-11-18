// Feedback management for real-time exercise coaching
// Handles prioritization and throttling of feedback messages

export class FeedbackManager {
  constructor() {
    this.lastFeedbackTime = 0;
    this.feedbackCooldown = 2000; // 2 seconds between feedback changes
    this.currentMessage = "";
    this.messageStartTime = 0;
    this.goodFormStreakStart = 0;
    this.showPositiveFeedback = false;
    this.positiveFeedbackInterval = 5000; // Show positive feedback every 5 seconds of good form
  }

  // Process form issues and return appropriate feedback message
  processFeedback(formIssues, formScore, exerciseState = "Active") {
    const now = Date.now();

    // If no issues and good form score, track good form streak
    if (formIssues.length === 0 && formScore > 0.8) {
      if (this.goodFormStreakStart === 0) {
        this.goodFormStreakStart = now;
      }

      // Show positive feedback periodically during good form
      if (
        now - this.goodFormStreakStart > this.positiveFeedbackInterval &&
        now - this.lastFeedbackTime > this.feedbackCooldown
      ) {
        const positiveMessages = [
          "Nice form, keep going!",
          "Great technique!",
          "Perfect alignment!",
          "Excellent control!",
          "Keep it up!",
        ];

        const message =
          positiveMessages[Math.floor(Math.random() * positiveMessages.length)];
        this.updateMessage(message, now);
        this.goodFormStreakStart = now; // Reset streak timer
        return {
          message,
          type: "success",
          priority: 1,
        };
      }

      return {
        message: this.currentMessage,
        type: "success",
        priority: 1,
      };
    } else {
      // Reset good form streak if form deteriorates
      this.goodFormStreakStart = 0;
    }

    // No issues but waiting in cooldown
    if (formIssues.length === 0) {
      return {
        message: this.currentMessage,
        type: "success",
        priority: 1,
      };
    }

    // Prioritize form issues
    const prioritizedIssue = this.prioritizeIssues(formIssues);

    // Check if we're in cooldown period
    if (
      now - this.lastFeedbackTime < this.feedbackCooldown &&
      this.currentMessage === prioritizedIssue.message
    ) {
      return {
        message: this.currentMessage,
        type: prioritizedIssue.type,
        priority: prioritizedIssue.priority,
      };
    }

    // Update message if enough time has passed or if it's high priority
    if (
      now - this.lastFeedbackTime >= this.feedbackCooldown ||
      prioritizedIssue.priority >= 5
    ) {
      this.updateMessage(prioritizedIssue.message, now);
    }

    return prioritizedIssue;
  }

  // Prioritize issues based on importance and safety
  prioritizeIssues(issues) {
    // Define priority levels for different types of feedback
    const priorityMap = {
      // Safety issues (highest priority)
      "Keep your knee over your ankle": 8,
      "Keep your chest up and back straighter": 7,

      // Major form issues
      "Position yourself in side view": 6,
      "Get into plank position": 6,
      "Go a bit deeper": 5,
      "Go a bit deeper into the squat": 5,
      "Lower down deeper into the lunge": 5,

      // Alignment issues
      "Raise your hips slightly": 4,
      "Lower your hips slightly": 4,
      "Raise your hips a little": 4,
      "Lower your hips to form a straight line": 4,
      "Straighten your arms at the top": 4,

      // Fine-tuning
      "Align your hands evenly": 3,
      "Push your knees slightly outward": 3,
      "Try to keep your heels down": 2,
    };

    // Find highest priority issue
    let highestPriorityIssue = issues[0];
    let highestPriority = priorityMap[highestPriorityIssue] || 1;

    for (const issue of issues) {
      const priority = priorityMap[issue] || 1;
      if (priority > highestPriority) {
        highestPriorityIssue = issue;
        highestPriority = priority;
      }
    }

    // Determine feedback type based on priority
    let type = "warning";
    if (highestPriority >= 7) {
      type = "error";
    } else if (highestPriority <= 3) {
      type = "info";
    }

    return {
      message: highestPriorityIssue,
      priority: highestPriority,
      type,
    };
  }

  // Update current message and timing
  updateMessage(message, timestamp) {
    if (this.currentMessage !== message) {
      this.currentMessage = message;
      this.messageStartTime = timestamp;
      this.lastFeedbackTime = timestamp;
    }
  }

  // Get current feedback state
  getCurrentFeedback() {
    return {
      message: this.currentMessage,
      age: Date.now() - this.messageStartTime,
      isInCooldown: Date.now() - this.lastFeedbackTime < this.feedbackCooldown,
    };
  }

  // Reset feedback state (useful when starting new exercise)
  reset() {
    this.lastFeedbackTime = 0;
    this.currentMessage = "";
    this.messageStartTime = 0;
    this.goodFormStreakStart = 0;
    this.showPositiveFeedback = false;
  }

  // Force immediate feedback (bypasses cooldown)
  forceImmediate(message, type = "info") {
    const now = Date.now();
    this.updateMessage(message, now);
    return {
      message,
      type,
      priority: 10,
      forced: true,
    };
  }

  // Get exercise-specific tips based on common issues
  getExerciseTips(exerciseTypeId, commonIssues) {
    const tipMap = {
      pushups: {
        "Raise your hips slightly":
          "Focus on keeping your body in a straight line from head to heels.",
        "Go a bit deeper":
          "Lower your chest closer to the ground for a full range of motion.",
        "Straighten your arms at the top":
          "Fully extend your arms at the top of each push-up.",
        "Align your hands evenly":
          "Place your hands directly under your shoulders.",
      },
      squats: {
        "Go a bit deeper into the squat":
          "Lower until your thighs are parallel to the ground.",
        "Push your knees slightly outward":
          "Keep your knees in line with your toes.",
        "Keep your chest up and back straighter":
          "Maintain an upright torso throughout the movement.",
      },
      plank: {
        "Raise your hips a little":
          "Your body should form a straight line from head to heels.",
        "Lower your hips to form a straight line":
          "Engage your core to maintain proper alignment.",
      },
      lunges: {
        "Keep your knee over your ankle":
          "Step far enough forward so your knee stays above your ankle.",
        "Lower down deeper into the lunge":
          "Lower your back knee toward the ground for better depth.",
      },
    };

    const exerciseTips = tipMap[exerciseTypeId] || {};
    return commonIssues.map((issue) => exerciseTips[issue]).filter(Boolean);
  }
}

// Create singleton instance for app-wide use
export const feedbackManager = new FeedbackManager();
