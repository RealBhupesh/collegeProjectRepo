// Core pose processing utilities for FormCoach
// This module provides mathematical functions for analyzing pose data

export class PoseProcessor {
  constructor() {
    // Smoothing buffer for keypoint positions (last N frames)
    this.smoothingBuffer = new Map();
    this.bufferSize = 5;
  }

  // Compute joint angle at pointB given three points
  computeJointAngle(pointA, pointB, pointC) {
    if (!pointA || !pointB || !pointC) return 0;

    // Vector from B to A
    const vectorBA = {
      x: pointA.x - pointB.x,
      y: pointA.y - pointB.y,
    };

    // Vector from B to C
    const vectorBC = {
      x: pointC.x - pointB.x,
      y: pointC.y - pointB.y,
    };

    // Calculate dot product
    const dotProduct = vectorBA.x * vectorBC.x + vectorBA.y * vectorBC.y;

    // Calculate magnitudes
    const magnitudeBA = Math.sqrt(vectorBA.x ** 2 + vectorBA.y ** 2);
    const magnitudeBC = Math.sqrt(vectorBC.x ** 2 + vectorBC.y ** 2);

    if (magnitudeBA === 0 || magnitudeBC === 0) return 0;

    // Calculate angle in radians
    const cosTheta = dotProduct / (magnitudeBA * magnitudeBC);
    const clampedCosTheta = Math.max(-1, Math.min(1, cosTheta)); // Clamp to avoid NaN
    const angleRadians = Math.acos(clampedCosTheta);

    // Convert to degrees
    return (angleRadians * 180) / Math.PI;
  }

  // Calculate distance from point to line defined by lineStart and lineEnd
  projectPointToLineDistance(point, lineStart, lineEnd) {
    if (!point || !lineStart || !lineEnd) return 0;

    const lineLength = Math.sqrt(
      (lineEnd.x - lineStart.x) ** 2 + (lineEnd.y - lineStart.y) ** 2,
    );

    if (lineLength === 0) return 0;

    // Calculate perpendicular distance using cross product
    const numerator = Math.abs(
      (lineEnd.y - lineStart.y) * point.x -
        (lineEnd.x - lineStart.x) * point.y +
        lineEnd.x * lineStart.y -
        lineEnd.y * lineStart.x,
    );

    return numerator / lineLength;
  }

  // Apply exponential moving average smoothing to keypoints
  smoothKeypoints(keypoints, frameId = Date.now()) {
    if (!keypoints || keypoints.length === 0) return keypoints;

    const smoothedKeypoints = keypoints.map((keypoint) => {
      const key = keypoint.name;

      if (!this.smoothingBuffer.has(key)) {
        this.smoothingBuffer.set(key, []);
      }

      const buffer = this.smoothingBuffer.get(key);

      // Add new point to buffer
      buffer.push({
        x: keypoint.x,
        y: keypoint.y,
        confidence: keypoint.confidence,
        frameId,
      });

      // Keep only recent frames
      if (buffer.length > this.bufferSize) {
        buffer.shift();
      }

      // Apply exponential moving average with confidence weighting
      let totalWeight = 0;
      let weightedX = 0;
      let weightedY = 0;

      for (let i = 0; i < buffer.length; i++) {
        const point = buffer[i];
        const age = buffer.length - 1 - i;
        const ageWeight = Math.exp(-age * 0.3); // Exponential decay
        const confidence = point.confidence || 0.5;
        const weight = ageWeight * confidence;

        weightedX += point.x * weight;
        weightedY += point.y * weight;
        totalWeight += weight;
      }

      if (totalWeight === 0) {
        return keypoint; // Return original if no valid data
      }

      return {
        ...keypoint,
        x: weightedX / totalWeight,
        y: weightedY / totalWeight,
      };
    });

    return smoothedKeypoints;
  }

  // Get keypoint by name from array
  getKeypoint(keypoints, name) {
    return keypoints.find((kp) => kp.name === name);
  }

  // Calculate body alignment score (0-1) for plank-like exercises
  calculateBodyAlignment(keypoints) {
    const shoulder =
      this.getKeypoint(keypoints, "left_shoulder") ||
      this.getKeypoint(keypoints, "right_shoulder");
    const hip =
      this.getKeypoint(keypoints, "left_hip") ||
      this.getKeypoint(keypoints, "right_hip");
    const knee =
      this.getKeypoint(keypoints, "left_knee") ||
      this.getKeypoint(keypoints, "right_knee");
    const ankle =
      this.getKeypoint(keypoints, "left_ankle") ||
      this.getKeypoint(keypoints, "right_ankle");

    if (!shoulder || !hip || !knee || !ankle) return 0;

    // Calculate how close the body is to a straight line
    const shoulderToAnkle = {
      x: ankle.x - shoulder.x,
      y: ankle.y - shoulder.y,
    };

    const alignmentScore =
      1 - Math.abs(this.projectPointToLineDistance(hip, shoulder, ankle)) * 2;
    return Math.max(0, Math.min(1, alignmentScore));
  }

  // Calculate center point between two keypoints
  getMidpoint(keypoint1, keypoint2) {
    if (!keypoint1 || !keypoint2) return null;

    return {
      x: (keypoint1.x + keypoint2.x) / 2,
      y: (keypoint1.y + keypoint2.y) / 2,
      confidence: Math.min(keypoint1.confidence, keypoint2.confidence),
    };
  }

  // Check if person is in side view (better for most exercises)
  isSideView(keypoints) {
    const leftShoulder = this.getKeypoint(keypoints, "left_shoulder");
    const rightShoulder = this.getKeypoint(keypoints, "right_shoulder");
    const leftHip = this.getKeypoint(keypoints, "left_hip");
    const rightHip = this.getKeypoint(keypoints, "right_hip");

    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return false;

    // Calculate shoulder and hip width in pixels
    const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
    const hipWidth = Math.abs(leftHip.x - rightHip.x);

    // If both widths are small, likely side view
    const avgWidth = (shoulderWidth + hipWidth) / 2;
    return avgWidth < 0.2; // Threshold for side view detection
  }

  // Reset smoothing buffers (useful when starting new exercise)
  reset() {
    this.smoothingBuffer.clear();
  }

  // Calculate confidence score for pose data quality
  calculatePoseConfidence(keypoints) {
    if (!keypoints || keypoints.length === 0) return 0;

    const relevantKeypoints = [
      "left_shoulder",
      "right_shoulder",
      "left_hip",
      "right_hip",
      "left_knee",
      "right_knee",
      "left_ankle",
      "right_ankle",
    ];

    let totalConfidence = 0;
    let count = 0;

    relevantKeypoints.forEach((name) => {
      const keypoint = this.getKeypoint(keypoints, name);
      if (keypoint) {
        totalConfidence += keypoint.confidence;
        count++;
      }
    });

    return count > 0 ? totalConfidence / count : 0;
  }
}

// Singleton instance for app-wide use
export const poseProcessor = new PoseProcessor();
