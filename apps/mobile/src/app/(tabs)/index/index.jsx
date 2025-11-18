import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useFonts,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
} from "@expo-google-fonts/montserrat";
import { router } from "expo-router";
import {
  Dumbbell,
  Activity,
  Timer,
  Zap,
  ChevronRight,
} from "lucide-react-native";
import { useAppTheme } from "@/utils/theme";
import { EXERCISE_TYPES } from "@/types/index";
import { sessionStorage, storageUtils } from "@/services/storage";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors, typography, spacing, borderRadius, shadows, isDark } =
    useAppTheme();

  const [lastSessions, setLastSessions] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const [fontsLoaded] = useFonts({
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });

  useEffect(() => {
    loadLastSessions();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  const loadLastSessions = async () => {
    try {
      const sessions = {};
      for (const exercise of EXERCISE_TYPES) {
        const lastSession = await sessionStorage.getLastSessionForExercise(
          exercise.id,
        );
        if (lastSession) {
          sessions[exercise.id] = lastSession;
        }
      }
      setLastSessions(sessions);
    } catch (error) {
      console.error("Failed to load last sessions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getExerciseIcon = (iconName) => {
    const iconMap = {
      Dumbbell: Dumbbell,
      Activity: Activity,
      Timer: Timer,
      Zap: Zap,
    };
    return iconMap[iconName] || Dumbbell;
  };

  const getExerciseColor = (exerciseId) => {
    const colorMap = {
      pushups: colors.pushupAccent,
      squats: colors.squatAccent,
      plank: colors.plankAccent,
      lunges: colors.lungeAccent,
    };
    return colorMap[exerciseId] || colors.accent;
  };

  const formatLastSession = (session, exercise) => {
    if (!session) return "No previous sessions";

    const isTimeBasedExercise = exercise.supportedMetrics.includes("time");
    const formScore = storageUtils.formatScore(session.averageFormScore);

    if (isTimeBasedExercise) {
      const duration = storageUtils.formatDuration(session.totalDuration);
      return `Last: ${duration}, form ${formScore}%`;
    } else {
      const reps = session.totalReps;
      return `Last: ${reps} reps, form ${formScore}%`;
    }
  };

  const ExerciseCard = ({ exercise }) => {
    const Icon = getExerciseIcon(exercise.icon);
    const accentColor = getExerciseColor(exercise.id);
    const lastSession = lastSessions[exercise.id];

    return (
      <TouchableOpacity
        style={{
          backgroundColor: colors.surface,
          borderRadius: borderRadius.xl,
          padding: spacing.lg,
          marginBottom: spacing.md,
          ...shadows.md,
        }}
        onPress={() => router.push(`/(tabs)/workout/${exercise.id}`)}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: borderRadius.lg,
              backgroundColor: `${accentColor}20`,
              justifyContent: "center",
              alignItems: "center",
              marginRight: spacing.md,
            }}
          >
            <Icon size={28} color={accentColor} />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                ...typography.headline,
                color: colors.primary,
                marginBottom: spacing.xs,
              }}
            >
              {exercise.name}
            </Text>

            <Text
              style={{
                ...typography.callout,
                color: colors.secondary,
                marginBottom: spacing.sm,
              }}
            >
              {exercise.description}
            </Text>

            <Text
              style={{
                ...typography.caption,
                color: colors.tertiary,
              }}
            >
              {formatLastSession(lastSession, exercise)}
            </Text>
          </View>

          <ChevronRight size={20} color={colors.tertiary} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View
        style={{
          backgroundColor: colors.background,
          paddingTop: insets.top + spacing.lg,
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.md,
        }}
      >
        <Text
          style={{
            ...typography.largeTitle,
            color: colors.primary,
            marginBottom: spacing.xs,
          }}
        >
          FormCoach
        </Text>

        <Text
          style={{
            ...typography.body,
            color: colors.secondary,
          }}
        >
          Choose an exercise to start training
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Exercise Cards */}
        <View style={{ marginTop: spacing.md }}>
          <Text
            style={{
              ...typography.title3,
              color: colors.primary,
              marginBottom: spacing.lg,
            }}
          >
            Available Exercises
          </Text>

          {EXERCISE_TYPES.map((exercise) => (
            <ExerciseCard key={exercise.id} exercise={exercise} />
          ))}
        </View>

        {/* Getting Started Tips */}
        <View
          style={{
            backgroundColor: colors.infoBg,
            borderRadius: borderRadius.lg,
            padding: spacing.lg,
            marginTop: spacing.xl,
          }}
        >
          <Text
            style={{
              ...typography.headline,
              color: colors.info,
              marginBottom: spacing.sm,
            }}
          >
            Getting Started Tips
          </Text>

          <Text
            style={{
              ...typography.callout,
              color: colors.secondary,
              lineHeight: 20,
              marginBottom: spacing.sm,
            }}
          >
            • Position yourself in side view for best analysis{"\n"}• Ensure
            good lighting and clear camera view{"\n"}• Follow the real-time
            feedback for proper form
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
