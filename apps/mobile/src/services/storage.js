import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_SETTINGS } from "../types/index";

// Storage keys
const KEYS = {
  SETTINGS: "formcoach_settings",
  SESSIONS: "formcoach_sessions",
  LAST_SESSION_PREFIX: "formcoach_last_session_",
};

// Settings management
export const settingsStorage = {
  async get() {
    try {
      const stored = await AsyncStorage.getItem(KEYS.SETTINGS);
      if (!stored) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch (error) {
      console.error("Failed to load settings:", error);
      return DEFAULT_SETTINGS;
    }
  },

  async update(updates) {
    try {
      const current = await this.get();
      const updated = { ...current, ...updates };
      await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(updated));
      return updated;
    } catch (error) {
      console.error("Failed to update settings:", error);
      throw error;
    }
  },

  async reset() {
    try {
      await AsyncStorage.setItem(
        KEYS.SETTINGS,
        JSON.stringify(DEFAULT_SETTINGS),
      );
      return DEFAULT_SETTINGS;
    } catch (error) {
      console.error("Failed to reset settings:", error);
      throw error;
    }
  },
};

// Session history management
export const sessionStorage = {
  async getAllSessions() {
    try {
      const stored = await AsyncStorage.getItem(KEYS.SESSIONS);
      if (!stored) return [];

      const sessions = JSON.parse(stored);
      // Convert string dates back to Date objects
      return sessions.map((session) => ({
        ...session,
        startTime: new Date(session.startTime),
        endTime: new Date(session.endTime),
      }));
    } catch (error) {
      console.error("Failed to load sessions:", error);
      return [];
    }
  },

  async addSession(session) {
    try {
      const sessions = await this.getAllSessions();
      const newSession = {
        ...session,
        id:
          session.id ||
          `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      sessions.push(newSession);
      // Keep only the last 100 sessions to prevent storage bloat
      const trimmed = sessions.slice(-100);

      await AsyncStorage.setItem(KEYS.SESSIONS, JSON.stringify(trimmed));

      // Store last session for this exercise type
      await this.setLastSessionForExercise(session.exerciseTypeId, newSession);

      return newSession;
    } catch (error) {
      console.error("Failed to save session:", error);
      throw error;
    }
  },

  async getRecentSessions(limit = 10) {
    try {
      const sessions = await this.getAllSessions();
      return sessions
        .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
        .slice(0, limit);
    } catch (error) {
      console.error("Failed to get recent sessions:", error);
      return [];
    }
  },

  async getSessionsForExercise(exerciseTypeId, limit = 20) {
    try {
      const sessions = await this.getAllSessions();
      return sessions
        .filter((session) => session.exerciseTypeId === exerciseTypeId)
        .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
        .slice(0, limit);
    } catch (error) {
      console.error("Failed to get sessions for exercise:", error);
      return [];
    }
  },

  async setLastSessionForExercise(exerciseTypeId, session) {
    try {
      const key = KEYS.LAST_SESSION_PREFIX + exerciseTypeId;
      await AsyncStorage.setItem(key, JSON.stringify(session));
    } catch (error) {
      console.error("Failed to save last session for exercise:", error);
    }
  },

  async getLastSessionForExercise(exerciseTypeId) {
    try {
      const key = KEYS.LAST_SESSION_PREFIX + exerciseTypeId;
      const stored = await AsyncStorage.getItem(key);
      if (!stored) return null;

      const session = JSON.parse(stored);
      return {
        ...session,
        startTime: new Date(session.startTime),
        endTime: new Date(session.endTime),
      };
    } catch (error) {
      console.error("Failed to get last session for exercise:", error);
      return null;
    }
  },

  async clearAllSessions() {
    try {
      await AsyncStorage.setItem(KEYS.SESSIONS, JSON.stringify([]));

      // Clear all last session data
      const keys = await AsyncStorage.getAllKeys();
      const lastSessionKeys = keys.filter((key) =>
        key.startsWith(KEYS.LAST_SESSION_PREFIX),
      );
      await AsyncStorage.multiRemove(lastSessionKeys);
    } catch (error) {
      console.error("Failed to clear sessions:", error);
      throw error;
    }
  },
};

// Utility functions for date formatting and statistics
export const storageUtils = {
  formatDuration(seconds) {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  },

  formatScore(score) {
    return Math.round(score * 100);
  },

  async getExerciseStats(exerciseTypeId) {
    try {
      const sessions =
        await sessionStorage.getSessionsForExercise(exerciseTypeId);
      if (sessions.length === 0) return null;

      const totalSessions = sessions.length;
      const totalReps = sessions.reduce(
        (sum, session) => sum + session.totalReps,
        0,
      );
      const totalDuration = sessions.reduce(
        (sum, session) => sum + session.totalDuration,
        0,
      );
      const avgFormScore =
        sessions.reduce((sum, session) => sum + session.averageFormScore, 0) /
        totalSessions;

      return {
        totalSessions,
        totalReps,
        totalDuration,
        avgFormScore,
        lastSession: sessions[0], // Most recent
      };
    } catch (error) {
      console.error("Failed to get exercise stats:", error);
      return null;
    }
  },
};
