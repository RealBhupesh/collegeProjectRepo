// PoseDetectionService - Real-time pose detection using TensorFlow.js
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { cameraWithTensors } from '@tensorflow/tfjs-react-native';
import { Camera } from 'expo-camera';

class PoseDetectionService {
  constructor() {
    this.detector = null;
    this.isModelLoaded = false;
    this.isDetecting = false;
    this.lastDetectionTime = 0;
    this.detectionInterval = 100; // Detect every 100ms (10 FPS)
  }

  async initialize() {
    if (this.isModelLoaded) return;

    try {
      console.log('Initializing TensorFlow.js...');

      // Initialize TensorFlow
      await tf.ready();

      console.log('Loading pose detection model...');

      // Create detector with MoveNet model (faster and more accurate than PoseNet)
      // Using SinglePose Lightning for best performance on mobile
      this.detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          enableSmoothing: true,
          minPoseScore: 0.25,
        }
      );

      this.isModelLoaded = true;
      console.log('Pose detection model loaded successfully!');
    } catch (error) {
      console.error('Failed to initialize pose detection:', error);
      throw error;
    }
  }

  async detectPose(imageData, width, height) {
    if (!this.isModelLoaded || !this.detector) {
      throw new Error('Pose detection model not loaded');
    }

    // Throttle detection for performance
    const now = Date.now();
    if (now - this.lastDetectionTime < this.detectionInterval) {
      return null;
    }

    try {
      this.isDetecting = true;
      this.lastDetectionTime = now;

      // Convert image data to tensor
      const imageTensor = tf.browser.fromPixels(imageData);

      // Estimate pose
      const poses = await this.detector.estimatePoses(imageTensor, {
        maxPoses: 1,
        flipHorizontal: false,
      });

      // Clean up tensor
      imageTensor.dispose();

      if (poses && poses.length > 0) {
        const pose = poses[0];

        // Convert MoveNet keypoints to our format
        const normalizedKeypoints = this.normalizeMoveNetKeypoints(
          pose.keypoints,
          width,
          height
        );

        this.isDetecting = false;
        return {
          keypoints: normalizedKeypoints,
          confidence: pose.score || 0,
        };
      }

      this.isDetecting = false;
      return null;
    } catch (error) {
      console.error('Error during pose detection:', error);
      this.isDetecting = false;
      return null;
    }
  }

  // Convert MoveNet keypoint format to our app's format
  normalizeMoveNetKeypoints(keypoints, width, height) {
    // MoveNet keypoint names mapping
    const keypointNameMap = {
      0: 'nose',
      1: 'left_eye',
      2: 'right_eye',
      3: 'left_ear',
      4: 'right_ear',
      5: 'left_shoulder',
      6: 'right_shoulder',
      7: 'left_elbow',
      8: 'right_elbow',
      9: 'left_wrist',
      10: 'right_wrist',
      11: 'left_hip',
      12: 'right_hip',
      13: 'left_knee',
      14: 'right_knee',
      15: 'left_ankle',
      16: 'right_ankle',
    };

    return keypoints.map((kp, index) => ({
      name: keypointNameMap[index] || kp.name || `keypoint_${index}`,
      x: kp.x / width, // Normalize to 0-1
      y: kp.y / height, // Normalize to 0-1
      confidence: kp.score || 0,
    }));
  }

  setDetectionInterval(intervalMs) {
    this.detectionInterval = Math.max(50, intervalMs); // Min 50ms (20 FPS max)
  }

  async cleanup() {
    try {
      if (this.detector) {
        this.detector.dispose();
        this.detector = null;
      }
      this.isModelLoaded = false;
      this.isDetecting = false;
    } catch (error) {
      console.error('Error cleaning up pose detection:', error);
    }
  }

  getModelStatus() {
    return {
      isLoaded: this.isModelLoaded,
      isDetecting: this.isDetecting,
    };
  }
}

// Singleton instance
export const poseDetectionService = new PoseDetectionService();
export default PoseDetectionService;
